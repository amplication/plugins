import { Module, DsgContext } from "@amplication/code-gen-types";
import { mapAuthTemplate } from "../util/createAuthTemplate";
import { join } from "path";
import { templatesPath } from "../constants";

const iAuthStrategyPath = join(templatesPath, "IAuthStrategy.template.ts");

export async function createIAuthStrategy(
  dsgContext: DsgContext
): Promise<Module> {
  return await mapAuthTemplate(
    dsgContext,
    iAuthStrategyPath,
    "IAuthStrategy.ts"
  );
}
