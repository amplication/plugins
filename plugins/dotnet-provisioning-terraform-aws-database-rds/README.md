\# @amplication/plugin-dotnet-provisioning-terraform-aws-database-rds

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-dotnet-provisioning-terraform-aws-database-rds)](https://www.npmjs.com/package/@amplication/plugin-dotnet-provisioning-terraform-aws-database-rds)

Adds terraform code for provisioning Amazon Web Services Relational Database Service (RDS) as an addition to the 'core' terraform code base.

## Purpose

Adds terraform code for provisioning Amazon Web Services Relational Database Service (RDS) as an addition to the 'core' terraform code base.

## Configuration

> **Note**
> Currently only postgres is supported as a to be generated database engine type.

`postgres` or `<database-engine>` select the database engine type to be generated, currently support: `postgres`

---

`postgres.identifier` the identifier for the database - for example used in building the connection string.

`postgres.instance_class` the instance class used by the database instance.

`postgres.database_name` the name for the database that is populated by default.

`postgres.username` the name of the master user for the database instance.

`postgres.port` the port used by the database instance.

`postgres.storage.allocated` the storage allocated to the database instance.

`postgres.storage.maximum` the maximum storage allocated to the database instance.

`postgres.maintenance.window` the maintenance window for the database instance

`postgres.backup.window` the time-window for the backup.

`postgres.backup.retention_period` the amount of days to keep the automated backups for.

`postgres.security_group.name` the name for the vpc security group for the database, allowing traffic from inside the vpc to flow to the database instance.

## Usage

Explain the usage of this plugin and its effect on the final build.
