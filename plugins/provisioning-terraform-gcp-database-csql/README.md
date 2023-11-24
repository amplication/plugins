# @amplication/plugin-provisioning-terraform-gcp-database-csql

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-provisioning-terraform-gcp-database-csql)](https://www.npmjs.com/package/@amplication/plugin-provisioning-terraform-gcp-database-csql)

Adds a container registry setup based on terraform for Google Cloud Platform to the generated service.

## Purpose

Adds a container registry setup based on terraform for Google Cloud Platform to the generated service.

## Configuration

If a configuration is required, add it here.

`name` will determine the name of the database instance, if unset it will default to the name of the generated service.

`project_identifier` determines in which project to place the database instance.

`region` determines where the database instance will be hosted.
`zone_suffix`
`tier`
`availability_type`
`disk_size`
`disk_type`
`charset`
`collation`
`deletion_protection`
`version`

## Usage

It will add a terraform file containing the resources information for the container repository, it is dependant on the `provisioning-terraform-gcp-core` plugin to work.
