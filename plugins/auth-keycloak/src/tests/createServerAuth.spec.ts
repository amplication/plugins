import { mock } from "jest-mock-extended";
import fg from "fast-glob";
import * as fs from "fs";
import {
  DsgContext,
  ModuleMap,
  BuildLogger,
  EnumDataType,
} from "@amplication/code-gen-types";
import { afterCreateAuthModules } from "../events";

describe("Testing afterCreateAuth hook", () => {
  let context: DsgContext;
  let modules: ModuleMap;
  let logger: BuildLogger;

  beforeEach(() => {
    logger = mock<BuildLogger>();
    context = mock<DsgContext>({
      serverDirectories: {
        srcDirectory: "src",
        authDirectory: "src/auth",
      },
      DTOs: {
        User: {
          EnumUserPriority: {
            id: {
              name: "EnumUserPriority",
            },
          },
        },
      },
      resourceInfo: {
        settings: {
          authEntityName: "User",
        },
      },
      entities: [
        {
          name: "User",
          fields: [
            {
              id: "daa757a6-4e15-4afc-a6e3-d4366d64367a",
              permanentId: "daa757a6-4e15-4afc-a6e3-d4366d643671",
              name: "priority",
              displayName: "Priority",
              required: true,
              unique: false,
              searchable: true,
              dataType: EnumDataType.OptionSet,
              properties: {
                options: [
                  { label: "High", value: "high" },
                  { label: "Medium", value: "medium" },
                  { label: "Low", value: "low" },
                ],
              },
            },
            {
              id: "8c5c4130-94b0-4ce4-a4cb-4e42bf7a9b37",
              permanentId: "8c5c4130-94b0-4ce4-a4cb-4e42bf7a9b31",
              name: "email",
              displayName: "Email",
              required: true,
              unique: true,
              searchable: true,
              dataType: EnumDataType.Email,
            },
          ],
        },
      ],
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
      },
      pluginInstallations: [
        {
          npm: "@amplication/plugin-auth-keycloak",
        },
      ],
      utils: {
        importStaticModules: async (source, basePath) => {
          const directory = `${source}/`;
          const staticModules = await fg(`${directory}**/*`, {
            absolute: false,
            dot: true,
            ignore: ["**.js", "**.js.map", "**.d.ts"],
          });

          const modules = await Promise.all(
            staticModules.sort().map(async (module) => {
              return {
                path: module.replace(directory, basePath ? basePath + "/" : ""),
                code: await fs.promises.readFile(module, "utf-8"),
              };
            }),
          );

          const moduleMap: ModuleMap = new ModuleMap(logger);

          for await (const module of modules) {
            await moduleMap.set(module);
          }

          return moduleMap;
        },
      },
    });
    modules = new ModuleMap(logger);
  });

  it("should create all the auth modules", async () => {
    const newModules = await afterCreateAuthModules(context, {}, modules);

    expect(newModules.modules()).toMatchSnapshot();
  });

  it("should remove the default auth modules", async () => {
    const newModules = await afterCreateAuthModules(context, {}, modules);
    const filesToRemove: string[] = [
      "auth.controller.ts",
      "auth.service.ts",
      "auth.service.spec.ts",
      "constants.ts",
      "ITokenService.ts",
      "LoginArgs.ts",
      "password.service.ts",
      "password.service.spec.ts",
      "token.service.ts",
    ];

    filesToRemove.forEach((file) => {
      expect(newModules.get(file)).toBeFalsy();
    });
  });

  it("should replace the config mapping", async () => {
    context.pluginInstallations[0].settings = {
      port: 3000,
      realmID: "CUSTOM_KEYCLOAK_REALM_ID",
      clientID: "CUSTOM_KEYCLOAK_CLIENT_ID",
      realmName: "CUSTOM_KEYCLOAK_REALM_NAME",
      clientName: "CUSTOM_KEYCLOAK_CLIENT_NAME",
    };

    const newModules = await afterCreateAuthModules(context, {}, modules);

    const expectedConfigMapping = {
      "${{ KEYCLOAK_PORT }}": "3000",
      "${{ KEYCLOAK_REALM_ID }}": "CUSTOM_KEYCLOAK_REALM_ID",
      "${{ KEYCLOAK_CLIENT_ID }}": "CUSTOM_KEYCLOAK_CLIENT_ID",
      "${{ KEYCLOAK_REALM_NAME }}": "CUSTOM_KEYCLOAK_REALM_NAME",
      "${{ KEYCLOAK_CLIENT_NAME }}": "CUSTOM_KEYCLOAK_CLIENT_NAME",
      "${{ KEYCLOAK_CLIENT_DESCRIPTION }}":
        "Sample client for Amplication Server",
    };

    // Check that all the config mapping keys were replaced
    Object.entries(expectedConfigMapping).forEach(([, value]) => {
      expect(
        newModules.get("src/keycloak/realm-export.json").code.toString(),
      ).toContain(value);
    });
  });

  it("should throw an error if some field in payloadFieldMapping does not exist in keycloak fields", async () => {
    context.pluginInstallations[0].settings = {
      recipe: {
        payloadFieldMapping: {
          email: "email",
          invalidField: "invalidField",
        },
      },
    };

    await expect(
      afterCreateAuthModules(context, {}, modules),
    ).rejects.toThrowError(
      `The field invalidField is not a valid Keycloak payload field`,
    );
  });

  it("should throw an error if some field in payloadFieldMapping does not exist in the entity", async () => {
    context.pluginInstallations[0].settings = {
      recipe: {
        payloadFieldMapping: {
          email: "email",
          invalidField: "name",
        },
      },
    };

    await expect(
      afterCreateAuthModules(context, {}, modules),
    ).rejects.toThrowError(
      `The entity User does not have a field named invalidField which is mapped to name in the payloadFieldMapping property`,
    );
  });
});
