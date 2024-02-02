import {
  CreateServerAppModuleParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { builders } from "ast-types";
import { join, resolve } from "path";
import { staticsPath } from "../constants";
import { print, readFile } from "@amplication/code-gen-utils";

export const beforeCreateAppModule = async (
  context: DsgContext,
  eventParams: CreateServerAppModuleParams,
) => {
  const { templateMapping, modulesFiles } = eventParams;
  const moduleFilePath = resolve(staticsPath, "mqtt.module.ts");
  const moduleFile = await readFile(moduleFilePath);

  const mqttModuleId = builders.identifier("MqttModule");

  const importArray = builders.arrayExpression([
    mqttModuleId,
    ...eventParams.templateMapping["MODULES"].elements,
  ]);

  templateMapping["MODULES"] = importArray;

  const importFile = {
    code: print(moduleFile).code,
    path: join(
      context.serverDirectories.messageBrokerDirectory,
      "mqtt.module.ts",
    ),
  };

  modulesFiles.set(importFile);

  return eventParams;
};
