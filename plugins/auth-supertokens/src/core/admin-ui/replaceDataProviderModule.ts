import { BuildLogger, ModuleMap } from "@amplication/code-gen-types";
import { print, readFile } from "@amplication/code-gen-utils";
import { resolve } from "path";
import { staticsPath } from "../../constants";

export const replaceDataProviderModule = async (
  srcDirectory: string,
  modules: ModuleMap,
  logger: BuildLogger,
) => {
  logger.info("Replacing the data provider module in the admin UI");
  const dataProviderPath = resolve(
    staticsPath,
    "admin-ui",
    "graphqlDataProvider.ts",
  );
  const newDataProviderCode = await readFile(dataProviderPath);
  const oldDataProviderModule = modules.get(
    `${srcDirectory}/data-provider/graphqlDataProvider.ts`,
  );
  modules.replace(oldDataProviderModule, {
    path: oldDataProviderModule.path,
    code: print(newDataProviderCode).code,
  });
};
