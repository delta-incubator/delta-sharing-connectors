#!/usr/bin/env bash

set -e

DIST_DIR="dist"

mkdir -p $DIST_DIR

# Server JS
node src/build.js

# Manifest. This is the last action, since failed builds would fail to upload
# if lacking appsscript.json
cp appsscript.json $DIST_DIR