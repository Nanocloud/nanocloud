# Nanocloud

[![Build Status](https://travis-ci.org/Nanocloud/nanocloud.svg?branch=master)](https://travis-ci.org/Nanocloud/nanocloud) [![Code Climate](https://codeclimate.com/github/Nanocloud/nanocloud/badges/gpa.svg)](https://codeclimate.com/github/Nanocloud/nanocloud) [![Coverage Status](https://coveralls.io/repos/github/Nanocloud/nanocloud/badge.svg?branch=master)](https://coveralls.io/github/Nanocloud/nanocloud?branch=master)

# Run

Nanocloud relies on Docker containers to run its stack.

```
docker-compose build
docker-compose up
```

# Configure

Some configuration variable are expected to be set in
`config/env/development.js` but you can also create the file `config/local.js`
to avoid commiting those changes

## General settings

- iaas (mandatory) currently only "manual", "qemu" and "aws" are implemented
- host (mandatory, defaults to localhost) nanocloud's host
- photon (defaults to false) activate Photon as default streaming engine (experimental feature, AWS only)
- expirationDate (Defaults to 0 (deactivated)) number of days a user account should remain active
- autoRegister (Defaults to false) user can signup to the platform
- autoLogoff (Defaults to false) VDI sessions are signed off automatically
- defaultGroup (Defaults to empty string (no default group)) id of the group users should be attached to automatically
- machinePoolSize (Defaults to 1) the number of machine to provision in advance ready to accept users
- machinesName (Defaults to 'Nanocloud Exec Server') default name for machines
- plazaURI (Defaults to https://s3-eu-west-1.amazonaws.com/nanocloud/plaza/1.0.0/windows/amd64/plaza.exe) URL to download plaza from
- plazaPort (Defaults to 9090) port to communicate with plaza
- neverTerminateMachine (Defaults to false) if set to true, machines are
  never destroyed, users always keep the same machine at all time.

## SMTP configuration

- smtpServerHost host to send email
- smtpServerPort (defaults to 25) port for the SMTP server
- smtpLogin login for the SMTP server
- smtpPassword password for the SMTP server
- smtpSendFrom (defaults to mail@nanocloud.com) nanocloud's sender

## Look and feel

- title (defaults to Nanocloud) page title
- favIconPath (defaults to favicon.ico) relative path from `assets/dist`
- logoPath (defaults to `/assets/images/logo.png`) relative path from `assets/dist` (URL works)
- primaryColor (defaults to #006CB6) primary color to use

## Manual driver specific

- machines (array) Array of machine object to statically insert in the database

Machines objects contains several pieces of information, here's an example:

```
machines: [
  {
    name: 'Machine1',
    type: 'manual',
    ip: '1.2.3.4',
    username: 'Administrator',
    password: 'secr3t'
  }, {
    name: 'Machine2',
    type: 'manual',
    ip: '5.6.7.8',
    username: 'Administrator',
    password: 's3cret'
  }
]
```

You can use *config.env* to set this variable too:

```
MACHINES=[{"name": "My Machine", "type": "manual", "ip": "1.2.3.4", "username": "Administrator", "password": "s3cr3t", "plazaport": 9090, "rdpPort": 3389 }]
```

## AWS driver specific

- awsRegion region where machines will spawn
- awsAccessKeyId AWS key id
- awsSecretAccessKey AWS private key
- awsKeyName private key name
- awsPrivateKey (Defaults to /opt/back/id_rsa) path to where the key will be stored
- awsImage Nanocloud's execution servers default image
- awsFlavor (Defaults to t2.medium) size of virtual machines
- awsMachineUsername (Defaults to Administrator) administrator account on the machine
- awsMachinePassword (Defaults to empty string, will be generated if possible) administrator password on the machine
- awsMachineSubnet (Defaults to empty string, automatic subnet) subnet to assign to the machine
- awsDiskSize (Defaults to 0, automatic size) root disk size in GB
- creditLimit (Defaults empty string) set a credit limit to users (aws only)

## Openstack driver specific

- openstackUsername username to connect to openstack
- openstackPassword password to connect to openstack
- openstackAuthUrl url of the openstack's API (example: https://identity.example.com:5000)
- openstackRegion (Defaults to 'RegionOne') region name to use on openstack
- openstackImage if of the image to boot Windows execution servers from
- openstackFlavor (defaults to m1.medium) flavor for the virtual machine
- openstackSecurityGroups (Defaults to ['default']) array of security groups to apply to the instance
- openstackMachineUsername (Defaults to Administrator) windows account username
- openstackMachinePassword (Defaults empty, password will generated) windows account password

## Qemu driver specific

- qemuServiceURL (Default to localhost) url of qemu manager service
- qemuServicePort (Default to 3000) port of qemu manager service
- qemuMemory (Default to 2048) memory to allocate to your VMs in MB
- qemuCPU (Default to 2) number of vCPU to allocate to your VMs
- qemuMachineUsername (Defaults to Administrator) windows account username
- qemuMachinePassword (Defaults empty) windows account password

Qemu use *10.0.2.2* to contact host, you should replace default 'localhost' by this ip to be able to use storage.

## Storage configuration

- storageAddress (mandatory, defaults to 'localhost') storage service's IP
- storagePort (mandatory, defaults to 9090) storage service's port
- uploadLimit (defaults 0 (deactivate)) upload limit, in MB, for each user

Once loaded, Nanocloud will be accessible on **localhost**.

## LDAP authentication

- ldapActivated (defaults to false) if true activates LDAP features
- ldapUrl (defaults to 'ldap://localhost:389')
- ldapBaseDn (defaults to empty string)
- ldapDefaultGroup (defaults to empty string (no default group)) id of the group users should be attached to automatically

## RDP/Guacamole Options

You can use RDP options detailed on [Guacamole documentation](http://guacamole.incubator.apache.org/doc/gug/configuring-guacamole.html#rdp). Use config variables with 'rdp' prefix and option name in camel case.

All options are Guacamole defaults except the following:

- rdpSecurity (Nanocloud defaults to nla)
- rdpIgnoreCert (Nanocloud defaults to true)
- rdpWidth (Nanocloud defaults to 0 (automatic))
- rdpHeight (Nanocloud defaults to 0 (automatic))
- rdpDpi (Nanocloud defaults to 0 (automatic))
- rdpEnablePrinting (Nanocloud defaults to true)
- rdpPreconnectionID (Nanocloud defaults to 0 (desactivated))
- rdpEnableWallpaper (Nanocloud defaults to true)
- rdpEnableFontSmooting (Nanocloud defaults to true)

# Run in developer mode

Nanocloud also relies on Docker to run its development stack:

```
docker-compose build
docker-compose -f docker-compose-dev.yml build
docker-compose -f docker-compose-dev.yml up
```

Backend and frontend containers are automatically updated when source code changes in dev mode.
All services are accessible on localhost.

# Optional services

There are 2 optional services described in `docker-compose-extra.yml`:

- team-storage : Another storage container to provide *team* feature
- qemumanager : This is a service aiming to simulate a *IaaS* on a developer's
  machine. This is not production ready.

To launch those services, run:

```
docker-compose -f docker-compose-extra.yml build
docker-compose -f docker-compose-extra.yml up
```

# Tests

To run all tests:

```
make tests
```

This will run all tests defined in `./tests/test-all.sh`.

To run test coverage:

```
make test-coverage
```

This will run api and unit tests, with code coverage

Alternativelly, tests can be run individually:

- `make test-api` to test the API
- `make test-units` to run unit tests
- `make test-linter` to analyse code for errors and warnings
- `make test-licenses` to check for licenses headers

Some environment variables can be set to customize tests:
- testMail (boolean, defaults to false) load stub email transporter for testing purpose
- dummyBootingState (boolean, defaults to false) force machine to stay in booting state for a moment

**API tests expects a postgres database up and running on localhost**
**Some tests may require storage and frontend to be up as well**

# Licence

This file is part of Nanocloud.

Nanocloud is free software; you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

Nanocloud is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
