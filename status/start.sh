#!/usr/bin/bash

if [ -n "$INFLUX_URL" ]; then
    COUNT=0
    while : ; do
        echo "run query #$((COUNT++))"
        NODE_ENV=staging node index.js
        NODE_ENV=production node index.js
        sleep 10
    done
else
    while : ; do
        echo "No \$INFLUX_URL variable set, can't run queries."
        sleep 60
    done
fi
