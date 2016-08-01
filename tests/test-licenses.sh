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

# To change a specific line over every licenses text in source tree, you can
# adapt the followin command
# ```
# git grep -n "your pattern to match" | \
#     column -t -s: | \
#     awk '{ print "sed -i \""$2","$2 + 1 "d\" "$1"; sed -i \""$2"i \\ What do you want to change " $1; }' > test.sh
# ```

ACTION=${1:-tests}
LICENCE_PATTERN="Copyright"
LICENSE_TEXT="/**
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
 * You should have received a copy of the GNU Affero General
 * Public License
 * along with this program.  If not, see
 * <http://www.gnu.org/licenses/>.
 */

"

echo "" > add_license.log

echo "### Looking for source files in frontend"
for file in $(find assets -path assets/tmp -prune -o -name "*.js" | grep -v node_modules | grep -v bower_components | grep -v dist); do
  if [ "${file}" = "assets/tmp" ]; then
    continue
  fi

  echo "Scanning ${file}" >> add_license.log
  if [ -z "$(grep ${LICENCE_PATTERN} "${file}")" ]; then
    if [ "tests" = "${ACTION}" ]; then
      echo "Missing license in : ${file}"
      exit 1
    else
      echo "Adding license in : ${file}"
      { echo -n "${LICENSE_TEXT}"; cat "${file}"; } > "${file}.new"
      mv "${file}.new" "${file}"
    fi
  fi
done

echo "### Looking for source files in *config* directory"
for file in $(find config -name "*.js"); do
  echo "Scanning ${file}" >> add_license.log
  if [ -z "$(grep ${LICENCE_PATTERN} "${file}")" ]; then
    if [ "tests" = "${ACTION}" ]; then
      echo "Missing license in : ${file}"
      exit 1
    else
      echo "Adding license in : ${file}"
      { echo -n "${LICENSE_TEXT}"; cat "${file}"; } > "${file}.new"
      mv "${file}.new" "${file}"
    fi
  fi
done

echo "### Looking for source files in *api* directory"
for file in $(find api -name "*.js"); do
  echo "Scanning ${file}" >> add_license.log
  if [ -z "$(grep ${LICENCE_PATTERN} "${file}")" ]; then
    if [ "tests" = "${ACTION}" ]; then
      echo "Missing license in : ${file}"
      exit 1
    else
      echo "Adding license in : ${file}"
      { echo -n "${LICENSE_TEXT}"; cat "${file}"; } > "${file}.new"
      mv "${file}.new" "${file}"
    fi
  fi
done

echo "### Looking for source files in *tests* directory"
for file in $(find tests -name "*.js"); do
  echo "Scanning ${file}" >> add_license.log
  if [ -z "$(grep ${LICENCE_PATTERN} "${file}")" ]; then
    if [ "tests" = "${ACTION}" ]; then
      echo "Missing license in : ${file}"
      exit 1
    else
      echo "Adding license in : ${file}"
      { echo -n "${LICENSE_TEXT}"; cat "${file}"; } > "${file}.new"
      mv "${file}.new" "${file}"
    fi
  fi
done

echo "### Looking for source files in *plaza* directory"
for file in $(find plaza -name "*.go"); do
  echo "Scanning ${file}" >> add_license.log
  if [ -z "$(grep ${LICENCE_PATTERN} "${file}")" ]; then
    if [ "tests" = "${ACTION}" ]; then
      echo "Missing license in : ${file}"
      exit 1
    else
      echo "Adding license in : ${file}"
      { echo -n "${LICENSE_TEXT}"; cat "${file}"; } > "${file}.new"
      mv "${file}.new" "${file}"
    fi
  fi
done
