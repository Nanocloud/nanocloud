#!/bin/bash

LICENSE_TEXT="/**
 * Nanocloud, a comprehensive platform to turn any application into a cloud
 * solution.
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

echo "" > add_licence.log

echo "### Find source files in frontend"
for file in $(find assets -path assets/tmp -prune -o -name "*.js" | grep -v node_modules | grep -v bower_components | grep -v dist); do
  if [ "${file}" = "assets/tmp" ]; then
    continue
  fi

  echo "Scanning ${file}" >> add_licence.log
  if [ -z "$(grep "Copyright" "${file}")" ]; then
    echo "Adding licence in : ${file}"
    { echo -n "${LICENSE_TEXT}"; cat "${file}"; } > "${file}.new"
    mv "${file}.new" "${file}"
  fi
done

echo "### Find source files in *config* directory"
for file in $(find config -name "*.js"); do
  echo "Scanning ${file}" >> add_licence.log
  if [ -z "$(grep "Copyright" "${file}")" ]; then
    echo "Adding licence in : ${file}"
    { echo -n "${LICENSE_TEXT}"; cat "${file}"; } > "${file}.new"
    mv "${file}.new" "${file}"
  fi
done

echo "### Find source files in *api* directory"
for file in $(find api -name "*.js"); do
  echo "Scanning ${file}" >> add_licence.log
  if [ -z "$(grep "Copyright" "${file}")" ]; then
    echo "Adding licence in : ${file}"
    { echo -n "${LICENSE_TEXT}"; cat "${file}"; } > "${file}.new"
    mv "${file}.new" "${file}"
  fi
done

echo "### Find source files in *plaza* directory"
for file in $(find plaza -name "*.go"); do
  echo "Scanning ${file}" >> add_licence.log
  if [ -z "$(grep "Copyright" "${file}")" ]; then
    echo "Adding licence in : ${file}"
    { echo -n "${LICENSE_TEXT}"; cat "${file}"; } > "${file}.new"
    mv "${file}.new" "${file}"
  fi
done

echo "### Find source files in *tests* directory"
for file in $(find tests -name "*.js"); do
  echo "Scanning ${file}" >> add_licence.log
  if [ -z "$(grep "Copyright" "${file}")" ]; then
    echo "Adding licence in : ${file}"
    { echo -n "${LICENSE_TEXT}"; cat "${file}"; } > "${file}.new"
    mv "${file}.new" "${file}"
  fi
done
