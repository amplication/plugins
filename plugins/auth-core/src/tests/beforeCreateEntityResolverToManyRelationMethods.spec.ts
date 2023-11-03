import {
  CreateEntityResolverToManyRelationMethodsParams,
  DsgContext,
  EnumDataType,
  EnumEntityAction,
  EnumEntityPermissionType,
} from "@amplication/code-gen-types";
import { parse } from "@amplication/code-gen-utils";
import { mock } from "jest-mock-extended";
import { prettyPrint } from "recast";
import { name } from "../../package.json";
import AuthCorePlugin from "../index";
import { builders } from "ast-types";

describe("Testing beforeCreateEntityResolverToManyRelationMethods hook", () => {
  let plugin: AuthCorePlugin;
  let context: DsgContext;
  let params: CreateEntityResolverToManyRelationMethodsParams;

  beforeEach(() => {
    plugin = new AuthCorePlugin();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
    params = mock<CreateEntityResolverToManyRelationMethodsParams>({
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
                action: EnumEntityAction.Search,
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
        RELATED_ENTITY: builders.identifier("TheEntity"),
        SERVICE: builders.identifier("TheService"),
        ENTITY: builders.identifier("User"),
        FIND_PROPERTY: builders.identifier("theFindProp"),
        FIND_MANY: builders.identifier("findMany"),
        ARGS: builders.identifier("TheFindManyArgs"),
        FIND_MANY_FIELD_NAME: builders.identifier("theFindManyField"),
      });
  });
  it("should correctly alter the resolver to many relations template", () => {
    const { toManyFile } =
      plugin.beforeCreateEntityResolverToManyRelationMethods(context, params);
    const code = prettyPrint(toManyFile).code;
    const expectedCode = prettyCode(correctOutputTemplate);
    expect(code).toStrictEqual(expectedCode);
  });
});

const initialTemplate = `
export class Mixin {
  constructor(private readonly service: SERVICE) {}

  @graphql.ResolveField(() => [RELATED_ENTITY], { name: FIND_MANY_FIELD_NAME })
  async FIND_MANY(
    @graphql.Parent() parent: ENTITY,
    @graphql.Args() args: ARGS
  ): Promise<RELATED_ENTITY[]> {
    const results = await this.service.FIND_PROPERTY(parent.id, args);

    if (!results) {
      return [];
    }

    return results;
  }
}
`;

const correctOutputTemplate = `
export class Mixin {
  constructor(private readonly service: TheService) {}

  @common.UseInterceptors(AclFilterResponseInterceptor)
  @graphql.ResolveField(() => [TheEntity], { name: theFindManyField })
  @nestAccessControl.UseRoles({
        resource: "TheEntity",
        action: "read",
        possession: "any"
    })
  async findMany(
    @graphql.Parent() parent: User,
    @graphql.Args() args: TheFindManyArgs
  ): Promise<TheEntity[]> {
    const results = await this.service.theFindProp(parent.id, args);

    if (!results) {
      return [];
    }

    return results;
  }
}
`;

const prettyCode = (code: string) => prettyPrint(parse(code)).code;
