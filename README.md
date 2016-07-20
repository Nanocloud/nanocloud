# Nanocloud

[![Build Status](https://travis-ci.org/Nanocloud/nanocloud.svg?branch=master)](https://travis-ci.org/Nanocloud/nanocloud) [![Code Climate](https://codeclimate.com/github/Nanocloud/nanocloud/badges/gpa.svg)](https://codeclimate.com/github/Nanocloud/nanocloud)

**Next version of Nanocloud is still in heavy develoment**

# Run

To run the backend:

````
sails lift
````

Some environment variable are expected to be set:
- IAAS (mandatory) choice between "manual" and "aws"

Manual driver specific:
- EXECUTION_SERVERS (mandatory) the IP of the execution server
- WINDOWS_PASSWORD (mandatory) the Windows password for the *administrator* account

AWS drive specific:
- AWS_REGION (mandatory) AWS region
- AWS_ACCESS_KEY_ID (mandatory) Amazon key ID
- AWS_PRIVATE_KEY (mandatory) Amazon private key

# Tests

To run all tests:

````
make tests
````

This will run all tests defined in `./tests/test-all.sh`.

Alternativelly, tests can be run individually:

- `make test-api` to test the API
- `make test-jshint` to analyse code for errors and warnings


## Licence

This file is part of Nanocloud community.

Nanocloud community is free software; you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

Nanocloud community is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
