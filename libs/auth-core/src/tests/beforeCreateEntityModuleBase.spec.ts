import {
  CreateEntityModuleBaseParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import { builders } from "ast-types";
import { prettyPrint } from "recast";
import { beforeCreateEntityModuleBase } from "../events/create-entity-module-base";

describe("Testing beforeCreateEntityModuleBase hook", () => {
  let context: DsgContext;
  let params: CreateEntityModuleBaseParams;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
    params = mock<CreateEntityModuleBaseParams>({
      templateMapping: {
        IMPORTS_ARRAY: builders.arrayExpression([]),
        EXPORT_ARRAY: builders.arrayExpression([]),
      },
      template: builders.file(builders.program([])),
    });
  });
  it("should add the necessary imports and alter the nestjs imports, exports lists", async () => {
    const { templateMapping, template } = await beforeCreateEntityModuleBase(
      context,
      params
    );
    const importsArray = prettyPrint(templateMapping["IMPORTS_ARRAY"]).code;
    const exportsArray = prettyPrint(templateMapping["EXPORT_ARRAY"]).code;
    const code = prettyPrint(template).code;
    expect(importsArray).toStrictEqual("[ACLModule]");
    expect(exportsArray).toStrictEqual("[ACLModule]");
    expect(code).toStrictEqual(
      'import { ACLModule } from "../../auth/acl.module";'
    );
  });
});
