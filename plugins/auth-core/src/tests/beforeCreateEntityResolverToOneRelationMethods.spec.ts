import {
    CreateEntityResolverToOneRelationMethodsParams,
    DsgContext,
    EnumDataType,
    EnumEntityAction,
    EnumEntityPermissionType
} from "@amplication/code-gen-types";
import { parse } from "@amplication/code-gen-utils";
import { mock } from "jest-mock-extended";
import { prettyPrint } from "recast";
import { name } from "../../package.json";
import AuthCorePlugin from "../index";
import { builders } from "ast-types";

describe("Testing beforeCreateEntityResolverToOneRelationMethods hook", () => {
  let plugin: AuthCorePlugin;
  let context: DsgContext;
  let params: CreateEntityResolverToOneRelationMethodsParams;

  beforeEach(() => {
    plugin = new AuthCorePlugin();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
    params = mock<CreateEntityResolverToOneRelationMethodsParams>({
        field: {
            properties: {
                relatedEntity: {
                    name: "TheEntity",
                    fields: [
                        { name: "username", dataType: EnumDataType.SingleLineText },
                        { name: "password", dataType: EnumDataType.SingleLineText },
                        { name: "id", dataType: EnumDataType.Id }
                    ],
                    permissions: [
                        {
                            action: EnumEntityAction.View,
                            permissionFields: [],
                            type: EnumEntityPermissionType.AllRoles
                        }
                    ]
                }
            }
        }
    });
    params.toOneFile = parse(initialTemplate),
    params.toOneMapping = {
        RELATED_ENTITY: builders.identifier("TheEntity"),
        SERVICE: builders.identifier("TheService"),
        ENTITY: builders.identifier("User"),
        GET_PROPERTY: builders.identifier("theGetProp"),
        FIND_ONE: builders.identifier("findOne"),
        ARGS: builders.identifier("TheFindManyArgs"),
        FIND_ONE_FIELD_NAME: builders.identifier("theFindOneField")
    }
  });
  it("should correctly alter the resolver to many relations template", () => {
    const { toOneFile } = plugin.beforeCreateEntityResolverToOneRelationMethods(context, params);
    const code = prettyPrint(toOneFile).code;
    const expectedCode = prettyCode(correctOutputTemplate);
    expect(code).toStrictEqual(expectedCode);
  });
});

const initialTemplate = `
export class Mixin {
  constructor(private readonly service: SERVICE) {}

  @graphql.ResolveField(() => RELATED_ENTITY, {
    nullable: true,
    name: FIND_ONE_FIELD_NAME,
  })
  async FIND_ONE(
    @graphql.Parent() parent: ENTITY
  ): Promise<RELATED_ENTITY | null> {
    const result = await this.service.GET_PROPERTY(parent.id);

    if (!result) {
      return null;
    }
    return result;
  }
}
`

const correctOutputTemplate = `
export class Mixin {
  constructor(private readonly service: TheService) {}

  @common.UseInterceptors(AclFilterResponseInterceptor)
  @graphql.ResolveField(() => TheEntity, {
    nullable: true,
    name: theFindOneField,
  })
  @nestAccessControl.UseRoles({
        resource: "TheEntity",
        action: "read",
        possession: "any"
    })
  async findOne(
    @graphql.Parent() parent: User
  ): Promise<TheEntity | null> {
    const result = await this.service.theGetProp(parent.id);

    if (!result) {
      return null;
    }
    return result;
  }
}
`

const prettyCode = (code: string) => prettyPrint(parse(code)).code;
