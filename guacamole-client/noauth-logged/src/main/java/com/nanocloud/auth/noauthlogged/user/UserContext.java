package com.nanocloud.auth.noauthlogged.user;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.*;

import com.nanocloud.auth.noauthlogged.NoAuthLoggedGuacamoleProperties;
import com.nanocloud.auth.noauthlogged.connection.LoggedConnection;
import org.glyptodon.guacamole.GuacamoleException;
import org.glyptodon.guacamole.environment.LocalEnvironment;
import org.glyptodon.guacamole.form.Form;
import org.glyptodon.guacamole.net.auth.ActiveConnection;
import org.glyptodon.guacamole.net.auth.AuthenticatedUser;
import org.glyptodon.guacamole.net.auth.AuthenticationProvider;
import org.glyptodon.guacamole.net.auth.Connection;
import org.glyptodon.guacamole.net.auth.ConnectionGroup;
import org.glyptodon.guacamole.net.auth.Directory;
import org.glyptodon.guacamole.net.auth.User;
import org.glyptodon.guacamole.net.auth.simple.*;
import org.glyptodon.guacamole.net.auth.ConnectionRecordSet;
import org.glyptodon.guacamole.protocol.GuacamoleConfiguration;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class UserContext implements org.glyptodon.guacamole.net.auth.UserContext {

	private final String hostname;
	private final Integer port;
	private final String endpoint;

	/**
	 * The unique identifier of the root connection group.
	 */
	private static final String ROOT_IDENTIFIER = "ROOT";
	private final LocalEnvironment environment;
	private final AuthenticatedUser authenticatedUser;
	private final SimpleUserDirectory userDirectory;
	private final SimpleConnectionGroupDirectory connectionGroupDirectory;
	private final SimpleConnectionGroup rootGroup;

	/**
	 * Logger for this class.
	 */
	private Logger logger = LoggerFactory.getLogger(UserContext.class);

	private User self;
	private AuthenticationProvider authProvider;

	public UserContext(AuthenticationProvider authProvider,
					   AuthenticatedUser authenticatedUser) throws GuacamoleException {

		environment = new LocalEnvironment();
		this.authenticatedUser = authenticatedUser;

		hostname = environment.getProperty(NoAuthLoggedGuacamoleProperties.NOAUTHLOGGED_SERVERURL, "localhost");
		port = environment.getProperty(NoAuthLoggedGuacamoleProperties.NOAUTHLOGGED_SERVERPORT, 80);
		endpoint = environment.getProperty(NoAuthLoggedGuacamoleProperties.NOAUTHLOGGED_SERVERENDPOINT, "rpc");

		this.self = new SimpleUser(authenticatedUser.getIdentifier(), new ArrayList<String>(0),
				Collections.singleton(ROOT_IDENTIFIER));

		this.rootGroup = new SimpleConnectionGroup(
				ROOT_IDENTIFIER, ROOT_IDENTIFIER,
				new ArrayList<String>(0), Collections.<String>emptyList()
		);
		this.userDirectory = new SimpleUserDirectory(self);
		this.connectionGroupDirectory = new SimpleConnectionGroupDirectory(Collections.<ConnectionGroup>singleton(this.rootGroup));

		// Associate provided AuthenticationProvider
		this.authProvider = authProvider;
	}

	@Override
	public User self() {
		return self;
	}

	@Override
	public AuthenticationProvider getAuthenticationProvider() {
		return authProvider;
	}

	@Override
	public Directory<User> getUserDirectory() throws GuacamoleException {
		return this.userDirectory;
	}

	@Override
	public ConnectionRecordSet getConnectionHistory() throws GuacamoleException {
		return null;
	}

	@Override
	public Directory<Connection> getConnectionDirectory() throws GuacamoleException {

		Map<String, GuacamoleConfiguration> configs = this.getAuthorizedConfigurations();
		Collection<String> connectionIdentifiers = new ArrayList<String>(configs.size());

		// Produce collection of connections from given configs
		Collection<Connection> connections = new ArrayList<Connection>(configs.size());
		for (Map.Entry<String, GuacamoleConfiguration> configEntry : configs.entrySet()) {

			// Get connection identifier and configuration
			String identifier = configEntry.getKey();
			GuacamoleConfiguration config = configEntry.getValue();

			// Add as simple connection
			Connection connection = new LoggedConnection(identifier, identifier, config, this.authenticatedUser.getIdentifier());
			connection.setParentIdentifier(ROOT_IDENTIFIER);
			connections.add(connection);
			System.out.println("UserContext : " + connection.getName());

			// Add identifier to overall set of identifiers
			connectionIdentifiers.add(identifier);
		}

		return new SimpleConnectionDirectory(connections);
	}

	@Override
	public Directory<ConnectionGroup> getConnectionGroupDirectory() throws GuacamoleException {
		return this.connectionGroupDirectory;
	}

	@Override
	public Directory<ActiveConnection> getActiveConnectionDirectory() throws GuacamoleException {
		return new SimpleDirectory<ActiveConnection>();
	}

	@Override
	public ConnectionGroup getRootConnectionGroup() throws GuacamoleException {
		return this.rootGroup;
	}

	@Override
	public Collection<Form> getUserAttributes() {
		return Collections.<Form>emptyList();
	}

	@Override
	public Collection<Form> getConnectionAttributes() {
		return Collections.<Form>emptyList();
	}

	@Override
	public Collection<Form> getConnectionGroupAttributes() {
		return Collections.<Form>emptyList();
	}

	private Map<String, GuacamoleConfiguration> askForConnections() throws IOException, JSONException {

		Map<String, GuacamoleConfiguration> configs = new HashMap<String, GuacamoleConfiguration>();

		String token = this.authenticatedUser.getIdentifier();

		URL myUrl = new URL("http://" + hostname + ":" + port + "/api/apps/connections");
		HttpURLConnection urlConn = (HttpURLConnection)myUrl.openConnection();

		urlConn.setInstanceFollowRedirects(false);
		urlConn.setRequestProperty("Authorization", "Bearer " + token);
		urlConn.setUseCaches(false);

		urlConn.connect();

		// Get Response
		InputStream input = urlConn.getInputStream();

		BufferedReader reader = new BufferedReader(new InputStreamReader(input));
		StringBuilder response = new StringBuilder();

		String line;
		while ((line = reader.readLine()) != null) {
			response.append(line);
		}
		reader.close();

		JSONObject jsonResponse =  new JSONObject(response.toString());
		JSONArray appList = jsonResponse.getJSONArray("data");
		for (int i = 0; i < appList.length(); i++) {
			JSONObject connection = appList.getJSONObject(i);
			GuacamoleConfiguration config = new GuacamoleConfiguration();

			config.setProtocol(connection.getJSONObject("attributes").getString("protocol"));
			config.setParameter("hostname", connection.getJSONObject("attributes").getString("hostname"));
			config.setParameter("port", connection.getJSONObject("attributes").getString("port"));
			config.setParameter("username", connection.getJSONObject("attributes").getString("username"));
			config.setParameter("password", connection.getJSONObject("attributes").getString("password"));
			config.setParameter("domain", connection.getJSONObject("attributes").getString("domain"));
			config.setParameter("security", connection.getJSONObject("attributes").getString("security"));
			config.setParameter("ignore-cert", connection.getJSONObject("attributes").getString("ignore-cert"));
			config.setParameter("disable-auth", connection.getJSONObject("attributes").getString("disable-auth"));
			config.setParameter("client-name", connection.getJSONObject("attributes").getString("client-name"));
			config.setParameter("console", connection.getJSONObject("attributes").getString("console"));
			config.setParameter("initial-program", connection.getJSONObject("attributes").getString("initial-program"));
			config.setParameter("server-layout", connection.getJSONObject("attributes").getString("server-layout"));
			config.setParameter("color-depth", connection.getJSONObject("attributes").getString("color-depth"));
      if (connection.getJSONObject("attributes").getString("width").equals("0") == false) {
        config.setParameter("width", connection.getJSONObject("attributes").getString("width"));
      }
      if (connection.getJSONObject("attributes").getString("height").equals("0") == false) {
        config.setParameter("height", connection.getJSONObject("attributes").getString("height"));
      }
      if (connection.getJSONObject("attributes").getString("dpi").equals("0") == false) {
        config.setParameter("dpi", connection.getJSONObject("attributes").getString("dpi"));
      }
			config.setParameter("disable-audio", connection.getJSONObject("attributes").getString("disable-audio"));
			config.setParameter("enable-printing", connection.getJSONObject("attributes").getString("enable-printing"));
			config.setParameter("enable-drive", connection.getJSONObject("attributes").getString("enable-drive"));
			config.setParameter("drive-path", connection.getJSONObject("attributes").getString("drive-path"));
			config.setParameter("create-drive-path", connection.getJSONObject("attributes").getString("create-drive-path"));
			config.setParameter("console-audio", connection.getJSONObject("attributes").getString("console-audio"));
			config.setParameter("static-channels", connection.getJSONObject("attributes").getString("static-channels"));
      if (connection.getJSONObject("attributes").getString("preconnection-id").equals("0") == false) {
        config.setParameter("preconnection-id", connection.getJSONObject("attributes").getString("preconnection-id"));
      }
			config.setParameter("preconnection-blob", connection.getJSONObject("attributes").getString("preconnection-blob"));
			config.setParameter("enable-sftp", connection.getJSONObject("attributes").getString("enable-sftp"));
			config.setParameter("sftp-hostname", connection.getJSONObject("attributes").getString("enable-sftp"));
			config.setParameter("sftp-port", connection.getJSONObject("attributes").getString("enable-sftp"));
			config.setParameter("sftp-username", connection.getJSONObject("attributes").getString("enable-sftp"));
			config.setParameter("sftp-password", connection.getJSONObject("attributes").getString("enable-sftp"));
			config.setParameter("sftp-private-key", connection.getJSONObject("attributes").getString("enable-sftp"));
			config.setParameter("sftp-passphrase", connection.getJSONObject("attributes").getString("enable-sftp"));
			config.setParameter("sftp-directory", connection.getJSONObject("attributes").getString("enable-sftp"));
			config.setParameter("enable-wallpaper", connection.getJSONObject("attributes").getString("enable-wallpaper"));
			config.setParameter("enable-theming", connection.getJSONObject("attributes").getString("enable-theming"));
			config.setParameter("enable-font-smoothing", connection.getJSONObject("attributes").getString("enable-font-smoothing"));
			config.setParameter("enable-full-window-drag", connection.getJSONObject("attributes").getString("enable-full-window-drag"));
			config.setParameter("enable-desktop-composition", connection.getJSONObject("attributes").getString("enable-desktop-composition"));
			config.setParameter("enable-menu-animations", connection.getJSONObject("attributes").getString("enable-menu-animations"));
			if (connection.getJSONObject("attributes").has("remote-app")) {
				config.setParameter("remote-app", connection.getJSONObject("attributes").getString("remote-app"));
			}
			config.setParameter("remote-app-dir", connection.getJSONObject("attributes").getString("remote-app-dir"));
			config.setParameter("remote-app-args", connection.getJSONObject("attributes").getString("remote-app-args"));
			configs.put(connection.getJSONObject("attributes").getString("app-name"), config);
		}

		return configs;
	}

	public Map<String, GuacamoleConfiguration> getAuthorizedConfigurations() throws GuacamoleException {

		Map<String, GuacamoleConfiguration> configs = null;

		logger.info("Fetch application list from server");

		try {
			configs = askForConnections();
		} catch (IOException e) {
			e.printStackTrace();
			return null;
		} catch (JSONException e) {
			e.printStackTrace();
		}

		logger.info("Application list fetched");

		return configs;

	}

}
