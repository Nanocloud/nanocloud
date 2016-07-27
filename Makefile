get-deps:
	npm install

tests:
	./tests/test-all.sh

test-api:
	mocha tests/api/bootstrap.test.js tests/api/index.js

test-units:
	mocha ./tests/unit/**/*.js

test-jshint:
	jshint api/ config/

test-licenses:
	./tests/test-licenses.sh

.PHONY: tests
