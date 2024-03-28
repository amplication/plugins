import {
    BuildLogger,
    CreateAdminUIParams,
    CreateServerParams,
    DsgContext,
    ModuleMap,
} from "@amplication/code-gen-types";
import GithubCodespacesPlugin from "../index";
import { mock } from "jest-mock-extended";
import path from "path";
import { name } from "../../package.json";
import { deepEqual, equal } from "assert";

const resourceName = "My App"
const nginxPath = path.join("admin-ui", "configuration", "nginx.conf")

describe("Testing afterCreateServer hook", () => {
    let plugin: GithubCodespacesPlugin;
    let context: DsgContext;
    let afterCreateServerParams: CreateServerParams;
    let afterCreateAdminUIParams: CreateAdminUIParams;
    let moduleMap: ModuleMap;

    beforeEach(() => {
        plugin = new GithubCodespacesPlugin();
        context = mock<DsgContext>({
            pluginInstallations: [{ npm: name }],
            resourceInfo: {
                name: resourceName
            },
            serverDirectories: {
                baseDirectory: "server",
            },
            clientDirectories: {
                baseDirectory: "admin-ui"
            }
        });
        afterCreateServerParams = mock<CreateServerParams>();
        afterCreateAdminUIParams = mock<CreateAdminUIParams>();
        moduleMap = new ModuleMap(mock<BuildLogger>())

        moduleMap.set({
            path: nginxPath,
            code: originalNginx
        })
    });

    it("should correctly generate devcontainer config for server and admin ui", async () => {
        const modules = await plugin.afterCreateServer(context, afterCreateServerParams, moduleMap)

        const devcontainer = modules.get(path.join(".devcontainer", resourceName, "devcontainer.json"))
        deepEqual(JSON.parse(devcontainer.code), expectedDevContainer)
    })

    it("should correctly patch nginx", async () => {
        const modules = await plugin.afterCreateAdminUI(context, afterCreateAdminUIParams, moduleMap)

        equal(modules.get(nginxPath).code, patchedNginx)
    })

    it("should correcly generate init.sh", async () => {
        const modules = await plugin.afterCreateServer(context, afterCreateServerParams, moduleMap)

        equal(modules.get(path.join(".devcontainer", resourceName, "init.sh")).code, expectedInitSH)
    })

    it("should correctly generate admin-ui docker comspose", async () => {
        const modules = await plugin.afterCreateAdminUI(context, afterCreateAdminUIParams, moduleMap)
        const code = modules.get(path.join("admin-ui", "docker-compose.yml")).code

        equal(code, expectedDockerComposeForAdminUI)
    })
})

const expectedDevContainer = {
    "name": resourceName,
    "service": "server",
    "dockerComposeFile": [
        "../server/docker-compose.yml",
        "../admin-ui/docker-compose.yml",
    ],
    "features": {
        "ghcr.io/devcontainers/features/docker-in-docker:2": {}
    },
    "initializeCommand": "bash .devcontainer/init.sh $(pwd)",
    "forwardPorts": [3000, 3001]
}

const originalNginx = `server_tokens off;

server {
    listen       8080;
    server_name  localhost;
    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        try_files $uri /index.html;
    }
}`

const patchedNginx = `server_tokens off;

server {
    listen       80;
    server_name  localhost;
    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        try_files $uri /index.html;
    }
}`

const expectedInitSH = `#!/usr/bin/env bash

source server/.env`

const expectedDockerComposeForAdminUI = `version: "3.8"

services:
  admin-ui:
    container_name: admin-ui-container
    image: admin-ui-image
    build:
      context: .
    ports:
      - 3001:80`