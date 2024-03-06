import { Module, DsgContext } from "@amplication/code-gen-types";
import { readFile, print } from "@amplication/code-gen-utils";
import { interpolate, removeTSClassDeclares } from "../util/ast";
import { getUserIdType } from "../util/get-user-id-type";
import { join } from "path";
import { templatesPath } from "../constants";
import { idTypeTSOptions } from "../util/idTypeMapper";

const templatePath = join(
  templatesPath,
  "create-token/token-payload-interface.template.ts"
);

export async function createTokenPayloadInterface(
  dsgContext: DsgContext
): Promise<Module> {
  const { serverDirectories } = dsgContext;
  const authDir = `${serverDirectories.authDirectory}`;
  const template = await readFile(templatePath);
  const idType = getUserIdType(dsgContext);
  const templateMapping = { ID_TYPE: idTypeTSOptions[idType] };
  const filePath = `${authDir}/ITokenService.ts`;
  interpolate(template, templateMapping);
  removeTSClassDeclares(template);

  return { code: print(template).code, path: filePath };
}
