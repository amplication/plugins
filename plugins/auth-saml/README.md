# @amplication/plugin-auth-saml

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-auth-jwt)](https://www.npmjs.com/package/@amplication/plugin-auth-jwt)

Enable SAML authentication on a service

## Purpose

This plugin adds the required code to use Passport SAML strategy on the generated NestJS application. As SAML is used for authentication, a JWT token is generated for any successful authentication and it will be used for authorization in the service.

## Configuration

None

## Usage

This plugin is integrated with the default behavior of the service by changing the `defaultAuth.guard.ts` file in the `auth` folder, so all guards on REST API controllers and GraphQL API resolvers will use this authentication by default.
