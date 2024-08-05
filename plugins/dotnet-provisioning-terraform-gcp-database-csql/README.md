# @amplication/plugin-provisioning-terraform-gcp-database-csql

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/dotnet-plugin-provisioning-terraform-gcp-database-csql)](https://www.npmjs.com/package/@amplication/dotnet-plugin-provisioning-terraform-gcp-database-csql)

Adds a container registry setup based on terraform for Google Cloud Platform to the generated service.

## Purpose

Adds a container registry setup based on terraform for Google Cloud Platform to the generated service.

## Configuration

`name` will determine the name of the database instance, if unset it will default to the name of the generated service.

`environment` used to determine in which project to place the database instance.

`team` used to determine in which project to place the database instance.

`region` determines where the database instance will be hosted.

`zone_suffix` in which gcp zone within the region to place the resource, when a single zone instance is applicable.

`tier` the database instance type/tier, resulting in less or more cpu and memory.

`availability_type` the availability type for the database instance, options are `REGIONAL` or `ZONAL`

`disk_size` the disk size for the database instance.

`disk_type` the disk type for the database instance.

`charset` the database character set.

`collation` the database collation.

`deletion_protection` whether or not to enable deletion protection, preventing easy deletion of the resource.

`version` the version of the database type.

## Usage

It will add a terraform file containing the resources information for the container repository, it is dependant on the `provisioning-terraform-gcp-core` plugin to work.
