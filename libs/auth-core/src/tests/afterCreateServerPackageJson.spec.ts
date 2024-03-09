import {
  BuildLogger,
  CreateServerPackageJsonParams,
  DsgContext,
  EnumDataType,
  EnumEntityAction,
  EnumEntityPermissionType,
  ModuleMap,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { parse, prettyPrint } from "recast";
import { afterCreateServerPackageJson } from "../events/create-server-package-json";

describe("Testing afterCreateServerPackageJson hook", () => {
  let context: DsgContext;
  let params: CreateServerPackageJsonParams;
  let modules: ModuleMap;

  beforeEach(() => {
    context = mock<DsgContext>({
      serverDirectories: {
        srcDirectory: "src",
      },
      entities: [
        {
          name: "User",
          fields: [
            { name: "username", dataType: EnumDataType.SingleLineText },
            { name: "password", dataType: EnumDataType.SingleLineText },
            { name: "id", dataType: EnumDataType.Id },
          ],
          permissions: [
            {
              action: EnumEntityAction.Create,
              permissionFields: [],
              permissionRoles: [
                {
                  resourceRole: {
                    name: "admin",
                  },
                },
              ],
              type: EnumEntityPermissionType.Granular,
            },
            {
              action: EnumEntityAction.Delete,
              type: EnumEntityPermissionType.Disabled,
            },
            {
              action: EnumEntityAction.Search,
              permissionFields: [],
              type: EnumEntityPermissionType.Public,
            },
            {
              action: EnumEntityAction.Update,
              permissionFields: [
                {
                  field: { name: "username" },
                  permissionRoles: [
                    { resourceRole: { name: "admin" } },
                    { resourceRole: { name: "user" } },
                  ],
                },
                {
                  field: { name: "password" },
                  permissionRoles: [
                    { resourceRole: { name: "admin" } },
                    { resourceRole: { name: "user" } },
                  ],
                },
                {
                  field: { name: "id" },
                  permissionRoles: [{ resourceRole: { name: "admin" } }],
                },
              ],
              permissionRoles: [
                { resourceRole: { name: "admin" } },
                { resourceRole: { name: "user" } },
              ],
              type: EnumEntityPermissionType.Granular,
            },
            {
              action: EnumEntityAction.View,
              permissionFields: [],
              type: EnumEntityPermissionType.AllRoles,
            },
          ],
        },
      ],
      roles: [{ name: "admin" }, { name: "user" }],
    });
    modules = new ModuleMap(mock<BuildLogger>());
  });
  it("should create the grants module when the context has entities and roles specified", async () => {
    const updatedModules = await afterCreateServerPackageJson(
      context,
      params,
      modules
    );
    const grantsModule = prettyCode(
      updatedModules.get("src/grants.json")?.code
    );
    const expectedGrantsModule = prettyCode(correctGrantsOutput);
    expect(grantsModule).toStrictEqual(expectedGrantsModule);
  });
});

const correctGrantsOutput = `
[
    {
        "role": "admin",
        "resource": "User",
        "action": "create:any",
        "attributes": "*"
    },
    {
        "role": "admin",
        "resource": "User",
        "action": "update:any",
        "attributes": "*"
    },
    {
        "role": "user",
        "resource": "User",
        "action": "update:any",
        "attributes": "*,!id"
    },
    {
        "role": "admin",
        "resource": "User",
        "action": "read:own",
        "attributes": "*"
    },
    {
        "role": "user",
        "resource": "User",
        "action": "read:own",
        "attributes": "*"
    },
]
`;

const prettyCode = (code: string) => prettyPrint(parse(code)).code;
