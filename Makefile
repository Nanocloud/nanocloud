get-deps:
	npm install

tests:
	./tests/test-all.sh

test-api:
	node_modules/mocha/bin/mocha tests/api/bootstrap.test.js tests/api/index.js

test-units:
	node_modules/mocha/bin/mocha tests/api/bootstrap.test.js ./tests/unit/**/*.js

test-linter:
	node_modules/jshint/bin/jshint .
	./node_modules/eslint/bin/eslint.js -c eslintrc.json .
	./node_modules/eslint/bin/eslint.js -c ./tests/eslintrc.json ./tests

test-licenses:
	./tests/test-licenses.sh

.PHONY: tests
