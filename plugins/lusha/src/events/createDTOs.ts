import {
  CreateServerParams,
  DsgContext,
  Module,
} from "@amplication/code-gen-types";

export const afterCreateServerModules = (
  context: DsgContext,
  eventParams: CreateServerParams,
  modules: Module[]
): Module[] =>
  modules.map((module: Module) => {
    
    if (!module.path.includes("/base/")) return module;

    if (/controller|service|module/.test(module.path)) return module;

    const splitModule = module.path.split("/");
    const entityName = splitModule[2];
    const dtoModule = splitModule.slice(-1).join().replace(".ts", "");

    return {
      code: module.code,
      path: `server/src/app/${entityName}/model/dtos/${dtoModule}.dto.ts`,
    };
  });
