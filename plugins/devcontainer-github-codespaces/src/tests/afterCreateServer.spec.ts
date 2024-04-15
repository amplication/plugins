import { BuildLogger, DsgContext, ModuleMap } from "@amplication/code-gen-types";
import GithubCodespaces from "../index"
import { mock } from "jest-mock-extended"
import { name } from "../../package.json";
import YAML from "yaml"

describe("Testing afterCreateServer hook", () => {
  let plugin: GithubCodespaces;
  let modules: ModuleMap

  beforeEach(() => {
    plugin = new GithubCodespaces();
    modules = new ModuleMap(mock<BuildLogger>())
  });

  it("should use default name if service name is null", async () => {
    const contextNoResourceInfo = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
      resourceInfo: undefined
    })

    const updatedModules = await plugin.afterCreateServer(contextNoResourceInfo, {}, modules)
    const devcontainerConfig = updatedModules.get(".devcontainer/devcontainer.json")

    expect(JSON.parse(devcontainerConfig.code)["name"]).toBe("Amplication App")
  })

  it("should generate path based on the service name if specified", async () => {
    const serviceName = "My App"
    const context = mock<DsgContext>({
      pluginInstallations: [
        {
          npm: name,
          settings: {
            generateBasedOnServiceName: true
          }
        },
      ],
      resourceInfo: {
        name: serviceName
      }
    })

    const updatedModules = await plugin.afterCreateServer(context, {}, modules)
    const devcontainerConfig = updatedModules.get(`.devcontainer/${serviceName.replace(" ", "_")}/devcontainer.json`)

    expect(devcontainerConfig).toBeTruthy()
  })

  it("should generate path based on the custom location if specified", async () => {
    const customLocation = ".devcontainer/aaaa/bbbbb"
    const context = mock<DsgContext>({
      pluginInstallations: [
        {
          npm: name,
          settings: {
            customLocation: customLocation
          }
        },
      ],
    })

    const updatedModules = await plugin.afterCreateServer(context, {}, modules)
    const devcontainerConfig = updatedModules.get(`${customLocation}/devcontainer.json`)

    expect(devcontainerConfig).toBeTruthy()
  })

  it("should point to correct directory server directory if custom directory is defined", async () => {
    const context = mock<DsgContext>({
      serverDirectories: {
        baseDirectory: "aaaa/bbbbbb/server"
      },
      pluginInstallations: [
        {
          npm: name,
        },
      ],
    })

    const updatedModules = await plugin.afterCreateServer(context, {}, modules)
    const { include } = YAML.parse(updatedModules.get(`.devcontainer/docker-compose.devcontainer.yml`).code)

    // Expected path is the path of the server base directory (where docker compose lives) relative to the docker compose path
    const expectedPath = "../aaaa/bbbbbb/server/docker-compose.yml"

    expect(include[0]).toBe(expectedPath)
  })

  it("should not generate admin ui docker compose if includeAdminUI is false", async () => {
    const context = mock<DsgContext>({
      serverDirectories: {
        baseDirectory: "aaaa/bbbbbb/server"
      },
      clientDirectories: {
        baseDirectory: "aaaa/bbbbbb/admin-ui"
      },
      pluginInstallations: [
        {
          npm: name,
          settings: {
            includeAdminUI: false
          }
        },
      ],
    })

    const updatedModules = await plugin.afterCreateAdminUI(context, {}, modules)

    expect(updatedModules.get("aaaa/bbbbbb/admin-ui/docker-compose.devcontainer.yml")).toBeFalsy()
  })

  it("should update devcontainer if admin ui is included", async () => {
    const context = mock<DsgContext>({
      serverDirectories: {
        baseDirectory: "aaaa/bbbbbb/server"
      },
      clientDirectories: {
        baseDirectory: "aaaa/bbbbbb/admin-ui"
      },
      pluginInstallations: [
        {
          npm: name,
          settings: {
            includeAdminUI: true
          }
        },
      ],
    })

    const updatedModules = await plugin.afterCreateAdminUI(context, {}, modules)
    expect(updatedModules.get("aaaa/bbbbbb/admin-ui/docker-compose.devcontainer.yml")).toBeTruthy()

    const { include } = YAML.parse(updatedModules.get(`.devcontainer/docker-compose.devcontainer.yml`).code)
    expect(include[1]).toBe("../aaaa/bbbbbb/admin-ui/docker-compose.devcontainer.yml")
  })
})