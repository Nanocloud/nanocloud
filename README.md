# Nanocloud

[![Build Status](https://travis-ci.org/Nanocloud/nanocloud.svg?branch=master)](https://travis-ci.org/Nanocloud/nanocloud) [![Code Climate](https://codeclimate.com/github/Nanocloud/nanocloud/badges/gpa.svg)](https://codeclimate.com/github/Nanocloud/nanocloud)

**Next version of Nanocloud is still in heavy develoment**

# Run

Nanocloud relies on Docker containers to run its stack.

````
docker-compose build
docker-compose up
````

Some environment variable are expected to be set in `config.env`:
- IAAS (mandatory) currently only "manual" and "aws" are implemented
- HOST (mandatory, defaults to localhost) nanocloud's host 
- SMTP_SERVER_HOST host to send email
- SMTP_SERVER_PORT (defaults to 25) port for the SMTP server
- SMTP_LOGIN login for the SMTP server
- SMTP_PASSWORD password for the SMTP server
- SMTP_SEND_FROM (defaults to mail@nanocloud.com) nanocloud's sender

Manual driver specific:
- MACHINES (array) Array of machine object to statically insert in the database

AWS driver specific
- AWS_REGION region where machines will appear
- AWS_ACCESS_KEY_ID KeyId
- AWS_SECRET_ACCESS_KEY Private key
- AWS_KEY_NAME Private key name
- AWS_PRIVATE_KEY (defaults to /tmp/id_rsa) path to where the key will be stored
- AWS_IMAGE (defaults to ami-09e61366, Nanocloud default image)
- AWS_FLAVOR (defaults to t2.medium) size of the virtual machine
- AWS_MACHINE_USERNAME (defaults to Administrator) administrator account on the machine

Storage specific:
- STORAGE_ADDRESS (mandatory, defaults to 'localhost') storage service's IP
- STORAGE_PORT (mandatory, defaults to 9090) storage service's port
- UPLOAD_LIMIT (defaults 0 (desactivated)) upload limit, in MB, for each user

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
- `make test-jshint` to analyse code for errors and warnings

Some environment variables can be set to customize tests:
- TEST_MAIL (boolean, defaults to false) load stub email transporter for testing purpose

**API tests expects a postgres database up and running on localhost**

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
