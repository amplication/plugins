import { Entity } from "@amplication/code-gen-types";

export const verifySupertokensIdFieldExists = (
    entities: Entity[],
    authEntityName: string,
    supertokensIdFieldName: string
) => {
    const authEntity = entities.find((entity) => entity.name === authEntityName);
    if(!authEntity) {
        throw new Error("Failed to find the auth entity");
    }
    const supertokensIdField = authEntity.fields.find((field) => 
        field.name === supertokensIdFieldName);
    if(!supertokensIdField) {
        throw new Error(`The field ${supertokensIdFieldName} specified in the settings does not exist in the auth entity`);
    }
}
