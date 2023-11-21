# @amplication/plugin-swagger-apibody

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-auth-basic)](https://www.npmjs.com/package/@amplication/plugin-auth-basic)

Add Description of Routes and Entity properties to the REST-API Documentation.

```
@common.Post()
  @swagger.ApiCreatedResponse({ type: User })
  @swagger.ApiForbiddenResponse({ type: errors.ForbiddenException })
  @swagger.ApiBody({
    type: UserCreateInput,
  }) /// add this line to every post and update controller
  async create(@common.Body() data: UserCreateInput): Promise<User> {
```

## Purpose

The plugin adds the details of the type of the body to the `Create` and `Update` methods in each controller.

## Configuration

no configuration required

## Scripts

### `build`

Running `npm run build` will bundle your plugin with Webpack for production.

## Usage

add this plugin to the generated code to get extra information on your documentation.
