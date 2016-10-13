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
# You should have received a copy of the GNU Affero General
# Public License
# along with this program.  If not, see
# <http://www.gnu.org/licenses/>.

# Detect where is the absolute path to repository
NANOCLOUD_DEPLOY_SCRIPT="$(readlink -e "${0}")"
NANOCLOUD_DEPLOY_DIR=$(dirname "${NANOCLOUD_DEPLOY_SCRIPT}")
NANOCLOUD_REPO_DIR=$(dirname "${NANOCLOUD_DEPLOY_DIR}")

PR_NUMBER=${1}
REMOTE_NAME=${2:-"origin"}

BRANCH_NAME="PR-${PR_NUMBER}"
DOCKER_COMPOSE_YML="docker-compose-${PR_NUMBER}.yml"

cd "${NANOCLOUD_REPO_DIR}" || exit 1

# Fetch pull request
git fetch "${REMOTE_NAME}" "pull/${PR_NUMBER}/head:${BRANCH_NAME}"
git checkout "${BRANCH_NAME}"

# Custom configurations
cp proxy/nginx.conf proxy/nginx.pr.conf
sed -i "s/backend:/backend-42${PR_NUMBER}:/" "proxy/nginx.pr.conf"
sed -i "s/guacamole-client:/guacamole-client-42${PR_NUMBER}:/" "proxy/nginx.pr.conf"

cp docker-compose-pr.yml "${DOCKER_COMPOSE_YML}"
sed -i "s/PRPORTS/42${PR_NUMBER}/" "${DOCKER_COMPOSE_YML}"

cp config/connections.js backupConnection.js
sed -i "s/host: 'postgres'/host: 'postgres-42${PR_NUMBER}'/" "config/connections.js"

# Build and run containers
docker-compose build
docker-compose up -d storage guacd
docker-compose -f "${DOCKER_COMPOSE_YML}" up -d

# Erase custom configurations
mv backupConnection.js config/connections.js
rm -rf proxy/nginx.pr.conf
rm -rf "${DOCKER_COMPOSE_YML}"
git checkout master
