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
const request = Promise.promisify(require('request'));

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
   *  - awsMachinePassword: The password associated with the administrator account
   *
   * @method initialize
   * @return {Promise}
   */
  initialize() {
    return ConfigService.get(
      'awsAccessKeyId', 'awsSecretAccessKey', 'awsRegion',
      'awsKeyName', 'awsPrivateKey', 'awsImage', 'awsMachinePassword'
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
            this.priceFile = request('https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/current/index.json');
            this.getAwsPrice();
          })
          .then(() => {
            return Image.update({
              default: true
            }, {
              iaasId: config.awsImage,
              name: 'AWS default',
              password: config.awsMachinePassword || null
            });
          });
      });
  }

  /**
   * Get the aws price
   * It reduce the AwsPrice Object by deleting useless key
   * This method set this.awsPrice to a promise that will
   * resolve to the prices retrieved from AWS
   *
   * @method getAwsPrice
   */
  getAwsPrice() {
    let confReg = {
      'us-east-1': 'US East (N.Virginia)',
      'us-west-2': 'US West (Oregon)',
      'ap-southeast-1': 'Asia Pacific (Singapore)',
      'ap-southeast-2': 'Asia Pacific (Sydney)',
      'ap-northeast-1': 'Asia Pacific (Tokyo)',
      'eu-central-1': 'EU (Frankfurt)',
      'eu-west-1': 'EU (Ireland)'
    };

    this.priceFile
      .then((res) => {
        return Promise.resolve(JSON.parse(res.body));
      })
      .then((price) => {
        this.awsPrice = new Promise((resolve, reject) => {
          return Promise.props({
            conf: ConfigService.get('awsRegion'),
            keyPrice: Object.keys(price.products)
          })
            .then((results) => {

              /**
               * Search all record where location is the user location,
               * operatingSystem is Windows, with license and without SQL
               * windows, and delete the other record.
               */

              results.keyPrice.forEach((element) => {
                if (price.products[element].attributes.location !== confReg[results.conf.awsRegion] ||
                  price.products[element].attributes.operatingSystem !== 'Windows' ||
                  price.products[element].attributes.licenseModel !== 'License Included' ||
                  price.products[element].attributes.preInstalledSw !== 'NA') {
                  delete price.products[element];
                } else {

                  /**
                   * Take the product key, and search on the terms key, the price of the product.
                   * Add a price key on the product with the price find
                   */

                  var firstKey = Object.keys(price.terms.OnDemand[price.products[element].sku])[0];
                  var secondKey = Object.keys(price.terms.OnDemand[price.products[element].sku][firstKey].priceDimensions)[0];
                  price.products[element].attributes.price =
                    price.terms.OnDemand[price.products[element].sku][firstKey].priceDimensions[secondKey].pricePerUnit.USD;
                }
              });
            })
            .then(() => {
              delete price.terms;
            })
            .then(() => {
              return resolve(price);
            })
            .catch((err) => {
              return reject(err);
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
   *  - awsMachineSubnet: Subnet's id to apply to machines
   *
   * @method createMachine
   * @param {Object} options The machine options. `options.name`: The name of
   * the machine
   * @return {Promise[Machine]} The created machine
   */
  createMachine(options) {
    return ConfigService.get('awsFlavor', 'plazaURI', 'awsKeyName', 'plazaPort', 'awsMachineSubnet')
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
                UserData : userData,
                subnetId : config.awsMachineSubnet
              }, (err, server) => {
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
                      }
                      return resolve({
                        server: server,
                        password: res.PasswordData,
                        image: image
                      });
                    });
                }

                this._client.ec2
                  .waitFor('instanceStatusOk', {
                    InstanceIds: [server.id]
                  }, (err) => {

                    if (err) {
                      return reject(err);
                    }

                    this._client.ec2
                      .waitFor('systemStatusOk', {
                        InstanceIds: [server.id]
                      }, (err) => {
                        if (err) {
                          return reject(err);
                        }

                        return resolve({
                          server: server,
                          password: image.password,
                          image: image
                        });
                      });
                  });
              });
            })
              .then((res) => {
                return new Promise((resolve, reject) => {
                  res.server.refresh((err, server) => {
                    if (err) {
                      reject(err);
                    } else {
                      res.server = server;
                      resolve(res);
                    }
                  });
                });
              })
              .then((res) => {
                const server = res.server;
                const password = res.password;
                const image = res.image;
                const ip = server.addresses.public[0] || server.addresses.private[0];
                const type = this.name();

                return ConfigService.get('awsMachineUsername', 'plazaPort', 'awsFlavor')
                  .then((config) => {

                    let _createMachine = function(password) {
                      return Machine.create({
                        id: server.id,
                        name: server.name,
                        type: type,
                        flavor: config.awsFlavor,
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

  /**
   * Calculate credit used by a user
   *
   * @method getUserCredit
   * @param {user} user User to calculate credit usage from
   * @return {Promise[number]}
   */
  getUserCredit(user) {

    return this.awsPrice.then((price) => {
      return new Promise((resolve, reject) => {
        var finalPrice = 0;
        let history = [];
        user.getHistory('aws')
          .then((machineHistory) => {

            /**
             * Here we retrieve all the machines keys of the
             * history we retrived before, matching with machines type
             */
            history = machineHistory;

            var prod = Object.keys(price.products);

            history.forEach((element) => {
              prod.forEach((key) => {
                if (price.products[key].attributes.instanceType === element.type) {
                  element.time = element.time * price.products[key].attributes.price;
                }
              });
            });
          })
          .then(() => {

            /**
             * Calculate the price of all machines
             */

            history.forEach((element) => {
              finalPrice += element.time;
            });
          })
          .then(() => {
            return resolve(finalPrice);
          })
          .catch((err) => {
            return reject(err);
          });
      });
    });
  }
}

module.exports = AWSDriver;
