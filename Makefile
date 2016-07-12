get-deps:
	npm install

tests:
	./tests/test-all.sh

test-api:
	mocha tests/api/index.js

test-jshint:
	jshint api/ config/ tasks/

.PHONY: tests
