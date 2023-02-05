import { print } from "@amplication/code-gen-utils";
import { EnumAuthProviderType } from "../types";
import { DsgContext, Module } from "@amplication/code-gen-types";
import { readFile } from "@amplication/code-gen-utils";
import { join } from "path";
import { templatesPath } from "../constants";

export async function createTokenServiceTests(
  dsgContext: DsgContext
): Promise<Module> {
  const { serverDirectories, resourceInfo } = dsgContext;
  const authTestsDir = `${serverDirectories.srcDirectory}/tests/auth`;
  const authProvider: EnumAuthProviderType =
    resourceInfo?.settings.authProvider || EnumAuthProviderType.Jwt;
  const name =
    authProvider === EnumAuthProviderType.Http ? "Basic" : authProvider;

  const templatePath = join(
    templatesPath,
    `create-token/${name.toLowerCase()}/${name.toLowerCase()}Token.service.spec.template.ts`
  );

  const file = await readFile(templatePath);
  const filePath = `${authTestsDir}/token.service.spec.ts`;

  return { code: print(file).code, path: filePath };
}
