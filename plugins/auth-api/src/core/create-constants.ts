import { types, Module, DsgContext } from "@amplication/code-gen-types";
import { readFile, print} from "@amplication/code-gen-utils";
import { interpolate, removeTSClassDeclares } from "../util/ast";
import { builders } from "ast-types";
import { getUserIdType } from "../util/get-user-id-type";

const templatePath = require.resolve("../../templates/create-constants.template.ts");

export async function createAuthConstants(
  dsgContext: DsgContext
): Promise<Module> {
  const { serverDirectories } = dsgContext;
  const serverAuthTestDir = `${serverDirectories.srcDirectory}/tests/auth`;
  const template = await readFile(templatePath);
  const idType = getUserIdType(dsgContext);
  const templateMapping = prepareTemplateMapping(idType);
  const filePath = `${serverAuthTestDir}/constants.ts`;
  interpolate(template, templateMapping);
  removeTSClassDeclares(template);

  return { code: print(template).code, path: filePath };
}

function prepareTemplateMapping(idType: types.Id["idType"]) {
  /* eslint-disable @typescript-eslint/naming-convention */
  const idTypeTSOptions: {
    [key in types.Id["idType"]]: any;
  } = {
    AUTO_INCREMENT: builders.numericLiteral(1),
    UUID: builders.stringLiteral("cl7qmjh4h0000tothyjqapgj5"),
    CUID: builders.stringLiteral("cl7qmjh4h0000tothyjqapgj5"),
  };

  return { ID_TYPE: idTypeTSOptions[idType] };
}
