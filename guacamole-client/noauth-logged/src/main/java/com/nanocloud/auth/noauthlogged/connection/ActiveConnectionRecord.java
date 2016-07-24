package com.nanocloud.auth.noauthlogged.connection;

import java.util.Date;

import org.glyptodon.guacamole.net.auth.ConnectionRecord;

public class ActiveConnectionRecord implements ConnectionRecord {

	private final String name;
	/**
	 * The time this connection record was created.
	 */
	private final Date startDate = new Date();

	public ActiveConnectionRecord(String name) {
		this.name = name;
	}
	
	@Override
	public Date getEndDate() {
		return null;
	}

	@Override
	public String getRemoteHost() {
		return null;
	}

	@Override
	public String getConnectionIdentifier() {
		return null;
	}

	public String getConnectionName() {
		return this.name;
	}
	
	@Override
	public Date getStartDate() {
		return startDate;
	}

	@Override
	public String getUsername() {
		// Technically with no auth, user does not have is own ID
		return this.name;
	}

	@Override
	public boolean isActive() {
		return true;
	}

}
