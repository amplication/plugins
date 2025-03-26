# @amplication/plugin-ci-github-actions

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-ci-github-actions)](https://www.npmjs.com/package/@amplication/plugin-ci-github-actions)

Adds a github actions workflow to for the service used for building and testing the service.

## Purpose

Adds a github actions workflow to for the service used for building and testing the service. With the possibility to also include containerization of the service by building the service as a container image and publishing the image to a registry.

## Configuration - default

The setting `registry` determines the workflow base that is used. When it is left empty, the default workflow is used - this workflow only includes steps for building and testing the service.

```
{
    "registry" : ""
}
```

## Configuration - github

The setting `registry` determines the workflow base that is used. When this value is set to 'github' the workflow includes steps for publishing a container image, next to building and testing the service.

The `configuration` part lets the user further customize the way the image for the service is pushed to the container registry. At the moment the Github Packages registry is the only registry supported. The configuration options are:

- `registry_path` to push the image to - this equats to either the organization's packages - e.g., ghcr.io/amplication/hello-world - or the user profile - e.g., ghcr.io/levivannoort/hello-world.

> Note: if registry_path isn't filled the plugind default to use the contact ${{ github.actor }} which works for most use-cases but in-case of working within an organization/team this should be statically set to the github organization - otherwise it will try to push to the user that triggered the workflow.

- `authentication_method` there are two methods of authentication, the first method is using the github token - i.e., '${{ secrets.GITHUB_TOKEN }}' this does require editing the settings of the repository to also be able to push an image to Github Packages. The default github token is used when anything besides "pat" is provided for this setting, this is the preferred method of authentication. The second option is to use a personal acces token - i.e. "authentication_method" : "pat". This requires the user to generate a Personal Access Token with permissions scoped to `write:packages`. This subsequently needs to be saved as a secret within the repository's secrets, do so under the key name 'GITHUB_PACKAGES_PAT'.

> Note: Using the ${{ secrets.GITHUB_TOKEN }} requires additional permissions within the settings of the repository. Navigate to the 'repository', go to the 'settings', under 'Code and automation' go to 'Actions' > 'General', within the heading 'Workflow permissions' select 'Read and write permissions' and press 'Save'.

Default github token example:

```
{
    "registry" : "github",
    "configuration" : {
        "registry_path" : "levivannoort"
    }
}
```

Personal access token example:

```
{
    "registry" : "github",
    "configuration" : {
        "registry_path" : "levivannoort"
        "authentication_method" : "pat"
    }
}
```

## Usage

Adds a github actions workflow under the `.github/workflows/` directory at the root of the repository. This will subsequently run the workflow on each push to any branch of the repository.
