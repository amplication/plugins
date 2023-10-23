# @amplication/plugin-provisioning-terraform-aws-core

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-provisioning-terraform-aws-corec)](https://www.npmjs.com/package/@amplication/plugin-provisioning-terraform-aws-core)

Adds a core networking setup of terraform for Amazon Web Services to the generated service.

## Purpose

Adds a core networking setup of terraform for Amazon Web Services to the generated service. This will serve as a basis for adding additional resources for provisioning, e.g. database, deployment, et cetera.

## Configuration

`root_level` determines whether the directory where the terraform code will exists, lives under the root of the repository or on the level of the generated service.

`directory_name` determines the name for the directory where the generated code will live under, defaults to 'terraform'.

`global.name` determines the name to use across the resources, if the string will be left empty, the name of the generated service will be passed.

`global.region` determines the amazon web services region used across the resources.

`global.environment` determines the value that will be passsed to the environment key of the resource tags which is propagated via the providers default tags.

`vpc` block of settings specific to the vpc resource.

`vpc.cidr_block` determines the cidr block passed to the vpc setup.

`vpc.enable_dns_hostnames` determines whether to enable dns hostnames on the vpc.

`vpc.enable_dns_support` determines whether to enable dns support on the vpc.

`vpc.enable_nat_gateway` determines whether to enable nat gateway on the vpc.

`vpc.single_nat_gateway` determines whether to create a single nat gateway or a nat gateway in every availability zone.

`backend` block of settings specific to the backend configuration, defaults to s3 type as this is best practices, if desired it could be set to 'local' - to write backend state to a file.

`backend.local.path` path to the terraform state file for a local type backend.

`backend.s3.bucket_name` name for the bucket - which should exist already and is not part of this 'core' setup - to store the state in.

`backend.s3.key` the key under which to store the state, within the aforementioned bucket.

`backend.s3.region` the region in which the aforementioned bucket exists - is detached from the `global.region`.


## Usage

As this is an addition to the code base, where non of the other code is touched, using the plugin won't impact the final build.

