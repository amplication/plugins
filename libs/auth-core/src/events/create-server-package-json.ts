import {
  DsgContext,
  CreateServerPackageJsonParams,
  ModuleMap,
} from "@amplication/code-gen-types";
import { merge } from "lodash";
import { createGrantsModule } from "../core";

export function beforeCreateServerPackageJson(
  context: DsgContext,
  eventParams: CreateServerPackageJsonParams
) {
  const myValues = {
    dependencies: {
      "@nestjs/jwt": "^10.1.1",
      "@nestjs/passport": "^10.0.2",
      "nest-access-control": "^3.1.0",
      passport: "0.6.0",
      "passport-http": "0.3.0",
      "passport-jwt": "4.0.1",
    },
    devDependencies: {
      "@types/passport-http": "0.3.9",
      "@types/passport-jwt": "3.0.10",
    },
  };

  eventParams.updateProperties.forEach((updateProperty) =>
    merge(updateProperty, myValues)
  );

  return eventParams;
}

export async function afterCreateServerPackageJson(
  context: DsgContext,
  eventParams: CreateServerPackageJsonParams,
  modules: ModuleMap
): Promise<ModuleMap> {
  // create grants here, because here the DSG format this code to json file.
  const grants =
    context.entities && context.roles
      ? createGrantsModule(
          context.serverDirectories.srcDirectory,
          context.entities,
          context.roles
        )
      : null;

  if (grants) {
    await modules.set(grants);
  }

  return modules;
}
