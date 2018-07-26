# Logmetrics

Required env var:

- `INFLUX_URL`: the address of the remote InfluxDB install, either IP or FQDN (`.local` addresses do not work yet), for example `http://192.168.0.10:8086`

* `INTERVAL`: the query interval in seconds, defaults to `60`.

Other thing to set up:

- When the service is running, in the `config/` folder create approrpriate configuration files: `<envname>.json` with at least two entries:

```
{
    "apiEndpoint":"https://api.<environment>",
    "authToken": "xxxx"
}
```

The `authToken` can be a named API key, or a JWT token. If it's a JWT token, and token refresh is required, set the `REFRESH_TOKEN` env var to `true`.
