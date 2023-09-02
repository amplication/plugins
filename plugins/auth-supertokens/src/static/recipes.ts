import Passwordless from "supertokens-node/recipe/passwordless"
import Session from "supertokens-node/recipe/session"
import Dashboard from "supertokens-node/recipe/dashboard"
import EmailVerification from "supertokens-node/recipe/emailverification"

export const recipeList = [
    Passwordless.init({
        contactMethod: "EMAIL_OR_PHONE",
        flowType: "USER_INPUT_CODE_AND_MAGIC_LINK"
    }),
    Session.init(),
    Dashboard.init(),
    EmailVerification.init({
        mode: "REQUIRED"
    })
];
