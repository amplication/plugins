import { Module, DsgContext } from "@amplication/code-gen-types";
import { mapAuthTemplate } from "../util/createAuthTemplate";
import { join } from "path";
import { templatesPath } from "../constants";

const authControllerPath = join(templatesPath, "auth.controller.template.ts");

export async function createAuthController(
  dsgContext: DsgContext,
): Promise<Module> {
  return await mapAuthTemplate(
    dsgContext,
    authControllerPath,
    "auth.controller.ts",
  );
}
