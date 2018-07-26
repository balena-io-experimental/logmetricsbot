require("dotenv").config();
const _ = require("lodash");
const Influx = require("influxdb-nodejs");
const config = require("config");
const fs = require("fs");
const util = require("util");
const jsonfile = require("jsonfile");
const request = require("request");
const PinejsClient = require("pinejs-client");

const db_link = `${process.env.INFLUX_URL}/servicelogs`;
const client = new Influx(db_link);

const env = process.env.NODE_ENV || "staging";

// Load authToken from the config file
const authToken = config.get("authToken");
const authHeader = {
  passthrough: {
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  }
};
// Connect to the resin API
const resinApi = new PinejsClient(`${config.get("apiEndpoint")}/v4/`);

// Data logging schema
const fieldSchema = {
  online: "i",
  logstream: "i",
  logstream_fraction: "f"
};

/*
* Refresh local access token, so it doesn't expire
*/
var refreshToken = async function() {
  const file = `./config/${env}.json`;
  var options = {
    url: `${config.get("apiEndpoint")}/user/v1/refresh-token`,
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  };
  request(options, (err, resp, body) => {
    if (err) {
      console.log(err);
    } else if (resp.statusCode === 200) {
      var obj = {
        apiEndpoint: config.get("apiEndpoint"),
        authToken: body
      };
      jsonfile.writeFile(file, obj, function(err) {
        if (err) {
          console.error(err);
        }
      });
    }
  });
};

/*
*  Query devices' settings and save data to the remote DB
*/
async function querydevices() {
  const device = {
    resource: "device"
  };
  const filter = {
    options: {
      $select: "logs_channel",
      $filter: {
        is_online: true
      }
    }
  };
  const devices = await resinApi.get(_.assign(device, filter, authHeader));

  // Separate devices with `logs_channel` set to `null` summed up in the `true` entries,
  // and those which have a set value, summed up in the `false` entries
  const results = _.countBy(devices, d => {
    return d.logs_channel === null;
  });

  // Calculate the outgoing data points with corner cases
  const online_count = devices.length;
  const logstream_count = results.true ? results.true : 0;
  const logstream_fraction =
    online_count > 0 ? logstream_count / online_count : 0;

  // Save data points to the remote database
  client.createDatabase().then(() => {
    client
      .write(`logs_${env}`)
      .field({
        online: online_count,
        logstream: logstream_count,
        logstream_fraction: logstream_fraction
      })
      .then(() => console.info(`${env}: write point success`))
      .catch(console.error);
  });
}

querydevices();
refreshToken();
