# lib-auth-core

Base library for auth plugins that contains helpers to generate authorization controls.

## Importing this library

As this library is an internal only library, in order to import it and use it in a plugin follow the steps:

1. add dependency into the plugin `package.json`
   ```jsonc
   // ...
   "dependencies": {
      "@amplication/auth-core": "*",
      "@amplication/code-gen-types": "^2.0.23",
      "@amplication/code-gen-utils": "^0.0.9",
   },
   // ...
   ```
2. update the `webpack.config.js` to import any static / template files. This step is very important for the successful run of the auth-core methods.
   ```js
   // ...
   new CopyWebpackPlugin({
     patterns: [
       { from: "src/static", to: "static", noErrorOnMissing: true },
       { from: "src/templates", to: "templates", noErrorOnMissing: true },
       {
         from: `${path.dirname(require.resolve(`@amplication/auth-core/package.json`))}/src/static`,
         to: "static",
       },
       {
         from: `${path.dirname(require.resolve(`@amplication/auth-core/package.json`))}/src/templates`,
         to: "templates",
       },
     ],
   });
   // ...
   ```
