import { Module, DsgContext } from "@amplication/code-gen-types";
import { join } from "path";
import { templatesPath } from "../constants";
import { mapAuthTemplate } from "../util/createAuthTemplate";

const authResolverPath = join(templatesPath, "auth.resolver.template.ts");

export async function createAuthResolver(
  dsgContext: DsgContext
): Promise<Module> {
  return await mapAuthTemplate(
    dsgContext,
    authResolverPath,
    "auth.resolver.ts"
  );
}
