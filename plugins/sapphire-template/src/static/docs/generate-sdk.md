# Swagger-codegen - generate sdk

### Important!

You should ```sh npm run start``` at least one time to allow sdk generation.

Generate sdk for your service:

You can install the openapi-generator globally by this command:
```sh
npm install @openapitools/openapi-generator-cli -g
```

Install openapi-generator as a part of your service (to allow the Jenkins job to create SDK as a part of the pipeline):
```sh
npm install @openapitools/openapi-generator-cli -D
npm run generate-sdk
```

The new SDK will be created in your root service folder.
