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

/* global UserService, Machine, ConfigService */

const pkgcloud = require('pkgcloud');
const Promise = require('bluebird');
const Driver = require('../driver');
const ursa = require('ursa-purejs');
const fs = Promise.promisifyAll(require('fs'));
const request = require('request');
/**
 * The prices of aws virtual machines will be stored
 */
//let price = null;


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
   *
   * @method initialize
   * @return {Promise}
   */
  initialize() {
    return ConfigService.get(
      'awsAccessKeyId', 'awsSecretAccessKey', 'awsRegion',
      'awsKeyName', 'awsPrivateKey'
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
                    let priceObjet = {};
                    let confReg = {
                      'us-east-1': 'US East (N.Virginia)',
                      'us-west-2': 'US West (Oregon)',
                      'ap-southeast-1': 'Asia Pacific (Singapore)',
                      'ap-southeast-2': 'Asia Pacific (Sydney)',
                      'ap-northeast-1': 'Asia Pacific (Tokyo)',
                      'eu-central-1': 'EU (Frankfurt)',
                      'eu-west-1': 'EU (Ireland)'
                    };
                    let keyPrice = [];
                    request('https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/current/index.json', (err, res, body) => {
                      Promise.resolve(JSON.parse(body))
                        .then((prix) => {
                          priceObjet = prix;
                          keyPrice = Object.keys(prix.products);
                        })
                        .then(() => {
                          return ConfigService.get('awsRegion');
                        })
                        .then((conf) => {
                          return keyPrice.forEach((elem) => {
                            if (priceObjet.products[elem].attributes.location !== confReg[conf.awsRegion] || priceObjet.products[elem].attributes.operatingSystem !== 'Windows' || priceObjet.products[elem].attributes.licenseModel !== 'License Included' || priceObjet.products[elem].attributes.preInstalledSw !== 'NA') {
                              delete priceObjet.products[elem];
                            }
                          });
                        })
                        .then(() => {
                          return ConfigService.set('price', priceObjet);
                        })
                        .then(() => {
                          console.log('Price OK');
                        })
                        .catch((err) => {
                          console.log(err);
                        });
                    });
                    resolve();
                  });
              });
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
   *  - awsImage: AWS EC2 AMI to use
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
    return ConfigService.get('awsImage', 'awsFlavor', 'plazaURI', 'awsKeyName', 'plazaPort')
      .then((config) => {

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
            image    : config.awsImage,
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

                return this._client.ec2
                  .waitFor('passwordDataAvailable', {
                    InstanceId: server.id
                  }, (err, res) => {

                    if (err) {
                      return reject(err);
                    } else {
                      return resolve({
                        server: server,
                        password: res.PasswordData
                      });
                    }
                  });
              });
            }
          });
        })
          .then((res) => {
            const server = res.server;
            const password = res.password;


            return ConfigService.get('awsMachineUsername', 'plazaPort', 'awsFlavor')
              .then((config) => {
                return this._decryptPassword(password)
                  .then((password) => {

                    const ip = server.addresses.public[0];

                    return Machine.create({
                      id: server.id,
                      name: server.name,
                      type: this.name(),
                      flavor: config.awsFlavor,
                      ip: ip,
                      username: config.awsMachineUsername,
                      password: password,
                      domain: '',
                      plazaport: config.plazaPort
                    });

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

  /**
   * Calcul credit used by a user
   *
   * @method getUserCredit
   * @return {Promise}
   */
  getUserCredit(user) {
    let product = [];
    let pri = [];
    let duration = [];
    var finalPrice = 0;

    return new Promise((resolve, reject) => {
      ConfigService.get('price')
        .then((conf) => {
          var jsonPrice = conf.price;
          UserService.getUserHistory(user, 'aws')
            .then((dur) => {
              duration = dur;
              var prod = Object.keys(jsonPrice.products);
              return dur.forEach((element) => {
                return prod.forEach((elem) => {
                  var obj = jsonPrice.products[elem].attributes;
                  if (obj.location === 'EU (Frankfurt)' && obj.operatingSystem === 'Windows' && obj.licenseModel === 'License Included' && obj.instanceType === element.type && obj.preInstalledSw === 'NA') {
                    product.push(jsonPrice.products[elem]);
                    return jsonPrice.products[elem];
                  } else {
                    return null;
                  }
                });
              });
            })
            .then(() => {
              return product.forEach((elem) => {
                var tmp = {};
                var tmpKey = null;

                tmp = jsonPrice.terms.OnDemand[elem.sku];
                tmpKey = Object.keys(tmp);
                tmp = tmp[tmpKey].priceDimensions;
                tmpKey = Object.keys(tmp);
                pri.push(tmp[tmpKey].pricePerUnit.USD);
              });
            })
            .then(() => {
              return duration.forEach((elem, index) => {
                finalPrice += (elem.time * pri[index]);
              });
            })
            .then(() => {
              return resolve(finalPrice);
            })
            .catch((err) => {
              console.log(err);
              return reject();
            });
        })
        .catch((err) => {
          console.log(err);
          return reject();
        });

    });
  }
}

module.exports = AWSDriver;
