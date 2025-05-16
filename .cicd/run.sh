#!/bin/bash -eufx

./node_modules/.bin/enkore .

node products/npmPackage_0/dist/default/index.mjs
