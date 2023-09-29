import { CreateEntityResolverBaseParams, CreateEntityResolverParams, Entity } from "@amplication/code-gen-types";
import { readFile } from "@amplication/code-gen-utils";
import { builders } from "ast-types";
import { resolve } from "path";
import { SUPERTOKENS_ID_FIELD_NAME, templatesPath } from "../constants";
import { Settings } from "../types";

export const replaceEntityResolverBaseTemplate = async (
    eventParams: CreateEntityResolverBaseParams,
    entities: Entity[] | undefined,
    settings: Settings
) => {
    if(!fieldExists(entities, eventParams.entityName, settings.emailFieldName)) {
        throw new Error("Failed to find the configured email field name");
    }
    if(!fieldExists(entities, eventParams.entityName, settings.passwordFieldName)) {
        throw new Error("Failed to find the configured password field name");
    }
    const templatePath = resolve(templatesPath, "authEntity.resolver.base.template.ts"); 
    eventParams.template = await readFile(templatePath);
    eventParams.templateMapping = {
        ...eventParams.templateMapping,
        SUPERTOKENS_ID_FIELD_NAME: builders.identifier(SUPERTOKENS_ID_FIELD_NAME),
        EMAIL_FIELD_NAME: builders.identifier(settings.emailFieldName),
        PASSWORD_FIELD_NAME: builders.identifier(settings.passwordFieldName)
    }
}

export const replaceEntityResolverTemplate = async (
    eventParams: CreateEntityResolverParams
) => {
    const templatePath = resolve(templatesPath, "authEntity.resolver.template.ts"); 
    eventParams.template = await readFile(templatePath);
}

const fieldExists = (entities: Entity[] | undefined, entityName: string, fieldName: string) => {
    const entity = entities?.find((e) => e.name === entityName);
    if(!entity) {
        throw new Error("Failed to find the auth entity");
    }
    return entity.fields.find((field) => field.name === fieldName)
}
