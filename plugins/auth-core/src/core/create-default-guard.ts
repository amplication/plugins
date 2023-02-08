import { builders } from "ast-types";
import { print } from "@amplication/code-gen-utils";
import { Module } from "@amplication/code-gen-types";
import {
  addImports,
  importNames,
  interpolate,
  removeTSClassDeclares,
} from "../util/ast";
import { readFile } from "@amplication/code-gen-utils";
import { relativeImportPath } from "../util/module";
import { EnumAuthProviderType } from "@amplication/code-gen-types/src/models";
import {join} from "path"; 
import { templatesPath } from "../constants";

type AuthGuardMetaData = {
  path: string;
  fileName: string;
  className: string;
};

export async function createDefaultGuard(
  authProvider: EnumAuthProviderType,
  authPath: string
): Promise<Module> {


  const defaultAuthGuardPath = join(templatesPath,"default-auth-guard.template.ts"); 

  const modulePath = `${authPath}/defaultAuth.guard.ts`;

  const templateGuardFile = await readFile(defaultAuthGuardPath);
  const { path, className } = getMetaDataForAuthGuard(authProvider, authPath);
  const baseGuardIdentifier = builders.identifier(className);
  interpolate(templateGuardFile, {
    GUARD: baseGuardIdentifier,
  });
  const baseGuardImport = importNames(
    [baseGuardIdentifier],
    relativeImportPath(modulePath, path)
  );
  addImports(templateGuardFile, [baseGuardImport]);
  removeTSClassDeclares(templateGuardFile);
  return { path: modulePath, code: print(templateGuardFile).code };
}
function getMetaDataForAuthGuard(
  setAuthGuard: EnumAuthProviderType,
  authPath: string
): AuthGuardMetaData {
  const data: AuthGuardMetaData = { fileName: "", path: "", className: "" };
  switch (setAuthGuard) {
    case EnumAuthProviderType.Http:
      data.fileName = "basicAuth";
      data.className = "BasicAuthGuard";
      data.path = `${authPath}/basic/${data.fileName}.guard.ts`;
      break;
    case EnumAuthProviderType.Jwt:
      data.fileName = "jwtAuth";
      data.className = "JwtAuthGuard";
      data.path = `${authPath}/jwt/${data.fileName}.guard.ts`;
      break;
    default:
      throw new Error(
        `Not found any meta data for auth guard - ${setAuthGuard}`
      );
  }
  return data;
}
