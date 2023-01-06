#!/usr/bin/env bash

set -e

SRC_CLIENT="src/client"
SRC_SERVER="src/server"
DIST_DIR="dist"

mkdir -p $DIST_DIR

# Client JS
INPUT="$SRC_CLIENT/sidebar.js"
OUTPUT="$DIST_DIR/sidebar.js.html"
echo "<script>" > $OUTPUT
cat $INPUT >> $OUTPUT
echo "</script>" >> $OUTPUT

# Client HTML
cp $SRC_CLIENT/*.html $DIST_DIR

# Client CSS
INPUT="$SRC_CLIENT/sidebar.css"
OUTPUT="$DIST_DIR/sidebar.css.html"
echo "<style>" > $OUTPUT
cat $INPUT >> $OUTPUT
echo "</style>" >> $OUTPUT

# Server JS
node $SRC_SERVER/build.js

# Manifest. This is the last action, since failed builds would fail to upload
# if lacking appsscript.json
cp appsscript.json $DIST_DIR
