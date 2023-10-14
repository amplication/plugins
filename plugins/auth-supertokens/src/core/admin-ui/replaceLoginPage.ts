import { ModuleMap } from "@amplication/code-gen-types";
import { print, readFile } from "@amplication/code-gen-utils";
import { resolve } from "path";
import { builders } from "ast-types";
import { staticsPath, templatesPath } from "../../constants";
import { PasswordlessContactMethod, PasswordlessFlowType, Settings } from "../../types";
import { interpolate } from "../../utils";

export const replaceLoginPage = async (
    srcDirectory: string,
    modules: ModuleMap,
    settings: Settings
) => {

    const newLoginCode = await getLoginCode(settings);
    const oldLoginModule = modules.get(`${srcDirectory}/Login.tsx`);
    modules.replace(oldLoginModule, {
        path: oldLoginModule.path,
        code: newLoginCode
    });
}

const getLoginCode = async (settings: Settings) => {
    if (settings.recipe.name === "passwordless") {
        return await getPasswordlessLoginCode(settings);
    }
    const path = resolve(staticsPath, "admin-ui", settings.recipe.name, "Login.tsx");
    return print(await readFile(path)).code;
}

const getPasswordlessLoginCode = async (settings: Settings) => {
    if(settings.recipe.name !== "passwordless") {
        throw new Error("Expected only passwordless recipe");
    }
    const { flowType, contactMethod, name } = settings.recipe;
    const flowTypeToSubDir: {[key in PasswordlessFlowType]: string} = {
        "USER_INPUT_CODE": "otp_and_or_magiclink",
        "MAGIC_LINK": "magiclink",
        "USER_INPUT_CODE_AND_MAGIC_LINK": "otp_and_or_magiclink"
    }
    const contactMethodToFieldLabel: {[key in PasswordlessContactMethod]: string} = {
        "EMAIL": "Email",
        "EMAIL_OR_PHONE": "Email or Phone Number",
        "PHONE": "Phone Number"
    }
    const templatePath = resolve(templatesPath, "admin-ui", name,
        flowTypeToSubDir[flowType], "Login.template.tsx");
    const template = await readFile(templatePath);
    interpolate(template, {
        CONTACT_METHOD_FIELD_LABEL: builders.stringLiteral(contactMethodToFieldLabel[contactMethod])
    });
    return print(template).code
}
