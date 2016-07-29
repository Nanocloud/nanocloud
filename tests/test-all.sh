#!/bin/bash

EXIT_STATUS=0

function check_command {
    "$@"
    local STATUS=$?
    if [ $STATUS -ne 0 ]; then
        echo "error with $1 ($STATUS)" >&2
        EXIT_STATUS=$STATUS
    fi
}

check_command make test-licences
check_command make test-jshint
check_command make test-api
check_command make test-units

exit $EXIT_STATUS
