import {
  CreateEntityControllerBaseParams,
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
import { beforeCreateControllerBaseModule } from "../events/create-entity-controller-base";

describe("Testing beforeCreateControllerBaseModule hook", () => {
  let context: DsgContext;
  let params: CreateEntityControllerBaseParams;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
    params = mock<CreateEntityControllerBaseParams>({
      controllerBaseId: builders.identifier("TheControllerBase"),
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
    });
    params.template = parse(initialTemplate);
    params.templateMapping = {
      CONTROLLER_BASE: builders.identifier("TheControllerBase"),
      CREATE_ENTITY_FUNCTION: builders.identifier("create"),
      FIND_MANY_ENTITY_FUNCTION: builders.identifier("findMany"),
      FIND_ONE_ENTITY_FUNCTION: builders.identifier("findOne"),
      UPDATE_ENTITY_FUNCTION: builders.identifier("update"),
      DELETE_ENTITY_FUNCTION: builders.identifier("delete"),
      ENTITY: builders.identifier("TheEntity"),
      SELECT: builders.objectExpression([]),
      CREATE_DATA_MAPPING: builders.objectExpression([]),
      UPDATE_DATA_MAPPING: builders.objectExpression([]),
      WHERE_UNIQUE_INPUT: builders.identifier("TheWhereInputUnique"),
      CREATE_INPUT: builders.identifier("TheCreateInput"),
      FIND_MANY_ARGS: builders.identifier("TheFindManyArgs"),
      DELETE_PATH: builders.stringLiteral("/delete"),
      UPDATE_PATH: builders.stringLiteral("/update"),
      FIND_ONE_PATH: builders.stringLiteral("/findOne"),
      UPDATE_INPUT: builders.identifier("TheUpdateInput"),
      SERVICE: builders.identifier("TheService"),
      SWAGGER_API_AUTH_FUNCTION: builders.identifier("ApiBasicAuth"),
    };
  });
  it("should correctly alter the controller base module", () => {
    const { template } = beforeCreateControllerBaseModule(context, params);
    const code = prettyPrint(template).code;
    const expectedCode = prettyCode(correctOutputTemplate);
    expect(code).toStrictEqual(expectedCode);
  });
});

const initialTemplate = `
export class CONTROLLER_BASE {
  constructor(protected readonly service: SERVICE) {}

  @common.Post()
  @swagger.ApiCreatedResponse({ type: ENTITY })
  async CREATE_ENTITY_FUNCTION(
    @common.Body() data: CREATE_INPUT
  ): Promise<ENTITY> {
    return await this.service.create({
      data: CREATE_DATA_MAPPING,
      select: SELECT,
    });
  }

  @common.Get()
  @swagger.ApiOkResponse({ type: [ENTITY] })
  @ApiNestedQuery(FIND_MANY_ARGS)
  async FIND_MANY_ENTITY_FUNCTION(
    @common.Req() request: Request
  ): Promise<ENTITY[]> {
    const args = plainToClass(FIND_MANY_ARGS, request.query);
    return this.service.findMany({
      ...args,
      select: SELECT,
    });
  }

  @common.Get(FIND_ONE_PATH)
  @swagger.ApiOkResponse({ type: ENTITY })
  @swagger.ApiNotFoundResponse({ type: errors.NotFoundException })
  async FIND_ONE_ENTITY_FUNCTION(
    @common.Param() params: WHERE_UNIQUE_INPUT
  ): Promise<ENTITY | null> {
    const result = await this.service.findOne({
      where: params,
      select: SELECT,
    });
    if (result === null) {
      throw new errors.NotFoundException(
        \`No resource was found for \${JSON.stringify(params)}\`
      );
    }
    return result;
  }

  @common.Patch(UPDATE_PATH)
  @swagger.ApiOkResponse({ type: ENTITY })
  @swagger.ApiNotFoundResponse({ type: errors.NotFoundException })
  async UPDATE_ENTITY_FUNCTION(
    @common.Param() params: WHERE_UNIQUE_INPUT,
    @common.Body() data: UPDATE_INPUT
  ): Promise<ENTITY | null> {
    try {
      return await this.service.update({
        where: params,
        data: UPDATE_DATA_MAPPING,
        select: SELECT,
      });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new errors.NotFoundException(
          \`No resource was found for \${JSON.stringify(params)}\`
        );
      }
      throw error;
    }
  }

  @common.Delete(DELETE_PATH)
  @swagger.ApiOkResponse({ type: ENTITY })
  @swagger.ApiNotFoundResponse({ type: errors.NotFoundException })
  async DELETE_ENTITY_FUNCTION(
    @common.Param() params: WHERE_UNIQUE_INPUT
  ): Promise<ENTITY | null> {
    try {
      return await this.service.delete({
        where: params,
        select: SELECT,
      });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new errors.NotFoundException(
          \`No resource was found for \${JSON.stringify(params)}\`
        );
      }
      throw error;
    }
  }
}
`;

const correctOutputTemplate = `
import * as nestAccessControl from "nest-access-control";
import * as defaultAuthGuard from "../../auth/defaultAuth.guard";

@swagger.SWAGGER_API_AUTH_FUNCTION()
@common.UseGuards(defaultAuthGuard.DefaultAuthGuard, nestAccessControl.ACGuard)
export class TheControllerBase {
  constructor(protected readonly service: TheService,
    protected readonly rolesBuilder: nestAccessControl.RolesBuilder) {}

  @common.UseInterceptors(AclValidateRequestInterceptor)
  @common.Post()
  @swagger.ApiCreatedResponse({ type: TheEntity })
  @nestAccessControl.UseRoles({
    resource: "User",
    action: "create",
    possession: "any",
  })
  @swagger.ApiForbiddenResponse({
    type: errors.ForbiddenException,
  })
  async create(
    @common.Body() data: TheCreateInput
  ): Promise<TheEntity> {
    return await this.service.create({
      data: {},
      select: {},
    });
  }

  @common.Get()
  @swagger.ApiOkResponse({ type: [TheEntity] })
  @ApiNestedQuery(TheFindManyArgs)
  @swagger.ApiForbiddenResponse({
    type: errors.ForbiddenException,
  })
  async findMany(
    @common.Req() request: Request
  ): Promise<TheEntity[]> {
    const args = plainToClass(TheFindManyArgs, request.query);
    return this.service.findMany({
      ...args,
      select: {},
    });
  }

  @common.UseInterceptors(AclFilterResponseInterceptor)
  @common.Get("/findOne")
  @swagger.ApiOkResponse({ type: TheEntity })
  @swagger.ApiNotFoundResponse({ type: errors.NotFoundException })
  @nestAccessControl.UseRoles({
    resource: "User",
    action: "read",
    possession: "own",
  })
  @swagger.ApiForbiddenResponse({
    type: errors.ForbiddenException,
  })
  async findOne(
    @common.Param() params: TheWhereInputUnique
  ): Promise<TheEntity | null> {
    const result = await this.service.findOne({
      where: params,
      select: {},
    });
    if (result === null) {
      throw new errors.NotFoundException(
        \`No resource was found for \${JSON.stringify(params)}\`
      );
    }
    return result;
  }

  @common.UseInterceptors(AclValidateRequestInterceptor)
  @common.Patch("/update")
  @swagger.ApiOkResponse({ type: TheEntity })
  @swagger.ApiNotFoundResponse({ type: errors.NotFoundException })
  @nestAccessControl.UseRoles({
    resource: "User",
    action: "update",
    possession: "any",
  })
  @swagger.ApiForbiddenResponse({
    type: errors.ForbiddenException,
  })
  async update(
    @common.Param() params: TheWhereInputUnique,
    @common.Body() data: TheUpdateInput
  ): Promise<TheEntity | null> {
    try {
      return await this.service.update({
        where: params,
        data: {},
        select: {},
      });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new errors.NotFoundException(
          \`No resource was found for \${JSON.stringify(params)}\`
        );
      }
      throw error;
    }
  }

  @common.Delete("/delete")
  @swagger.ApiOkResponse({ type: TheEntity })
  @swagger.ApiNotFoundResponse({ type: errors.NotFoundException })
  @nestAccessControl.UseRoles({
    resource: "User",
    action: "delete",
    possession: "any",
  })
  @swagger.ApiForbiddenResponse({
    type: errors.ForbiddenException,
  })
  async delete(
    @common.Param() params: TheWhereInputUnique
  ): Promise<TheEntity | null> {
    try {
      return await this.service.delete({
        where: params,
        select: {},
      });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new errors.NotFoundException(
          \`No resource was found for \${JSON.stringify(params)}\`
        );
      }
      throw error;
    }
  }

}
`;

const prettyCode = (code: string) => prettyPrint(parse(code)).code;
