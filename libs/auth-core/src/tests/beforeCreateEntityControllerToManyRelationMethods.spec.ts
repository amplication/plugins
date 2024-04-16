import {
  CreateEntityControllerToManyRelationMethodsParams,
  DsgContext,
  EnumDataType,
  EnumEntityAction,
  EnumEntityPermissionType,
} from "@amplication/code-gen-types";
import { parse } from "@amplication/code-gen-utils";
import { mock } from "jest-mock-extended";
import { prettyPrint } from "recast";
import { name } from "../../package.json";
import { builders } from "ast-types";
import { beforeCreateEntityControllerToManyRelationMethods } from "../events/create-entity-controller-to-many-relation-methods";

describe("Testing beforeCreateEntityControllerToManyRelationMethods hook", () => {
  let context: DsgContext;
  let params: CreateEntityControllerToManyRelationMethodsParams;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
    params = mock<CreateEntityControllerToManyRelationMethodsParams>({
      entity: {
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
      field: {
        properties: {
          relatedEntity: {
            name: "TheEntity",
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
        },
      },
    });
    (params.toManyFile = parse(initialTemplate)),
      (params.toManyMapping = {
        RELATED_ENTITY_WHERE_UNIQUE_INPUT: builders.identifier(
          "TheRelatedEntityWhereUniqueInput"
        ),
        RELATED_ENTITY_WHERE_INPUT: builders.identifier(
          "TheRelatedEntityWhereInput"
        ),
        RELATED_ENTITY_FIND_MANY_ARGS: builders.identifier(
          "TheRelatedEntityFindManyArgs"
        ),
        RELATED_ENTITY: builders.identifier("TheEntity"),
        RELATED_ENTITY_NAME: builders.stringLiteral("TheEntity"),
        WHERE_UNIQUE_INPUT: builders.identifier("TheWhereUniqueInput"),
        SERVICE: builders.identifier("TheService"),
        ENTITY_NAME: builders.stringLiteral("User"),
        FIND_PROPERTY: builders.identifier("theFindProp"),
        PROPERTY: builders.identifier("theProp"),
        FIND_MANY: builders.identifier("findManyFieldName"),
        FIND_MANY_PATH: builders.stringLiteral("/findManyPath"),
        CONNECT: builders.identifier("connectFieldName"),
        CREATE_PATH: builders.stringLiteral("/create"),
        DISCONNECT: builders.identifier("disconnectFieldName"),
        DELETE_PATH: builders.stringLiteral("/delete"),
        UPDATE: builders.identifier("update"),
        UPDATE_PATH: builders.stringLiteral("/update"),
        SELECT: builders.objectExpression([]),
      });
  });
  it("should correctly alter the controller module", () => {
    const { toManyFile } = beforeCreateEntityControllerToManyRelationMethods(
      context,
      params
    );
    const code = prettyPrint(toManyFile).code;
    const expectedCode = prettyCode(correctOutputTemplate);
    expect(code).toStrictEqual(expectedCode);
  });
});

const initialTemplate = `
export class Mixin {
  constructor(private readonly service: SERVICE) {}

  @common.Get(FIND_MANY_PATH)
  @ApiNestedQuery(RELATED_ENTITY_FIND_MANY_ARGS)
  async FIND_MANY(
    @common.Req() request: Request,
    @common.Param() params: WHERE_UNIQUE_INPUT
  ): Promise<RELATED_ENTITY[]> {
    const query = plainToClass(RELATED_ENTITY_FIND_MANY_ARGS, request.query);
    const results = await this.service.FIND_PROPERTY(params.id, {
      ...query,
      select: SELECT,
    });
    if (results === null) {
      throw new errors.NotFoundException(
        \`No resource was found for \${JSON.stringify(params)}\`
      );
    }
    return results;
  }

  @common.Post(CREATE_PATH)
  async CONNECT(
    @common.Param() params: WHERE_UNIQUE_INPUT,
    @common.Body() body: RELATED_ENTITY_WHERE_UNIQUE_INPUT[]
  ): Promise<void> {
    const data = {
      PROPERTY: {
        connect: body,
      },
    };
    await this.service.update({
      where: params,
      data,
      select: { id: true },
    });
  }

  @common.Patch(UPDATE_PATH)
  async UPDATE(
    @common.Param() params: WHERE_UNIQUE_INPUT,
    @common.Body() body: RELATED_ENTITY_WHERE_UNIQUE_INPUT[]
  ): Promise<void> {
    const data = {
      PROPERTY: {
        set: body,
      },
    };
    await this.service.update({
      where: params,
      data,
      select: { id: true },
    });
  }

  @common.Delete(DELETE_PATH)
  async DISCONNECT(
    @common.Param() params: WHERE_UNIQUE_INPUT,
    @common.Body() body: RELATED_ENTITY_WHERE_UNIQUE_INPUT[]
  ): Promise<void> {
    const data = {
      PROPERTY: {
        disconnect: body,
      },
    };
    await this.service.update({
      where: params,
      data,
      select: { id: true },
    });
  }
}

`;

const correctOutputTemplate = `
export class Mixin {
  constructor(private readonly service: TheService) {}

  @common.Get("/findManyPath")
  @ApiNestedQuery(TheRelatedEntityFindManyArgs)
  async findManyFieldName(
    @common.Req() request: Request,
    @common.Param() params: TheWhereUniqueInput
  ): Promise<TheEntity[]> {
    const query = plainToClass(TheRelatedEntityFindManyArgs, request.query);
    const results = await this.service.theFindProp(params.id, {
      ...query,
      select: {},
    });
    if (results === null) {
      throw new errors.NotFoundException(
        \`No resource was found for \${JSON.stringify(params)}\`
      );
    }
    return results;
  }

    @common.Post("/create")
    @nestAccessControl.UseRoles({
        resource: "User",
        action: "update",
        possession: "any"
    })
  async connectFieldName(
    @common.Param() params: TheWhereUniqueInput,
    @common.Body() body: TheRelatedEntityWhereUniqueInput[]
  ): Promise<void> {
    const data = {
      theProp: {
        connect: body,
      },
    };
    await this.service.update({
      where: params,
      data,
      select: { id: true },
    });
  }

    @common.Patch("/update")
    @nestAccessControl.UseRoles({
        resource: "User",
        action: "update",
        possession: "any"
    })
  async update(
    @common.Param() params: TheWhereUniqueInput,
    @common.Body() body: TheRelatedEntityWhereUniqueInput[]
  ): Promise<void> {
    const data = {
      theProp: {
        set: body,
      },
    };
    await this.service.update({
      where: params,
      data,
      select: { id: true },
    });
  }

    @common.Delete("/delete")
    @nestAccessControl.UseRoles({
        resource: "User",
        action: "update",
        possession: "any"
    })
  async disconnectFieldName(
    @common.Param() params: TheWhereUniqueInput,
    @common.Body() body: TheRelatedEntityWhereUniqueInput[]
  ): Promise<void> {
    const data = {
      theProp: {
        disconnect: body,
      },
    };
    await this.service.update({
      where: params,
      data,
      select: { id: true },
    });
  }
}

`;

const prettyCode = (code: string) => prettyPrint(parse(code)).code;
