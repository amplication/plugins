import { Entity } from "@amplication/code-gen-types";

export const verifyEmailAndPasswordFieldsExist = (
    authEntity: Entity | undefined,
    emailFieldName: string,
    passwordFieldName: string
) => {
    if(!authEntity) {
        throw new Error("Failed to find the auth entity");
    }
    let [emailFieldFound, passwordFieldFound] = [false, false];
    for(const field of authEntity.fields) {
        emailFieldFound = emailFieldFound || field.name === emailFieldName;
        passwordFieldFound = passwordFieldFound || field.name === passwordFieldName;
    }
    if(!passwordFieldFound || !emailFieldFound) {
        throw new Error("Failed to find the email and password fields in the auth entity");
    }

}
