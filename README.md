# Amplication plugins

Amplication uses plugins to extend the functionality of the generated application. To add more functionality, you can develop your own plugins, or can use plugins developed by the community, as they become available.

## Using Plugins
Available plugins are listed in the Amplication console. Use the UI to install and activate the required plugins. 

For more information, read [Using Plugins](https://docs.amplication.com/docs/getting-started/getting-started/plugins/)

# Developing Plugins
## Plugin Template
We have created a basic plugin template available at [plugins/plugin-template](plugins/plugin-template/). Copy-paste it into a local directory on your machine and start developing. Please read the template's README.md file for more instructions.

## Plugin file types

As of now we support two types of files.

### Static files

- Job: those files are copied as is to the generated code.
- Location: All files inside the `src/static` folder.

### Template files

- Job: files that serve as templates, We mutate them to provide the user with the source code.
- Location: every file that ends with `*.template.ts`.

### IMPORTANT!

For Amplication to be able to load your plugin on-demand, we require that your plugin is bundled together with its dependencies and static files. For this reason we strongly advise using Webpack, as implemented in our plugin template.

# Amplication Plugin Tester
Amplication provides developers with a plugin tester for a swift development experience. The source code of the plugin tester can be found at [@amplication/plugin-tester](https://github.com/amplication/plugin-tester).

The Amplication Plugin Tester will spin up a Docker container on your machine and use the exact same image used on our cloud offering. This way you can be sure that your plugin works.

## Requirements
- Docker Desktop running locally

## Using the Amplication Plugin Tester
Let's take the MongoDB plugin in this repository as an example.

In a terminal session, cd into the MongoDB plugin folder and run the following:
```
cd plugins/db-mongo
npm install
npm run dev
```

At this point you should see Webpack in development mode. This has built the plugin and will watch for changes.

Now, open a new terminal session *at the root of this directory*. You can test the MongoDB plugin by running:
```
npx @amplication/plugin-tester
```

If everything went well, you should get some useful feedback. You should also be able to see a `generated` folder in your current working directory. This is where you can find the generated code.

This flow allows you to quickly make changes to your plugin and see the generated code immediately.

### `.amplicationconfig.json`
Familiarize yourself with the [.amplicationconfig.json](.amplicationconfig.json) file at the root of the repository. You can modify its values to change the behavior of the plugin tester.

## Getting Started
### 1. Create a local plugin folder
