import { print } from "@amplication/code-gen-utils";
import { DsgContext, Module } from "@amplication/code-gen-types";
import { removeTSIgnoreComments } from "../util/ast";
import { readFile } from "@amplication/code-gen-utils";
import { EnumAuthProviderType } from "../types";

export async function createTokenService(
  dsgContext: DsgContext
): Promise<Module> {
  const { serverDirectories, resourceInfo } = dsgContext;
  const authProvider: EnumAuthProviderType =
    resourceInfo?.settings.authProvider || EnumAuthProviderType.Jwt;
  const authDir = `${serverDirectories.srcDirectory}/auth`;
  const name =
    authProvider === EnumAuthProviderType.Http ? "Basic" : authProvider;
  const templatePath = require.resolve(
    `../../templates/create-token/${name.toLowerCase()}/${name.toLowerCase()}Token.service.template.ts`
  );
  const file = await readFile(templatePath);
  const filePath = `${authDir}/base/token.service.base.ts`;

  removeTSIgnoreComments(file);

  return { code: print(file).code, path: filePath };
}



