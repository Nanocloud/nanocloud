package com.nanocloud.auth.noauthlogged.connection;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.ProtocolException;
import java.net.URL;
import java.util.Date;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.json.Json;
import javax.json.JsonObject;

import java.lang.reflect.Field;

import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONArray;

import com.nanocloud.auth.noauthlogged.NoAuthLoggedGuacamoleProperties;
import com.nanocloud.auth.noauthlogged.tunnel.ManagedInetGuacamoleSocket;
import com.nanocloud.auth.noauthlogged.tunnel.ManagedSSLGuacamoleSocket;
import com.nanocloud.auth.noauthlogged.NanocloudHttpConnection;

import org.glyptodon.guacamole.GuacamoleException;
import org.glyptodon.guacamole.environment.Environment;
import org.glyptodon.guacamole.environment.LocalEnvironment;
import org.glyptodon.guacamole.net.GuacamoleSocket;
import org.glyptodon.guacamole.net.GuacamoleTunnel;
import org.glyptodon.guacamole.net.SimpleGuacamoleTunnel;
import org.glyptodon.guacamole.net.auth.simple.SimpleConnection;
import org.glyptodon.guacamole.protocol.ConfiguredGuacamoleSocket;
import org.glyptodon.guacamole.protocol.GuacamoleClientInformation;
import org.glyptodon.guacamole.protocol.GuacamoleConfiguration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LoggedConnection extends SimpleConnection {

  /**
   * Logger for this class.
   */
  private Logger logger = LoggerFactory.getLogger(LoggedConnection.class);
  private String historyId;
  private String token;

  /**
   * Backing configuration, containing all sensitive information.
   */
  private GuacamoleConfiguration config;
  public LoggedConnection(String name, String identifier, GuacamoleConfiguration config, String token) {
    super(name, identifier, config);

    this.config = config;
    this.token = token;
  }

  private void logStartConnection(ActiveConnectionRecord connection, String token) throws GuacamoleException {
    try {

      Environment env = new LocalEnvironment();
      String hostname = env.getProperty(NoAuthLoggedGuacamoleProperties.NOAUTHLOGGED_SERVERURL, "localhost");
      Integer port = env.getProperty(NoAuthLoggedGuacamoleProperties.NOAUTHLOGGED_SERVERPORT, 80);
      String endpoint = env.getProperty(NoAuthLoggedGuacamoleProperties.NOAUTHLOGGED_SERVERENDPOINT, "rpc");

      JSONObject resp = NanocloudHttpConnection.HttpGet("http://" + hostname + ":" + port + "/api/users?me=true", token);
      JSONObject data = resp.getJSONObject("data");
      String id = data.getString("id");
      JSONObject dataAttribute = data.getJSONObject("attributes");
      String email = dataAttribute.getString("email");
      String firstname = dataAttribute.getString("first-name");
      String lastname = dataAttribute.getString("last-name");

      URL myUrl = new URL("http://" + hostname + ":" + port + "/" + endpoint);
      HttpURLConnection urlConn = (HttpURLConnection)myUrl.openConnection();
      urlConn.setInstanceFollowRedirects(false);
      urlConn.setRequestProperty("Authorization", "Bearer " + token);

      urlConn.setRequestProperty("Content-Type", "application/json");
      JsonObject params = Json.createObjectBuilder()
        .add("data", Json.createObjectBuilder()
            .add("type", "histories")
            .add("attributes", Json.createObjectBuilder()
              .add("user-id", id)
              .add("user-mail", email)
              .add("user-firstname", firstname)
              .add("user-lastname", lastname)
              .add("connection-id", connection.getConnectionName())
              .add("start-date", connection.getStartDate().toString())
              .add("end-date", "")))
        .build();

      urlConn.setUseCaches(false);
      urlConn.setDoOutput(true);
      DataOutputStream writer = new DataOutputStream(urlConn.getOutputStream());
      writer.writeBytes(params.toString());
      writer.close();

      urlConn.connect();
      urlConn.getOutputStream().close();

      InputStream input = urlConn.getInputStream();
      BufferedReader reader = new BufferedReader(new InputStreamReader(input));
      StringBuilder response = new StringBuilder();

      String line;
      while ((line = reader.readLine()) != null) {
        response.append(line);
        response.append('\r');
      }
      reader.close();

      resp =  new JSONObject(response.toString());
      data = resp.getJSONObject("data");
      this.historyId = data.getString("id");

    } catch (JSONException e) {
      e.printStackTrace();
    } catch (IOException e) {
      e.printStackTrace();
    }
  }


  /**
   * Task which handles cleanup of a connection associated with some given
   * ActiveConnectionRecord.
   */
  private class ConnectionCleanupTask implements Runnable {

    /**
     * Whether this task has run.
     */
    private final AtomicBoolean hasRun = new AtomicBoolean(false);
    private final String hostname;
    private final Integer port;
    private final String endpoint;
    private ActiveConnectionRecord connection;
    private String id;
    private String email;
    private String firstname;
    private String lastname;

    public ConnectionCleanupTask(ActiveConnectionRecord connection, String token) throws GuacamoleException {
      this.connection = connection;

      Environment env = new LocalEnvironment();

      hostname = env.getProperty(NoAuthLoggedGuacamoleProperties.NOAUTHLOGGED_SERVERURL, "localhost");
      port = env.getProperty(NoAuthLoggedGuacamoleProperties.NOAUTHLOGGED_SERVERPORT, 80);
      endpoint = env.getProperty(NoAuthLoggedGuacamoleProperties.NOAUTHLOGGED_SERVERENDPOINT, "rpc");

      try {

        URL myUrl = new URL("http://" + hostname + ":" + port + "/api/users?me=true");

        JSONObject jsonResponse = NanocloudHttpConnection.HttpGet("http://" + hostname + ":" + port + "/api/users?me=true", token);
        JSONObject data = jsonResponse.getJSONObject("data");
        this.id  = data.getString("id");

        JSONObject dataAttribute = data.getJSONObject("attributes");
        this.email = dataAttribute.getString("email");
        this.firstname = dataAttribute.getString("first-name");
        this.lastname = dataAttribute.getString("last-name");

      } catch (IOException e) {
        // TODO Auto-generated catch block
        e.printStackTrace();
      } catch (JSONException e) {
        e.printStackTrace();
      }
    }

    @Override
    public void run() {

      // Only run once
      if (!hasRun.compareAndSet(false, true))
        return;

      try {

        URL myUrl = new URL("http://" + hostname + ":" + port + "/" + endpoint + "/" + LoggedConnection.this.historyId);
        HttpURLConnection urlConn = (HttpURLConnection)myUrl.openConnection();
        urlConn.setInstanceFollowRedirects(false);
        urlConn.setRequestProperty("Authorization", "Bearer " + token);
        urlConn.setRequestProperty("Content-Type", "application/json");
        JsonObject params = Json.createObjectBuilder()
          .add("data", Json.createObjectBuilder()
              .add("type", "histories")
              .add("attributes", Json.createObjectBuilder()
                .add("user-id", this.id)
                .add("user-mail", this.email)
                .add("user-firstname", this.firstname)
                .add("user-lastname", this.lastname)
                .add("connection-id", this.connection.getConnectionName())
                .add("start-date", this.connection.getStartDate().toString())
                .add("end-date", new Date().toString())))
          .build();

        urlConn.setUseCaches(false);
        urlConn.setDoOutput(true);
        // Send request (for some reason we actually need to wait for response)
        NanocloudHttpConnection.setRequestMethodUsingWorkaroundForJREBug(urlConn, "POST");
        DataOutputStream writer = new DataOutputStream(urlConn.getOutputStream());
        writer.writeBytes(params.toString());
        writer.close();

        urlConn.connect();
        urlConn.getOutputStream().close();

        // Get Response
        InputStream input = urlConn.getInputStream();
        BufferedReader reader = new BufferedReader(new InputStreamReader(input));
        StringBuilder response = new StringBuilder();

        String line;
        while ((line = reader.readLine()) != null) {
          response.append(line);
          response.append('\r');
        }
        reader.close();

        logger.info("History transmitted to API");

      } catch (IOException e) {
        // TODO Auto-generated catch block
        e.printStackTrace();
      }

    }

  }

  @Override
  public GuacamoleTunnel connect(GuacamoleClientInformation info)
  throws GuacamoleException {

  Environment env = new LocalEnvironment();
  ActiveConnectionRecord connection = new ActiveConnectionRecord(this.getName());

  // Get guacd connection parameters
  String hostname = env.getProperty(Environment.GUACD_HOSTNAME, "localhost");
  int port = env.getProperty(Environment.GUACD_PORT, 4822);

  GuacamoleSocket socket;

  // Record new active connection
  Runnable cleanupTask = new ConnectionCleanupTask(connection, token);

  // If guacd requires SSL, use it
  if (env.getProperty(Environment.GUACD_SSL, false))
    socket = new ConfiguredGuacamoleSocket(
        new ManagedSSLGuacamoleSocket(hostname, port, cleanupTask),
        config, info
        );

  // Otherwise, just connect directly via TCP
  else
    socket = new ConfiguredGuacamoleSocket(
        new ManagedInetGuacamoleSocket(hostname, port, cleanupTask),
        config, info
        );

  logStartConnection(connection, token);

  return new SimpleGuacamoleTunnel(socket);

  }
}
