#!/usr/bin/bash

# Source the shared development env vars if they are available
if [ -f ".env" ]; then
    source .env
fi

if [ -n "$INFLUX_URL" ]; then
    COUNT=0
    while : ; do
        echo "run query #$((COUNT++))"
        for c in config/*.json; do
            NODE_ENV=$(basename -s .json "$c") node index.js
        done
        sleep 60
    done
else
    while : ; do
        echo "No \$INFLUX_URL variable set, can't run queries."
        sleep 60
    done
fi
