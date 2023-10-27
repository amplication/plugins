# @amplication/plugin-provisioning-terraform-aws-database-rds

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-provisioning-terraform-aws-database-rds)](https://www.npmjs.com/package/@amplication/plugin-provisioning-terraform-aws-database-rds)

A short description of the plugin and its actions.

## Purpose

What is the purpose of this plugin and what exactly does it do.

## Configuration

> **Note**
> Currently only postgres is supported as a to be generated database engine type.

`database.type` select the database engine type to be generated, currently support: `postgres`

---

`database.postgres.identifier` the identifier for the database - for example used in building the connection string.

`database.postgres.instance_class` the instance class used by the database instance.

`database.postgres.database_name` the name for the database that is populated by default.

`database.postgres.username` the name of the master user for the database instance.

`database.postgres.port` the port used by the database instance.

`database.postgres.storage.allocated` the storage allocated to the database instance.

`database.postgres.storage.maximum` the maximum storage allocated to the database instance.

`database.postgres.maintenance.window` the maintenance window for the database instance

`database.postgres.backup.window` the time-window for the backup.

`database.postgres.backup.retention_period` the amount of days to keep the automated backups for.

`database.postgres.security_group.name` the name for the vpc security group for the database, allowing traffic from inside the vpc to flow to the database instance.

## Usage

Explain the usage of this plugin and its effect on the final build.
