package com.nanocloud.auth.noauthlogged;

import com.nanocloud.auth.noauthlogged.user.NanocloudAuthenticatedUser;
import com.nanocloud.auth.noauthlogged.user.UserContext;
import org.glyptodon.guacamole.GuacamoleException;
import org.glyptodon.guacamole.environment.Environment;
import org.glyptodon.guacamole.environment.LocalEnvironment;
import org.glyptodon.guacamole.net.auth.AuthenticationProvider;
import org.glyptodon.guacamole.net.auth.AuthenticatedUser;
import org.glyptodon.guacamole.net.auth.Credentials;

import javax.servlet.http.HttpServletRequest;

/**
 * Disable authentication in Guacamole. All users accessing Guacamole are
 * automatically authenticated as "Anonymous" user and are able to use all
 * available GuacamoleConfigurations.
 *
 * GuacamoleConfiguration are read from the XML file defined by `noauth-config`
 * in the Guacamole configuration file (`guacamole.properties`).
 *
 *
 * Example `guacamole.properties`:
 *
 *  noauth-config: /etc/guacamole/noauth-config.xml
 *
 *
 * Example `noauth-config.xml`:
 *
 *  <configs>
 *    <config name="my-rdp-server" protocol="rdp">
 *      <param name="hostname" value="my-rdp-server-hostname" />
 *      <param name="port" value="3389" />
 *    </config>
 *  </configs>
 *
 * @author Laurent Meunier
 */
public class NoAuthLoggedProvider implements AuthenticationProvider {

    private final String hostname;
    private final Integer port;
    private final String endpoint;

    /**
     * Guacamole server environment.
     */
    private final Environment environment;

    /**
     * Creates a new NoAuthenticationProvider that does not perform any
     * authentication at all. All attempts to access the Guacamole system are
     * presumed to be authorized.
     *
     * @throws GuacamoleException
     *     If a required property is missing, or an error occurs while parsing
     *     a property.
     */
	public NoAuthLoggedProvider() throws GuacamoleException {
		environment = new LocalEnvironment();

        hostname = environment.getProperty(NoAuthLoggedGuacamoleProperties.NOAUTHLOGGED_SERVERURL, "localhost");
        port = environment.getProperty(NoAuthLoggedGuacamoleProperties.NOAUTHLOGGED_SERVERPORT, 80);
        endpoint = environment.getProperty(NoAuthLoggedGuacamoleProperties.NOAUTHLOGGED_SERVERENDPOINT, "rpc");
	}
    
    @Override
    public UserContext getUserContext(AuthenticatedUser authenticatedUser) throws GuacamoleException {

        return new UserContext(this, authenticatedUser);
    }

    @Override
    public org.glyptodon.guacamole.net.auth.UserContext updateUserContext(org.glyptodon.guacamole.net.auth.UserContext context, AuthenticatedUser authenticatedUser) throws GuacamoleException {
        return context;
    }

    @Override
    public String getIdentifier() {
        return "noauthlogged";
    }

    @Override
    public AuthenticatedUser authenticateUser(Credentials credentials) throws GuacamoleException {

        String token;
        HttpServletRequest request = credentials.getRequest();

        if (request.getParameter("access_token").isEmpty()) {
            throw new GuacamoleException("An access_token must be specified");
        }
        token = request.getParameter("access_token");

        return new NanocloudAuthenticatedUser(this, token);
    }

    @Override
    public AuthenticatedUser updateAuthenticatedUser(AuthenticatedUser authenticatedUser, Credentials credentials) throws GuacamoleException {
        return authenticatedUser;
    }

}
