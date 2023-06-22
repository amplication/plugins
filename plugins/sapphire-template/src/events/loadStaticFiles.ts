import { resolve } from "path";
import {
  DsgContext,
  LoadStaticFilesParams,
  Module,
} from "@amplication/code-gen-types";

export const afterLoadStaticFiles = async (
  context: DsgContext,
  eventParams: LoadStaticFilesParams,
  modules: Module[]
) => {
  const filteredStaticModules = modules.filter((module: Module) => {
    return /(?:\/src\/util\/+)|(?:\/src\/errors\.ts+)|(?:\/src\/prisma\.util\.ts+)|(?:\/src\/types\.ts+)/gm.test(
      module.path
    );
  });
  const prismaStaticPath = resolve(__dirname, "./static/prisma");
  const baseStaticPath = resolve(__dirname, "./static/base");

  const configStaticPath = resolve(__dirname, "./static/config");
  const docsStaticPath = resolve(__dirname, "./static/docs");

  const mainStaticPath = resolve(__dirname, "./static/main");

  const infraStaticPath = resolve(__dirname, "./static/infraFiles");
  const infraStaticsFile = await context.utils.importStaticModules(
    infraStaticPath,
    context.serverDirectories.srcDirectory
  );

  const mainStaticsFile = await context.utils.importStaticModules(
    mainStaticPath,
    context.serverDirectories.srcDirectory
  );

  const configStaticsFiles = await context.utils.importStaticModules(
    configStaticPath,
    `${context.serverDirectories.baseDirectory}/config`
  );

  const docsStaticsFiles = await context.utils.importStaticModules(
    docsStaticPath,
    `${context.serverDirectories.baseDirectory}/docs`
  );

  const prismaStaticsFiles = await context.utils.importStaticModules(
    prismaStaticPath,
    `${context.serverDirectories.srcDirectory}/app/prisma`
  );

  //implemented here because this modules are not formatted at all.

  const baseStaticsFiles = await context.utils.importStaticModules(
    baseStaticPath,
    context.serverDirectories.baseDirectory
  );

  return [
    ...filteredStaticModules,
    ...prismaStaticsFiles,
    ...baseStaticsFiles,
    ...docsStaticsFiles,
    ...configStaticsFiles,
    ...mainStaticsFile,
    ...infraStaticsFile,
  ];
};
