# @amplication/plugin-transport-https

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-transport-https)](https://www.npmjs.com/package/@amplication/plugin-transport-https)

The generated service from [Amplication](https://amplication.com/) has support for starting service in HTTP mode only. This plugin adds support for HTTPS mode and TLS termination at application level. This plugin is useful when you want to deploy your application to a cloud provider that supports TLS termination at application level or load balancer is not available.

## Purpose

This adds support for startup of multiple servers in the same process. The plugin will start the HTTP server and HTTPS server in the same process if `APP_MODE` is set to `both` as shown in [NEST documentation](https://docs.nestjs.com/faq/multiple-servers). You can change the behavior by changing environment variables. 

## Configuration

The plugin has following configuration options:

- `appMode` - The mode in which the application will start. The default value is `both`. The possible values are `http`, `https` and `both`. If the value is `http` only HTTP server will be started. If the value is `https` only HTTPS server will be started. If the value is `both` both HTTP and HTTPS servers will be started. (default: `both`, options: `http`, `https`, `both`)

> [!NOTE]
> The behavior of the plugin can be changed later too by changing the environment variables.

- `httpsPort` - The port on which the HTTPS server will listen. (default: `443`, options: `1-65535`). Only used when `APP_MODE` is set to `both`. In case of `https` mode the port is always the earlier defined `PORT` environment variable.

- `httpsCertDir` - The directory where the HTTPS certificate and key files are located. (default: `./certs`, optional)

- `httpsCertName` - The name of the certificate file to be used for HTTPS server. (default: `server.crt`, optional)

- `httpsKeyName` - The name if the server key to be used for HTTPS server. (default: `server.key`, optional)

- `caKeyName` - The name of the CA key to be used for HTTPS server. (default: `ca.key`, optional)

- `caCertName` - The name of the CA certificate to be used for HTTPS server. (default: `ca.crt`, optional)

## Scripts

### `build`

Running `npm run build` will bundle the plugin with Webpack for production.

### `dev`

Running `npm run dev` will watch the plugin's source code and automatically bundle it with every change.

### `test`

Running `npm run test` will run the plugin's tests using Jest.

## Usage

To start the server you can use the "ssl:generate" script as follows:

```bash
npm run ssl:generate
```

This will generate the HTTPS certificate and key files in the `./certs` directory. The default values for the certificate and key files are `server.crt` and `server.key` respectively. You can change the values by setting the `httpsCertName` and `httpsKeyName` environment variables.
