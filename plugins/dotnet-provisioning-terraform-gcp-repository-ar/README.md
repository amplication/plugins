# @amplication/plugin-provisioning-terraform-gcp-repository-ar

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/dotnet-plugin-provisioning-terraform-gcp-repository-ar)](https://www.npmjs.com/package/@amplication/dotnet-plugin-provisioning-terraform-gcp-repository-ar)

Adds a container registry setup based on terraform for Google Cloud Platform to the generated service.

## Purpose

Adds a container registry setup based on terraform for Google Cloud Platform to the generated service.

## Configuration

`repository_name` will determine the name of the container image repository, if unset it will default to the name of the generated service.

`region` determines where the container image repository will be hosted.

## Usage

It will add a terraform file containing the resources information for the container repository, it is dependant on the `provisioning-terraform-gcp-core` plugin to work.
