<h3 align="center">
    <a href="https://amplication.com/#gh-light-mode-only">
    <img src="https://github.com/amplication/amplication/blob/master/.github/assets/amplication-logo-dark-mode.svg">
    </a>
    <a href="https://amplication.com/#gh-dark-mode-only">
    <img src="https://github.com/amplication/amplication/blob/master/.github/assets/amplication-logo-dark-mode.svg">
    </a>
</h3>

---

Amplication uses plugins to extend the functionality of the generated application. To add more functionality, you can develop your plugins, or can use plugins developed by the community, as they become available.

## Using Plugins

Available plugins are listed in the Amplication console. Use the UI to install and activate the required plugins. For more information, read [Using Plugins](https://docs.amplication.com/docs/getting-started/getting-started/plugins/)

## Developing Plugins

You will soon be able to develop your plugins to implement standards, best practices, and custom integrations, and to do almost anything you want with the generated code.

## Publishing Plugins

An GitHub Actions worflow has been added to publish a plugin the npm registry. It lets you specify a pre-determined list of plugin names (additional plugins will have to be added to this list).

- `latest` tag: when using the default branch for this repository when triggering the workflow, the package will be tagged with latest.

- `beta` tag: when using a non-default branch, e.g., a branch for development, when triggering the workflow the package will be tagged with beta.

## Integration on Amplication

After publishing the plugin to NPM from the GitHub the plugin will not be visible in the Amplication plugin settings/list immediately. This works in conjunction with the [amplication/plugin-catalog](https://github.com/amplication/plugin-catalog), where the `plugin-catalog` is indexed. Adding the new plugin there will add it to the list of plugins in amplication. Any subsequent version that is released to NPM, will be updated automatically - this can take about 5-10 minutes to propagate.

## Documentation

- [How to create a plugin](https://docs.amplication.com/plugins/how-to-create-plugin/)
- [How to test a plugin](https://docs.amplication.com/plugins/how-to-test-plugin/)
- [How to publish a plugin](https://docs.amplication.com/plugins/publish-plugin/)
