package com.nanocloud.auth.noauthlogged.user;

import com.google.inject.Inject;
import org.glyptodon.guacamole.net.auth.AuthenticatedUser;
import org.glyptodon.guacamole.net.auth.AuthenticationProvider;
import org.glyptodon.guacamole.net.auth.Credentials;

public class NanocloudAuthenticatedUser implements AuthenticatedUser {

    /**
     * Reference to the authentication provider associated with this
     * authenticated user.
     */
    @Inject
    private AuthenticationProvider authProvider;

    protected String token = null;

    @Override
    public AuthenticationProvider getAuthenticationProvider() {
        return this.authProvider;
    }

    @Override
    public NanocloudCredentials getCredentials() {
        return new NanocloudCredentials(this.token);
    }

    @Override
    public String getIdentifier() {
        return this.token;
    }

    @Override
    public void setIdentifier(String identifier) {
        this.token = identifier;
    }

    public NanocloudAuthenticatedUser(AuthenticationProvider authprovider, String token) {

        this.authProvider = authprovider;
        this.token = token;
    }

    private class NanocloudCredentials extends Credentials {

        public NanocloudCredentials(String token) {

            this.setUsername(token);
        }
    }
}
