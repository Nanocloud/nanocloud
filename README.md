# Nanocloud

[![Build Status](https://travis-ci.org/Nanocloud/nanocloud.svg?branch=master)](https://travis-ci.org/Nanocloud/nanocloud) [![Code Climate](https://codeclimate.com/github/Nanocloud/nanocloud/badges/gpa.svg)](https://codeclimate.com/github/Nanocloud/nanocloud)

# Run

Nanocloud relies on Docker containers to run its stack.

````
docker-compose build
docker-compose up
````

Some configuration variable are expected to be set in `config/env/development.js`:
- iaas (mandatory) currently only "manual" and "aws" are implemented
- host (mandatory, defaults to localhost) nanocloud's host
- expirationDate (Defaults to 0 (deactivated)) number of days a user account should remain active
- autoRegister (Defaults to false) user can signup to the platform
- autoLogoff (Defaults to false) VDI sessions are signed off automatically
- defaultGroup (Defaults to empty string (no default group)) id of the group users should be attached to automatically
- machinePoolSize (Defaults to 1) the number of machine to provision in advance ready to accept users
- machinesName (Defaults to 'Nanocloud Exec Server') default name for machines
- plazaURI (Defaults to https://s3-eu-west-1.amazonaws.com/nanocloud/plaza/1.0.0/windows/amd64/plaza.exe) URL to download plaza from
- plazaPort (Defaults to 9090) port to communicate with plaza

SMTP configuration:
- smtpServerHost host to send email
- smtpServerPort (defaults to 25) port for the SMTP server
- smtpLogin login for the SMTP server
- smtpPassword password for the SMTP server
- smtpSendFrom (defaults to mail@nanocloud.com) nanocloud's sender

Look and feel:
- title (defaults to Nanocloud) page title
- favIconPath (defaults to favicon.ico) relative path from `assets/dist`
- logoPath (defaults to `/assets/images/logo.png`) relative path from `assets/dist` (URL works)
- primaryColor (defaults to #006CB6) primary color to use

Manual driver specific:
- machines (array) Array of machine object to statically insert in the database

AWS driver specific:
- awsRegion region where machines will spawn
- awsAccessKeyId AWS key id
- awsSecretAccessKey AWS private key
- awsKeyName private key name
- awsPrivateKey (Defaults to /opt/back/id_rsa) path to where the key will be stored
- awsImage (Defaults to ami-09e61366) Nanocloud's execution servers default image)
- awsFlavor (Defaults to t2.medium) size of virtual machines
- awsMachineUsername (Defaults to Administrator) administrator account on the machine
- awsMachinePassword (Defaults to empty string, will be generated if possible) administrator password on the machine
- awsMachineSubnet (Defaults to empty string, automatic subnet) subnet to assign to the machine
- creditLimit (Defaults empty string) set a credit limit to users (aws only)

Openstack driver specific:
- openstackUsername username to connect to openstack
- openstackPassword password to connect to openstack
- openstackAuthUrl url of the openstack's API (example: https://identity.example.com:5000)
- openstackRegion (Defaults to 'RegionOne') region name to use on openstack
- openstackImage if of the image to boot Windows execution servers from
- openstackFlavor (defaults to m1.medium) flavor for the virtual machine
- openstackSecurityGroups (Defaults to ['default']) array of security groups to apply to the instance
- openstackMachineUsername (Defaults to Administrator) windows account username
- openstackMachinePassword (Defaults empty, password will generated) windows account password

Libvirt driver specific:
- libvirtServiceURL (Default to localhost) url of libvirt manager service
- libvirtServicePort (Default to 3000) port of libvirt manager service
- libvirtMemory (Default to 4096000) memory to allocate to your VMs in bit
- libvirtCPU (Default to 2) number of vCPU to allocate to your VMs
- libvirtDrive absolute path to your virtual hard drive

Storage configuration:
- storageAddress (mandatory, defaults to 'localhost') storage service's IP
- storagePort (mandatory, defaults to 9090) storage service's port
- uploadLimit (defaults 0 (deactivate)) upload limit, in MB, for each user

Once loaded, Nanocloud will be accessible on **localhost**.

# Run in developer mode

Nanocloud also relies on Docker to run its development stack:

````
docker-compose build
docker-compose -f docker-compose-dev.yml build
docker-compose -f docker-compose-dev.yml up
````

Backend and frontend containers are automatically updated when source code changes in dev mode.
All services are accessible on localhost.

# Tests

To run all tests:

````
make tests
````

This will run all tests defined in `./tests/test-all.sh`.

Alternativelly, tests can be run individually:

- `make test-api` to test the API
- `make test-units` to run unit tests
- `make test-linter` to analyse code for errors and warnings
- `make test-licenses` to check for licenses headers

Some environment variables can be set to customize tests:
- testMail (boolean, defaults to false) load stub email transporter for testing purpose

**API tests expects a postgres database up and running on localhost**
**Some tests may require storage and frontend to be up as well**

## Licence

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
