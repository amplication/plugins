import { CreateSeedParams, Entity, ModuleMap } from "@amplication/code-gen-types";
import { SUPERTOKENS_ID_FIELD_NAME, templatesPath } from "../../constants";
import { resolve } from "path";
import { print, readFile } from "@amplication/code-gen-utils";
import { builders } from "ast-types";
import { interpolate } from "../../utils";

export const replaceCustomSeedTemplate = async (
    scriptsDirectory: string,
    authEntity: Entity,
    modules: ModuleMap
) => {
    const templatePath = resolve(templatesPath, "custom-seed.template.ts");
    const template = await readFile(templatePath);
    const templateMapping = {
        ENTITY_NAME: builders.identifier(authEntity.name.toLocaleLowerCase()),
        SUPERTOKENS_ID_FIELD_NAME: builders.stringLiteral(SUPERTOKENS_ID_FIELD_NAME)
    };
    interpolate(template, templateMapping);

    const filePath = `${scriptsDirectory}/customSeed.ts`;
    modules.set({
        path: filePath,
        code: print(template).code
    })
}
