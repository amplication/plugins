# plugin-backstage-catalog-entity

[![NPM Downloads](https://img.shields.io/npm/dt/plugin-backstage-catalog-entity)](https://www.npmjs.com/package/plugin-backstage-catalog-entity)

This plugin responsible for creating the yaml file which describes the service, which can be used to onboard onto backstage.

## Purpose

The Backstage Software Catalog is a centralized system that keeps track of ownership and metadata for all the software in your ecosystem (services, websites, libraries, data pipelines, etc). The catalog is built around the concept of metadata YAML files stored together with the code, which are then harvested and visualized in Backstage. This plugin responsible for creating the yaml file which describes the service, which can be used to onboard onto backstage.

Documentation:

- register: https://backstage.io/docs/features/software-catalog/#manually-register-components
- documentation: https://backstage.io/docs/features/software-catalog/descriptor-format/

## Configuration

If a configuration is required, add it here.

## Scripts

### `build`

Running `npm run build` will bundle your plugin with Webpack for production.

### `dev`

Running `npm run dev` will watch your plugin's source code and automatically bundle it with every change.

## Usage

Adds a generated static file to be used in the third-party application `backstage`.
