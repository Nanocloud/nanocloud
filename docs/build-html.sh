#!/bin/bash

# Nanocloud turns any traditional software into a cloud solution, without
# changing or redeveloping existing source code.
#
# Copyright (C) 2016 Nanocloud Software
#
# This file is part of Nanocloud.
#
# Nanocloud is free software; you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# Nanocloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

ACTION=${1:-build}

if [ "build" = "${ACTION}" ]; then
    docker build -t nanocloud/api-doc .
    docker run --name api-documentation nanocloud/api-doc
    docker cp api-documentation:/opt/output output

    echo "To clean container and images used to generate documentation:"
    echo '$ ./build-html.sh clean'
elif [ "clean" = "${ACTION}" ]; then
    docker rm api-documentation
    docker rmi nanocloud/api-doc
fi
