import { DsgContext, EntityField, EnumDataType } from "@amplication/code-gen-types";
import cuid from "cuid";

const SUPERTOKENS_ID_FIELD_NAME = "supertokensId";

const createSupertokensField = (): EntityField => ({
    id: cuid(),
    permanentId: cuid(),
    name: "supertokensId",
    displayName: "SupertokensUserID",
    dataType: EnumDataType.SingleLineText,
    required: true,
    searchable: true,
    customAttributes: null,
    description: "The supertokens user ID",
    unique: true
})

export const addSupertokensIdFieldToAuthEntity = (context: DsgContext) => {
    const authEntityName = context.resourceInfo?.settings.authEntityName;
    if(!authEntityName) {
        throw new Error("Failed to find the authEntityName");
    }
    const authEntity = context.entities?.find((entity) => entity.name === authEntityName);
    if(!authEntity) {
        throw new Error("Failed to find the auth entity");
    }
    const clashingField = authEntity.fields.find((field) => field.name === SUPERTOKENS_ID_FIELD_NAME);
    if(clashingField) {
        throw new Error(`Error: there is already a field with the name ${SUPERTOKENS_ID_FIELD_NAME}`);
    }
    authEntity.fields.push(createSupertokensField());
}
