# @amplication/plugin-db-mongo

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-db-mongo)](https://www.npmjs.com/package/@amplication/plugin-db-mongo) 

Use a Mongo DB database in the service generated by Amplication.

## Purpose

This plugin adds the required code to use Mongo database in the service generated by Amplication.
It updates the following parts:
- Updates the datasource on the `schema.prisma` file
- Adds the requires services and variables to `docker-compose.yml`
- Replaces the `docker-compose-db.yml` 
- Add the requires environment variables to `.env`
- Update package json file in order to support only the relevant prisma mongo commands 
- Change prisma schema fields according to the prisma mongo conventions

## Configuration
The plugin uses the parameters configured on the database tab on the service settings page

![image](https://user-images.githubusercontent.com/43705455/190962515-6ffc6751-71de-4acb-9a85-da9e7096f923.png)


## Usage

This plugin integrates with the all default tasks and scripts used by the generated service:
```json
    "seed": "ts-node scripts/seed.ts",
    "db:clean": "ts-node scripts/clean.ts",
    "prisma:generate": "prisma generate",
    "prisma:init": "prisma init",
    "prisma:pull":"prisma db pull",
    "prisma:push":" prisma db push",
    "docker:db": "docker-compose -f docker-compose.db.yml up -d",
    "docker:build": "docker build .",
    "compose:up": "docker-compose up -d",
    "compose:down": "docker-compose down --volumes"
```    
