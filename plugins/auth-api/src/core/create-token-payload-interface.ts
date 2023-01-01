import { types, Module, DsgContext } from "@amplication/code-gen-types";
import { readFile } from "@amplication/code-gen-utils";
import { interpolate, removeTSClassDeclares } from "../util/ast";
import { builders, namedTypes } from "ast-types";
import { print } from "@amplication/code-gen-utils";
import { getUserIdType } from "../util/get-user-id-type";

const templatePath = require.resolve("../../templates/create-token/token-payload-interface.template.ts");

export async function createTokenPayloadInterface(dsgContext: DsgContext): Promise<Module> {
  const { serverDirectories } = dsgContext;
  const authDir = `${serverDirectories.authDirectory}`;
  const template = await readFile(templatePath);
  const idType = getUserIdType(dsgContext);
  const templateMapping = prepareTemplateMapping(idType);
  const filePath = `${authDir}/ITokenService.ts`;
  interpolate(template, templateMapping);
  removeTSClassDeclares(template);

  return { code: print(template).code, path: filePath };
}

function prepareTemplateMapping(idType: types.Id["idType"]) {
  /* eslint-disable @typescript-eslint/naming-convention */
  const idTypeTSOptions: {
    [key in types.Id["idType"]]: namedTypes.Identifier;
  } = {
    AUTO_INCREMENT: builders.identifier("number"),
    UUID: builders.identifier("string"),
    CUID: builders.identifier("string"),
  };

  return { ID_TYPE: idTypeTSOptions[idType] };
}
