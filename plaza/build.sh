#!/bin/sh
#
# Nanocloud Community, a comprehensive platform to turn any application
# into a cloud solution.
#
# Copyright (C) 2016 Nanocloud Software
#
# This file is part of Nanocloud community.
#
# Nanocloud community is free software; you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# Nanocloud community is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

COMMAND=${1}
GOOS=${GOOS:-windows}
GOARCH=${GOARCH:-amd64}

if [ "${COMMAND}" = "docker" ]; then
    docker build -t nanocloud/plaza .
    docker run \
        -e "GOOS=${GOOS}" \
        -e "GOARCH=${GOARCH}" \
        -i --name plaza nanocloud/plaza ./build.sh
    if [ "${GOOS}" = "windows" ]; then
      docker cp plaza:/go/src/github.com/Nanocloud/community/plaza/plaza.exe .
    else
      docker cp plaza:/go/src/github.com/Nanocloud/community/plaza/plaza .
    fi
    docker kill plaza
    docker rm plaza
    docker rmi nanocloud/plaza
else
    export GOOS
    export GOARCH

    go build
fi
