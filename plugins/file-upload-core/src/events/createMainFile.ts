import { CreateMainFileParams, DsgContext } from "@amplication/code-gen-types";
import { templatesPath } from "../constants";
import { resolve } from "path";
import { readFile } from "@amplication/code-gen-utils";

export const beforCreateMainFile = async (
  context: DsgContext,
  eventParams: CreateMainFileParams,
) => {
  const templatePath = resolve(templatesPath, "main.template.ts");
  const bigIntTemplatePath = resolve(
    templatesPath,
    "main.with-bigint.template.ts",
  );

  eventParams.template = await readFile(templatePath);
  eventParams.bigIntTemplate = await readFile(bigIntTemplatePath);

  return eventParams;
};
