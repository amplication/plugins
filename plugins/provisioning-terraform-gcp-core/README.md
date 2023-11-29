# @amplication/plugin-provisioning-terraform-gcp-core

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-provisioning-terraform-gcp-core)](https://www.npmjs.com/package/@amplication/plugin-provisioning-terraform-gcp-core)

Adds a core networking setup of terraform for Google Cloud to the generated service.

## Purpose

Adds a core networking setup of terraform for Google Cloud to the generated service.

## Configuration

`root_level` determines whether the directory where the terraform code will exists, lives under the root of the repository or on the level of the generated service.

`directory_name` determines the name for the directory where the generated code will live under, defaults to 'terraform'.

`global.organization_id` the identifier for the organization under which to create the core resources.

`global.billing_account` the identifier for the billing account to which to associate the resources.

`global.billing_project` the identifier for a pre-configured google cloud project with a linked billing account.

`global.domain` the domain name associated with the organization.

`global.region_prefix` the base identifier for the region, different options can be found here: https://cloud.google.com/compute/docs/regions-zones.

`environments` the environments block allows for specifying multiple environments and the teams that are associated with that applicationb environment, example:

```json
"environments": {
    "production": {
    "cidr": "10.10.0.0/16",
    "teams": ["operations"]
    },
    "non-production": {
    "cidr": "10.20.0.0/16",
    "teams": ["development", "operations"]
    }
}
```

`backend` the backend part of the configuraiton allows for specify whether to use a `local` backend or a `gcs` backend, the latter is advised. 

## Usage

As this is an addition to the code base, where non of the other code is touched, using the plugin won't impact the final build.