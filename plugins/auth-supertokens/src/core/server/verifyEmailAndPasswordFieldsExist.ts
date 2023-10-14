import { Entity } from "@amplication/code-gen-types";

export const verifyEmailAndPasswordFieldsExist = (
    authEntity: Entity | undefined,
    emailFieldName: string | undefined,
    passwordFieldName: string | undefined
) => {
    if(!authEntity) {
        throw new Error("Failed to find the auth entity");
    }
    if(!emailFieldName) {
        throw new Error("The email field name must be set");
    }
    if(!passwordFieldName) {
        throw new Error("The password field name must be set")
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
