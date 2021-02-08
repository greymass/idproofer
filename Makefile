BIN := ./node_modules/.bin
SRC_FILES := $(shell find src -name '*.ts')

define VERSION_TEMPLATE
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = "$(shell node -p 'require("./package.json").version')-$(shell git rev-parse --short HEAD)";
endef

all: lib

export VERSION_TEMPLATE
lib: $(SRC_FILES) node_modules tsconfig.json
	${BIN}/tsc -p tsconfig.json --outDir lib && \
	echo "$$VERSION_TEMPLATE" > lib/version.js && \
	touch lib

.PHONY: dev
dev: node_modules
	@${BIN}/onchange -k -i 'src/**/*.ts' 'config/*' -- ${BIN}/ts-node src/app.ts | ${BIN}/bunyan -o short

.PHONY: lint
lint: node_modules
	@${BIN}/eslint src --ext .ts --fix

node_modules: package.json yarn.lock
	yarn install --non-interactive --frozen-lockfile

.PHONY: clean
clean:
	rm -rf lib/

.PHONY: distclean
distclean: clean
	rm -rf node_modules/
