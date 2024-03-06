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
       {
         from: `${path.dirname(require.resolve(`@amplication/auth-core/package.json`))}/src/static`,
         to: "static",
         priority: 1,
       },
       {
         from: `${path.dirname(require.resolve(`@amplication/auth-core/package.json`))}/src/templates`,
         to: "templates",
         priority: 1,
       },
       {
         from: "src/static",
         to: "static",
         noErrorOnMissing: true,
         force: true,
         priority: 2,
       },
       {
         from: "src/templates",
         to: "templates",
         noErrorOnMissing: true,
         force: true,
         priority: 2,
       },
     ],
   });
   // ...
   ```

3. update the plugin class to override the register function, with optionally a set of ignored events that will be managed by the plugin itself.

   ```ts
   // ...
   import { AuthCorePlugin } from "@amplication/auth-core";

   class DummyPlugin extends AuthCorePlugin {
     register(): Events {
       return merge(
         super.register(), // <----  important bit
         {
           CreateServer: {
             before: this.beforeCreateServer,
           },
           // ....
         }
       );
     }
   }
   ```

   ```ts
   // ...
   import { AuthCorePlugin } from "@amplication/auth-core";
   import { merge } from "lodash";
   class DummyPluginWithIgnoredEvents extends AuthCorePlugin {
     constructor() {
       const ignoredEvents = new Set([EventNames.CreateEntityModuleBase]);
       super(ignoredEvents);
     }

     register(): Events {
       return merge(
         super.register(), // <----  important bit
         {
           CreateServer: {
             before: this.beforeCreateServer,
           },
           CreateEntityModuleBase: {
             before: beforeFn,
             after: afterFn,
           },
         }
       );
     }
   }
   // ...
   ```

```

```
