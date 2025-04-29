#!/bin/bash -eufx

./node_modules/.bin/enkore .

node products/npmPackage/dist/default/index.mjs
