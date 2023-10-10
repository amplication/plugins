import { DsgContext } from "@amplication/code-gen-types";

export const removeEmailUsernamePhoneNumberPasswordField = (
    context: DsgContext
) => {
    const authEntityName = context.resourceInfo?.settings.authEntityName;
    const authEntity = context.entities?.find((entity) => (
        entity.name === authEntityName
    ));
    if(!authEntity) {
        throw new Error("Failed to find the auth entity");
    }    
    authEntity.fields = authEntity.fields.filter((field) => (
        field.name !== "username"
        && field.name !== "password"
        && field.name !== "email"
        && field.name !== "phoneNumber"
    ));
}
