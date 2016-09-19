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
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global Machine, ConfigService */

const Driver = require('../driver');
const pkgcloud = require('pkgcloud');
const Promise = require('bluebird');
const randomstring = require('randomstring');
const _ = require('lodash');

/**
 * Driver for Openstack Iaas
 *
 * @class OpenstackDriver
 */
class OpenstackDriver extends Driver {

  /**
   * Initializes the Openstack driver
   * Requires the `ConfigService` variables:
   *  - openstackUsername: The Openstack username
   *  - openstackPassword: The Openstack password
   *  - openstackAuthUrl: The Openstack AuthURL
   *  - openstackRegion: The Openstack region name
   *
   * @method initialize
   * @return {Promise}
   */
  initialize() {
    return ConfigService.get(
      'openstackUsername', 'openstackPassword', 'openstackAuthUrl',
      'openstackRegion'
    )
      .then((config) => {
        this._client = pkgcloud.compute.createClient({
          provider : 'openstack',
          username : config.openstackUsername,
          password : config.openstackPassword,
          authUrl  : config.openstackAuthUrl,
          region   : config.openstackRegion
        });
      });
  }

  /**
   * Return the name of the driver.
   *
   * @method name
   * @return {String} The name of the driver
   */
  name() {
    return 'openstack';
  }

  /**
   * Escape simple quote properly for Powershell compatibility
   * You'll need to single quote your string in Powershell script
   *
   * @method _powershellEscape
   * @private
   * @param The string to escape
   * @return {string} The escaped string
   */
  _powershellEscape(string) {
    return string.split('\'').join('\'\'');
  }

  /**
   * Create a new Openstack instance. It uses the `ConfigService` variables:
   *  - openstackImage: Image id of the Openstack image
   *  - openstackFlavor: Openstack instance type
   *  - openstackSecurityGroups: The name of the security group to use for the instance
   *  - openstackMachineUsername: Windows account username
   *  - openstackMachinePassword: Windows account password
   *  - plazaURI: The URL from where the instance will download plaza.exe
   *  - plazaPort: Port to contact plaza
   *
   * @method createMachine
   * @param {Object} options The machine options. `options.name`: The name of the machine
   * @return {Promise[Machine]} The created machine
   */
  createMachine(options) {
    return ConfigService.get(
      'openstackImage', 'openstackFlavor', 'openstackSecurityGroups',
      'openstackMachineUsername', 'openstackMachinePassword', 'plazaURI', 'plazaPort'
    )
      .then((config) => {

        let groups = [];
        config.openstackSecurityGroups.forEach((value) => {
          groups.push({name: value});
        });

        let password;
        if (config.openstackMachinePassword === '') {
          password = randomstring.generate(12) + 'a8A';
        } else {
          password = config.openstackMachinePassword;
        }

        let userData = new Buffer(`#ps1_sysnative
        REG.exe Add HKLM\\Software\\Microsoft\\ServerManager /V DoNotOpenServerManagerAtLogon /t REG_DWORD /D 0x1 /F
        net user '${this._powershellEscape(config.openstackMachineUsername)}' '${this._powershellEscape(password)}'
        Invoke-WebRequest ${config.plazaURI} -OutFile C:\\plaza.exe
        C:\\plaza.exe install
        rm C:\\plaza.exe
        Set-ExecutionPolicy RemoteSigned -force
        New-NetFirewallRule -Protocol TCP -LocalPort ${config.plazaPort} -Direction Inbound -Action Allow -DisplayName PLAZA
        `).toString('base64');

        return new Promise((resolve, reject) => {
          this._client.getFlavors((err, flavors) => {
            if (err) {
              reject (err);
            }
            this._client.createServer({
              name           : options.name,
              image          : config.openstackImage,
              flavor         : _.find(flavors, { name: config.openstackFlavor }).id,
              cloudConfig    : userData,
              securityGroups : groups,
            }, (err, server) => {
              if (err) {
                return reject(err);
              } else {
                return server.setWait({status: server.STATUS.running}, 1000, (err) => {
                  if (err) {
                    return reject(err);
                  } else {
                    return resolve(server);
                  }
                });
              }
            });
          });
        })
          .then((server) => {
            return new Promise((resolve, reject) => {
              this._client.allocateNewFloatingIp((err, ips) => {
                if (err) {
                  return reject(err);
                } else {
                  this._client.addFloatingIp(server, ips.ip, (err) => {
                    if (err) {
                      return reject(err);
                    }
                  });

                  let machine = new Machine._model({
                    id        : server.id,
                    name      : server.name,
                    type      : this.name(),
                    ip        : null,
                    username  : config.openstackMachineUsername,
                    password  : password,
                    domain    : '',
                    plazaport : config.plazaPort
                  });

                  return resolve(machine);
                }
              });
            });
          });
      });
  }


  /**
   * Destroy the specified machine and deallocate the associate floating ip.
   *
   * @method destroyMachine
   * @return {Promise}
   */
  destroyMachine(machine) {
    return new Promise((resolve, reject) => {
      this._client.destroyServer(machine.id, (err) => {
        if (err) {
          reject(err);
        } else {
          this._client.deallocateFloatingIp(machine.ip, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        }
      });
    });
  }

  /**
   * Retrieve the server with the specified id.
   *
   * @method getServer
   * @return {Promise[Object]}
   */
  getServer(id) {
    return new Promise((resolve, reject) => {
      this._client.getServer(id, (err, server) => {
        if (err) {
          reject(err);
        } else {
          resolve(server);
        }
      });
    });
  }

  /**
   * Retrieve the machine's data
   *
   * @method refresh
   * @param {machine} Machine model
   * @return {Promise[Machine]}
   */
  refresh(machine) {
    return new Promise((resolve, reject) => {
      this.getServer(machine.id)
        .then((server, err) => {
          if (err) { return reject(err); }
          return new Promise((resolve, reject) => {
            this._client.allocateNewFloatingIp((err, ips) => {
              if (err) {
                return reject(err);
              } else {
                this._client.addFloatingIp(server, ips.ip, (err) => {
                  if (err) {
                    return reject(err);
                  }
                });

                let machine = new Machine._model({
                  id        : server.id,
                  name      : server.name,
                  type      : this.name(),
                  ip        : ips.ip,
                  status    : server.STATUS.running
                });

                return resolve(machine);
              }
            });
          });
        });
    });
  }
}

module.exports = OpenstackDriver;
