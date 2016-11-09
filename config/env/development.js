/**
 * Nanocloud turns any traditional software into a cloud solution, without
 * changing or redeveloping existing source code.
 *
 * Copyright (C) 2016 Nanocloud Software
 *
 * This file is part of Nanocloud.
 *
 * Nanocloud is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Nanocloud is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General
 * Public License
 * along with this program.  If not, see
 * <http://www.gnu.org/licenses/>.
 *
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

  /***************************************************************************
   * Set the default database connection for models in the development       *
   * environment (see config/connections.js and config/models.js )           *
   ***************************************************************************/

  models: {
    connection: 'postgresDevelopment'
  },

  nanocloud: {
    title: 'Nanocloud',
    favIconPath: 'favicon.ico',
    logoPath: '/assets/images/logo.png',
    primaryColor: '#006CB6',

    host: 'localhost',
    smtpServerHost: '',
    smtpServerPort: 25,
    smtpLogin: '',
    smtpPassword: '',
    smtpSendFrom: 'mail@nanocloud.com',

    storageAddress: 'localhost',
    storagePort: 9090,
    teamStorageAddress: 'localhost',
    teamStoragePort: 9091,

    uploadLimit: 0,
    expirationDate: 0,
    autoRegister: false,
    autoLogoff: false,
    teamEnabled: false,
    defaultGroup: '',
    creditLimit: '',

    iaas: 'manual',
    machinePoolSize: 1,
    instancesSize: 'medium',

    photon: false,
    neverTerminateMachine: false,
    sessionDuration: 600, // 10 minutes
    machinesName: 'Nanocloud Exec Server',
    plazaURI: 'https://s3-eu-west-1.amazonaws.com/nanocloud/plaza/1.0.0/windows/amd64/plaza.exe',
    /*
     * Machine format
     *
     * Array of objects Machine:
     * {
     *   name: 'Machine name',
     *   type: 'manual',
     *   ip: '0.0.0.0',
     *   username: 'Administrator',
     *   password: 'secret',
     *   plazaport: 9090
     * }
     */
    machines: [],
    plazaPort: 9090,

    awsAccessKeyId: '',
    awsSecretAccessKey: '',
    awsRegion: '',
    awsKeyName: '',
    awsPrivateKey: '/opt/back/id_rsa',
    awsImage: '',
    awsMachineUsername: 'Administrator',
    awsMachinePassword: '',
    awsMachineSubnet: '',
    awsDiskSize: 0,

    openstackUsername:  '',
    openstackPassword: '',
    openstackAuthUrl: '',
    openstackRegion: 'RegionOne',
    openstackImage: '',
    openstackFlavor: 'm1.medium',
    openstackSecurityGroups: ['default'],
    openstackMachineUsername: 'Administrator',
    openstackMachinePassword: '',

    qemuServiceURL: 'localhost',
    qemuServicePort: 3000,
    qemuMachineUsername: 'Administrator',
    qemuMachinePassword: '',

    ldapActivated: false,
    ldapUrl: 'ldap://localhost:389',
    ldapBaseDn: 'dc=nanocloud,dc=com',
    defaultGroupLdap: '',

    rdpPort: 3389,
    rdpDomain: '',
    rdpSecurity: 'nla',
    rdpIgnoreCert: true,
    rdpDisableAuth: false,
    rdpClientName: '',
    rdpConsole: false,
    rdpInitialProgram: '',
    rdpServerLayout: 'en-us-qwerty',
    rdpColorDepth: '',
    rdpWidth: 0,
    rdpHeight: 0,
    rdpDpi: 0,
    rdpDisableAudio: false,
    rdpEnablePrinting: true,
    rdpEnableDrive: false,
    rdpDrivePath: '',
    rdpCreateDrivePath: false,
    rdpConsoleAudio: false,
    rdpStaticChannels: '',
    rdpPreconnectionId: 0,
    rdpPreconnectionBlob: '',
    rdpEnableSftp: false,
    rdpSftpHostname: '',
    rdpSftpPort: 0,
    rdpSftpUsername: '',
    rdpSftpPassword: '',
    rdpSftpPrivateKey: '',
    rdpSftpPassphrase: '',
    rdpSftpDirectory: '',
    rdpEnableWallpaper: true,
    rdpEnableTheming: true,
    rdpEnableFontSmoothing: true,
    rdpEnableFullWindowDrag: false,
    rdpEnableDesktopComposition: false,
    rdpEnableMenuAnimations: false,
    rdpRemoteApp: '',
    rdpRemoteAppDir: '',
    rdpRemoteAppArgs: '',

    testMail: false,
    dummyBootingState: false
  }
};
