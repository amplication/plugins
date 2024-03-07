import {
  CreateEntityResolverBaseParams,
  DsgContext,
  Entity,
  EnumDataType,
  EnumEntityAction,
  EnumEntityPermissionType,
} from "@amplication/code-gen-types";
import { parse } from "@amplication/code-gen-utils";
import { mock } from "jest-mock-extended";
import { prettyPrint } from "recast";
import { name } from "../../package.json";
import { builders } from "ast-types";
import { beforeCreateResolverBaseModule } from "../events/create-entity-resolver-base";

describe("Testing beforeCreateEntityResolverBaseModule hook", () => {
  let context: DsgContext;
  let params: CreateEntityResolverBaseParams;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
    params = {
      ...mock<CreateEntityResolverBaseParams>(),
      entity: mock<Entity>({
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
      }),
      resolverBaseId: builders.identifier("TheResolverBase"),
      template: parse(initialTemplate),
      templateMapping: {
        RESOLVER: builders.identifier("TheResolver"),
        RESOLVER_BASE: builders.identifier("TheResolverBase"),
        SERVICE: builders.identifier("TheService"),
        ENTITY: builders.identifier("TheEntity"),
        META_QUERY: builders.identifier("meta"),
        COUNT_ARGS: builders.identifier("CountArgs"),
        ENTITIES_QUERY: builders.identifier("findMultiple"),
        FIND_MANY_ARGS: builders.identifier("TheFindManyArgs"),
        ENTITY_QUERY: builders.identifier("findOne"),
        FIND_ONE_ARGS: builders.identifier("TheFindOneArgs"),
        CREATE_MUTATION: builders.identifier("create"),
        UPDATE_MUTATION: builders.identifier("update"),
        DELETE_MUTATION: builders.identifier("delete"),
        UPDATE_DATA_MAPPING: builders.objectExpression([]),
        CREATE_ARGS: builders.identifier("TheCreateArgs"),
        UPDATE_ARGS: builders.identifier("TheUpdateArgs"),
        DELETE_ARGS: builders.identifier("TheDeleteArgs"),
        CREATE_DATA_MAPPING: builders.objectExpression([]),
        ENTITY_NAME: builders.stringLiteral("TheEntity"),
      },
    };
  });
  it("should correctly alter the resolver base module", () => {
    const { template } = beforeCreateResolverBaseModule(context, params);
    const code = prettyPrint(template).code;
    const expectedCode = prettyCode(correctOutputTemplate);
    expect(code).toStrictEqual(expectedCode);
  });
});

const initialTemplate = `
@graphql.Resolver(() => ENTITY)
export class RESOLVER_BASE {
  constructor(protected readonly service: SERVICE) {}

  async META_QUERY(
    @graphql.Args() args: COUNT_ARGS
  ): Promise<MetaQueryPayload> {
    const result = await this.service.count(args);
    return {
      count: result,
    };
  }

  @graphql.Query(() => [ENTITY])
  async ENTITIES_QUERY(
    @graphql.Args() args: FIND_MANY_ARGS
  ): Promise<ENTITY[]> {
    return this.service.findMany(args);
  }

  @graphql.Query(() => ENTITY, { nullable: true })
  async ENTITY_QUERY(
    @graphql.Args() args: FIND_ONE_ARGS
  ): Promise<ENTITY | null> {
    const result = await this.service.findOne(args);
    if (result === null) {
      return null;
    }
    return result;
  }

  @graphql.Mutation(() => ENTITY)
  async CREATE_MUTATION(@graphql.Args() args: CREATE_ARGS): Promise<ENTITY> {
    // @ts-ignore
    return await this.service.create({
      ...args,
      data: CREATE_DATA_MAPPING,
    });
  }

  @graphql.Mutation(() => ENTITY)
  async UPDATE_MUTATION(
    @graphql.Args() args: UPDATE_ARGS
  ): Promise<ENTITY | null> {
    try {
      // @ts-ignore
      return await this.service.update({
        ...args,
        data: UPDATE_DATA_MAPPING,
      });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new apollo.ApolloError(
          \`No resource was found for \${JSON.stringify(args.where)}\`
        );
      }
      throw error;
    }
  }

  @graphql.Mutation(() => ENTITY)
  async DELETE_MUTATION(
    @graphql.Args() args: DELETE_ARGS
  ): Promise<ENTITY | null> {
    try {
      // @ts-ignore
      return await this.service.delete(args);
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new apollo.ApolloError(
          \`No resource was found for \${JSON.stringify(args.where)}\`
        );
      }
      throw error;
    }
  }
}
`;

const correctOutputTemplate = `
import * as nestAccessControl from "nest-access-control";
import * as gqlACGuard from "../../auth/gqlAC.guard";
import { GqlDefaultAuthGuard } from "../../auth/gqlDefaultAuth.guard";
import * as common from "@nestjs/common";

@common.UseGuards(GqlDefaultAuthGuard, gqlACGuard.GqlACGuard)
@graphql.Resolver(() => TheEntity)
export class TheResolverBase {
  constructor(protected readonly service: TheService,
    protected readonly rolesBuilder: nestAccessControl.RolesBuilder) {}

  @graphql.Query(() => MetaQueryPayload)
  @nestAccessControl.UseRoles({
    resource: "TheEntity",
    action: "read",
    possession: "any",
  })
  async meta(
    @graphql.Args() args: CountArgs
  ): Promise<MetaQueryPayload> {
    const result = await this.service.count(args);
    return {
      count: result,
    };
  }

  @graphql.Query(() => [TheEntity])
  async findMultiple(
    @graphql.Args() args: TheFindManyArgs
  ): Promise<TheEntity[]> {
    return this.service.findMany(args);
  }

  @common.UseInterceptors(AclFilterResponseInterceptor)
  @graphql.Query(() => TheEntity, { nullable: true })
  @nestAccessControl.UseRoles({
    resource: "TheEntity",
    action: "read",
    possession: "own",
  })
  async findOne(
    @graphql.Args() args: TheFindOneArgs
  ): Promise<TheEntity | null> {
    const result = await this.service.findOne(args);
    if (result === null) {
      return null;
    }
    return result;
  }

  @common.UseInterceptors(AclValidateRequestInterceptor)
  @graphql.Mutation(() => TheEntity)
  @nestAccessControl.UseRoles({
    resource: "TheEntity",
    action: "create",
    possession: "any",
  })
  async create(@graphql.Args() args: TheCreateArgs): Promise<TheEntity> {
    // @ts-ignore
    return await this.service.create({
      ...args,
      data: {},
    });
  }

  @common.UseInterceptors(AclValidateRequestInterceptor)
  @graphql.Mutation(() => TheEntity)
  @nestAccessControl.UseRoles({
    resource: "TheEntity",
    action: "update",
    possession: "any",
  })
  async update(
    @graphql.Args() args: TheUpdateArgs
  ): Promise<TheEntity | null> {
    try {
      // @ts-ignore
      return await this.service.update({
        ...args,
        data: {},
      });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new apollo.ApolloError(
          \`No resource was found for \${JSON.stringify(args.where)}\`
        );
      }
      throw error;
    }
  }

  @graphql.Mutation(() => TheEntity)
  @nestAccessControl.UseRoles({
    resource: "TheEntity",
    action: "delete",
    possession: "any",
  })
  async delete(
    @graphql.Args() args: TheDeleteArgs
  ): Promise<TheEntity | null> {
    try {
      // @ts-ignore
      return await this.service.delete(args);
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new apollo.ApolloError(
          \`No resource was found for \${JSON.stringify(args.where)}\`
        );
      }
      throw error;
    }
  }
}
`;

const prettyCode = (code: string) => prettyPrint(parse(code)).code;
