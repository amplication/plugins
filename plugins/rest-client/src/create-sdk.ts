import { Entity, Module } from "@amplication/code-gen-types";
import { join } from "path";
import { createEntities } from "./crud-functions/create-entities";
import { createSDKIndexModule } from "./index-file/create-index";
import { createIndexFile } from "./crud-functions/create-index-file";

export async function createSDK(
  sdkSrcPath: string,
  entities: Entity[]
): Promise<Module[]> {
  const entitiesPath = join(sdkSrcPath, "entities");
  const entitiesModules = await createEntities(entitiesPath, entities);
  const indexEntitiesModule = createIndexFile(entitiesPath, entitiesModules);
  const indexModule = await createSDKIndexModule(sdkSrcPath, entitiesModules);
  return [
    indexModule,
    indexEntitiesModule,
    ...entitiesModules.map((m) => m.module),
  ];
}
