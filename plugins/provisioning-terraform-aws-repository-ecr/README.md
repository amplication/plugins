# @amplication/plugin-provisioning-terraform-aws-repository-ecr

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-provisioning-terraform-aws-repository-ecrc)](https://www.npmjs.com/package/@amplication/plugin-provisioning-terraform-aws-repository-ecr)

Adds a container registry setup based on terraform for Amazon Web Services to the generated service.

## Purpose

The purpose of this plugin is to be able to add a terraform code that can be used to provision a container registry within Amazon Elastic Container Registry.

## Configuration

`repository_name` determines what the name of the repository for the generated service will be - in the following format: aws_account_id.dkr.ecr.region.amazonaws.com/<repository_name>`

`repository_type` determines what type the repository will be, this can eiter be `public` or `private`.

`configuration` adds additional configuration to the container repository.

`configuration.force_delete` determines if the repository will be deleted on a terraform destroy - even if it contains container images.

## Usage

As this is an addition to the code base, where non of the other code is touched, using the plugin won't impact the final build.
