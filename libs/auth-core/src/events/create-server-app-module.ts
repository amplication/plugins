import {
  CreateServerAppModuleParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { appendImports, parse, print } from "@amplication/code-gen-utils";
import { builders } from "ast-types";
import { importNames } from "../util/ast";

export function beforeCreateAppModule(
  context: DsgContext,
  eventParams: CreateServerAppModuleParams
) {
  const aclModuleId = builders.identifier("ACLModule");
  const authModuleId = builders.identifier("AuthModule");

  const importArray = builders.arrayExpression([
    aclModuleId,
    authModuleId,
    ...eventParams.templateMapping["MODULES"].elements,
  ]);

  eventParams.templateMapping["MODULES"] = importArray;

  return eventParams;
}

export async function afterCreateAppModule(
  context: DsgContext,
  eventParams: CreateServerAppModuleParams,
  modules: ModuleMap
): Promise<ModuleMap> {
  const [appModule] = modules.modules();

  if (!appModule) return modules;
  const file = parse(appModule.code);
  const aclModuleId = builders.identifier("ACLModule");
  const authModuleId = builders.identifier("AuthModule");

  const aclModuleImport = importNames([aclModuleId], "./auth/acl.module");
  const authModuleImport = importNames([authModuleId], "./auth/auth.module");

  appendImports(file, [aclModuleImport, authModuleImport]);

  const updatedModules = new ModuleMap(context.logger);
  appModule.code = print(file).code;
  await updatedModules.set(appModule);
  return updatedModules;
}
