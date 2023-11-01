import {
    CreateEntityControllerBaseParams,
    CreateEntityControllerParams,
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
  let params: CreateEntityControllerParams;

  beforeEach(() => {
    plugin = new AuthCorePlugin();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
    params = {
        ...mock<CreateEntityControllerBaseParams>(),
        template: parse(initialTemplate),
        templateMapping: {
            CONTROLLER: builders.identifier("TheController"),
            CONTROLLER_BASE: builders.identifier("TheControllerBase"),
            SERVICE: builders.identifier("TheService"),
            RESOURCE: builders.stringLiteral("users")
        }
    };
  });
  it("should correctly alter the controller module", () => {
    const { template } = plugin.beforeCreateEntityControllerModule(context, params);
    const code = prettyPrint(template).code;
    const expectedCode = prettyCode(correctOutputTemplate);
    expect(code).toStrictEqual(expectedCode);
  });
});

const initialTemplate = `
@swagger.ApiTags(RESOURCE)
@common.Controller(RESOURCE)
export class CONTROLLER extends CONTROLLER_BASE {
  constructor(protected readonly service: SERVICE) {
    super(service);
  }
}
`

const correctOutputTemplate = `
import * as nestAccessControl from "nest-access-control";

@swagger.ApiTags("users")
@common.Controller("users")
export class TheController extends TheControllerBase {
  constructor(
    protected readonly service: TheService,
    @nestAccessControl.InjectRolesBuilder()
    protected readonly rolesBuilder: nestAccessControl.RolesBuilder
  ) {
    super(service, rolesBuilder);
  }
}
`

const prettyCode = (code: string) => prettyPrint(parse(code)).code;
