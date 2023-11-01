import {
    CreateEntityResolverParams,
    DsgContext
} from "@amplication/code-gen-types";
import { parse } from "@amplication/code-gen-utils";
import { mock } from "jest-mock-extended";
import { prettyPrint } from "recast";
import { name } from "../../package.json";
import AuthCorePlugin from "../index";
import { builders } from "ast-types";

describe("Testing beforeCreateEntityControllerModule hook", () => {
  let plugin: AuthCorePlugin;
  let context: DsgContext;
  let params: CreateEntityResolverParams;

  beforeEach(() => {
    plugin = new AuthCorePlugin();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
    params = {
        ...mock<CreateEntityResolverParams>(),
        template: parse(initialTemplate),
        templateMapping: {
            RESOLVER: builders.identifier("TheResolver"),
            RESOLVER_BASE: builders.identifier("TheResolverBase"),
            SERVICE: builders.identifier("TheService"),
            ENTITY: builders.identifier("TheEntity")
        }
    };
  });
  it("should correctly alter the resolver module", () => {
    const { template } = plugin.beforeCreateResolverModule(context, params);
    const code = prettyPrint(template).code;
    const expectedCode = prettyCode(correctOutputTemplate);
    expect(code).toStrictEqual(expectedCode);
  });
});

const initialTemplate = `
@graphql.Resolver(() => ENTITY)
export class RESOLVER extends RESOLVER_BASE {
  constructor(protected readonly service: SERVICE) {
    super(service);
  }
}
`

const correctOutputTemplate = `
import * as nestAccessControl from "nest-access-control";
import * as gqlACGuard from "../auth/gqlAC.guard";
import { GqlDefaultAuthGuard } from "../auth/gqlDefaultAuth.guard";
import * as common from "@nestjs/common";

@common.UseGuards(GqlDefaultAuthGuard, gqlACGuard.GqlACGuard)
@graphql.Resolver(() => TheEntity)
export class TheResolver extends TheResolverBase {
  constructor(protected readonly service: TheService,
    @nestAccessControl.InjectRolesBuilder()
    protected readonly rolesBuilder: nestAccessControl.RolesBuilder,) {
    super(service, rolesBuilder);
  }
}
`

const prettyCode = (code: string) => prettyPrint(parse(code)).code;
