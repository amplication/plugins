# Amplication plugins

Amplication uses plugins to extend the functionality of the generated application. To add more functionality, you can develop your plugins, or can use plugins developed by the community, as they become available.

## Using Plugins

Available plugins are listed in the Amplication console. Use the UI to install and activate the required plugins.

For more information, read [Using Plugins](https://docs.amplication.com/docs/getting-started/getting-started/plugins/)

## Developing Plugins

You will soon be able to develop your plugins to implement standards, best practices, and custom integrations, and to do almost anything you want with the generated code.

## Publishing Plugins

An github actions worflow has been added to publish a plugin the npm registry. It lets you specify a pre-determined list of plugin names (additional plugins will have to be added to this list).

- `latest` tag: when using the default branch for this repository when triggering the workflow, the package will be tagged with latest.

- `beta` tag: when using a non-default branch, e.g., a branch for development for running the workflow the package is release with the beta tag.
