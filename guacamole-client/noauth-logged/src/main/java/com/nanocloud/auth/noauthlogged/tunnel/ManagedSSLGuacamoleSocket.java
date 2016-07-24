package com.nanocloud.auth.noauthlogged.tunnel;

import org.glyptodon.guacamole.GuacamoleException;
import org.glyptodon.guacamole.net.SSLGuacamoleSocket;

/**
 * Implementation of GuacamoleSocket which connects via SSL to a given hostname
 * and port. If the socket is closed for any reason, a given task is run.
 *
 * @author Michael Jumper
 */
public class ManagedSSLGuacamoleSocket extends SSLGuacamoleSocket {

    /**
     * The task to run when the socket is closed.
     */
    private final Runnable socketClosedTask;

    /**
     * Creates a new socket which connects via SSL to a given hostname and
     * port. If the socket is closed for any reason, the given task is run.
     * 
     * @param hostname
     *     The hostname of the Guacamole proxy server to connect to.
     *
     * @param port
     *     The port of the Guacamole proxy server to connect to.
     *
     * @param socketClosedTask
     *     The task to run when the socket is closed. This task will NOT be
     *     run if an exception occurs during connection, and this
     *     ManagedInetGuacamoleSocket instance is ultimately not created.
     *
     * @throws GuacamoleException
     *     If an error occurs while connecting to the Guacamole proxy server.
     */
    public ManagedSSLGuacamoleSocket(String hostname, int port,
            Runnable socketClosedTask) throws GuacamoleException {
        super(hostname, port);
        this.socketClosedTask = socketClosedTask;
    }

    @Override
    public void close() throws GuacamoleException {
        super.close();
        socketClosedTask.run();
    }
    
}
