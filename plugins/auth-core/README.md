# @amplication/plugin-auth-basic

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-auth-basic)](https://www.npmjs.com/package/@amplication/plugin-auth-api) 

Enable API authentication on a service

## Purpose

This plugin adds the required code to use Basic strategy on the generated NestJS application 

## Configuration

None

## Usage

This plugin is integrarted with the default behaviour of the service by changing the `defaultAuth.guard.ts` file in the `auth` folder, so all guards on REST API controllers and GraphQL API resolvers will use this authentication by default. 
