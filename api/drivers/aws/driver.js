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
 *
 * AWSDriver
 *
 * @description :: Driver for Amazon Web Service EC2 Iaas
 */

/* global Machine, MachineService, ConfigService, Image */

const pkgcloud = require('pkgcloud');
const Promise = require('bluebird');
const Driver = require('../driver');
const ursa = require('ursa-purejs');
const fs = Promise.promisifyAll(require('fs'));

/**
 * Driver for Amazon Web Services EC2 Iaas
 *
 * @class AWSDriver
 */
class AWSDriver extends Driver {

  /**
   * Initializes the AWS driver.
   * Requires the `ConfigService` variables:
   *  - awsAccessKeyId: The AWS access key id
   *  - awsSecretAccessKey: The AWS secret acces key
   *  - awsRegion: The AWS region name
   *  - awsKeyName: The AWS key pair name to use or create
   *  - awsPrivateKey: The location of the AWS private key to use or create
   *  - awsImage: The image to build Nanocloud executation servers from
   *
   * @method initialize
   * @return {Promise}
   */
  initialize() {
    return ConfigService.get(
      'awsAccessKeyId', 'awsSecretAccessKey', 'awsRegion',
      'awsKeyName', 'awsPrivateKey', 'awsImage'
    )
      .then((config) => {
        this._client = pkgcloud.compute.createClient({
          provider : 'amazon',
          keyId    : config.awsAccessKeyId,
          key      : config.awsSecretAccessKey,
          region   : config.awsRegion
        });

        return new Promise((resolve, reject) => {
          fs.statAsync(config.awsPrivateKey)
            .then(() => {
              resolve();
            })
            .catch((err) => {
              if (err.code !== 'ENOENT') {
                return reject(err);
              }

              return this._client.ec2.createKeyPair({
                KeyName: config.awsKeyName
              }, (err, res) => {
                if (err) {
                  return reject(err);
                }
                return fs.writeFileAsync(
                  config.awsPrivateKey,
                  res.KeyMaterial, {
                    encoding: 'utf8',
                    mode: 0o600,
                    flag: 'w'
                  }
                )
                  .then(() => {
                    resolve();
                  });
              });
            });
        })
          .then(() => {
            return Image.update({
              default: true
            }, {
              iaasId: config.awsImage,
              name: 'AWS default'
            });
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
    return 'aws';
  }

  /**
   * Decrypt the EC2 password using the private key defined in
   * `ConfigService:awsPrivateKey`
   *
   * @method _decryptPassword
   * @private
   * @return {Promise[String]} The uncrypted password
   */
  _decryptPassword(encryptedPassword) {
    return ConfigService.get('awsPrivateKey')
      .then((config) => {
        return fs.readFileAsync(config.awsPrivateKey)
          .then((pem) => {
            const pkey = ursa.createPrivateKey(pem);
            const password = pkey.decrypt(encryptedPassword, 'base64', 'utf8', ursa.RSA_PKCS1_PADDING);

            return password;
          });
      });
  }

  /**
   * Create a new EC2 instance. It uses the `ConfigService` variables:
   *  - awsFlavor: AWS EC2 instance type
   *  - plazaURI: The URL from where the instance will download plaza.exe
   *  - awsKeyName: The name of the KeyPair to use for the instance admin
   *  - plazaPort: Port to contact plaza
   *
   * @method createMachine
   * @param {Object} options The machine options. `options.name`: The name of
   * the machine
   * @return {Promise[Machine]} The created machine
   */
  createMachine(options) {
    return ConfigService.get('awsFlavor', 'plazaURI', 'awsKeyName', 'plazaPort')
      .then((config) => {

        return MachineService.getDefaultImage()
          .then((image) => {

            const userData = `<powershell>
        REG.exe Add HKLM\\Software\\Microsoft\\ServerManager /V DoNotOpenServerManagerAtLogon /t REG_DWORD /D 0x1 /F
        Set-ExecutionPolicy RemoteSigned -force
        Invoke-WebRequest ${config.plazaURI} -OutFile C:\\plaza.exe
        C:\\plaza.exe install
        rm C:\\plaza.exe
        New-NetFirewallRule -Protocol TCP -LocalPort ${config.plazaPort} -Direction Inbound -Action Allow -DisplayName PLAZA
        </powershell>
      `;

            return new Promise((resolve, reject) => {
              this._client.createServer({
                name     : options.name,
                image    : image.iaasId,
                flavor   : config.awsFlavor,
                KeyName  : config.awsKeyName,
                UserData : userData
              }, (err, server) => {
                if (err) {
                  return reject(err);
                } else {
                  return server.refresh((err, server) => {

                    if (err) {
                      return reject(err);
                    }

                    if (image.password === null) {
                      return this._client.ec2
                        .waitFor('passwordDataAvailable', {
                          InstanceId: server.id
                        }, (err, res) => {

                          if (err) {
                            return reject(err);
                          } else {
                            return resolve({
                              server: server,
                              password: res.PasswordData,
                              image: image
                            });
                          }
                        });
                    } else {
                      return this._client.ec2
                        .waitFor('instanceStatusOk', {
                          InstanceIds: [server.id]
                        }, (err) => {

                          if (err) {
                            return reject(err);
                          } else {
                            return resolve({
                              server: server,
                              password: image.password,
                              image: image
                            });
                          }
                        });
                    }
                  });
                }
              });
            })
              .then((res) => {
                const server = res.server;
                const password = res.password;
                const image = res.image;
                const ip = server.addresses.public[0];
                const type = this.name();

                return ConfigService.get('awsMachineUsername', 'plazaPort')
                  .then((config) => {

                    let _createMachine = function(password) {
                      return Machine.create({
                        id: server.id,
                        name: server.name,
                        type: type,
                        ip: ip,
                        username: config.awsMachineUsername,
                        password: password,
                        domain: '',
                        plazaport: config.plazaPort
                      });
                    };

                    if (image.password) {
                      return _createMachine(image.password);
                    } else {
                      return this._decryptPassword(password)
                        .then((password) => {
                          return _createMachine(password);
                        });
                    }
                  });
              });
          });
      });
  }

  /**
   * Destroy the specified machine.
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
          resolve();
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


  /*
   * Create an image from a machine
   * The image will be used as default image for future execution servers
   *
   * @method createImage
   * @param {Object} Image object with `buildFrom` attribute set to the machine id to create image from
   * @return {Promise[Image]} resolves to the new default image
   */
  createImage(imageToCreate) {

    return new Promise((resolve, reject) => {
      this._client.ec2.createImage({
        Name: imageToCreate.name,
        InstanceId: imageToCreate.buildFrom,
        NoReboot: true
      }, (err, image) => {

        if (err) {
          return reject(err);
        }


        Machine.findOne(imageToCreate.buildFrom)
          .then((machine) => {
            this._client.ec2.waitFor('imageAvailable', {
              ImageIds: [image.ImageId]
            }, (err) => {
              if (err) {
                return reject(err);
              }

              return Image.update({
                default: true
              }, {
                iaasId: image.ImageId,
                name: imageToCreate.name,
                buildFrom: imageToCreate.buildFrom,
                password: machine.password
              })
                .then((images) => {

                  let image = images.pop();
                  return this._client.ec2
                    .waitFor('instanceStatusOk', {
                      InstanceIds: [machine.id]
                    }, (err) => {

                      if (err) {
                        return reject(err);
                      }

                      return resolve(image);
                    });
                });
            });
          })
          .catch(reject);
      });
    });
  }
}

module.exports = AWSDriver;
