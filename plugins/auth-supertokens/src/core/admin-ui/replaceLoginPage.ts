import { BuildLogger, ModuleMap } from "@amplication/code-gen-types";
import {
  appendImports,
  parse,
  print,
  readFile,
} from "@amplication/code-gen-utils";
import { resolve } from "path";
import { builders, namedTypes } from "ast-types";
import { staticsPath, templatesPath } from "../../constants";
import {
  PasswordlessContactMethod,
  PasswordlessFlowType,
  Settings,
  ThirdPartyProvider,
} from "../../types";
import { interpolate } from "../../utils";

export const replaceLoginPage = async (
  srcDirectory: string,
  modules: ModuleMap,
  settings: Settings,
  logger: BuildLogger,
) => {
  logger.info("Replacing the login page in the admin UI");
  const newLoginCode = await getLoginCode(settings);
  const oldLoginModule = modules.get(`${srcDirectory}/Login.tsx`);
  modules.replace(oldLoginModule, {
    path: oldLoginModule.path,
    code: newLoginCode,
  });
};

const getLoginCode = async (settings: Settings) => {
  if (settings.recipe.name === "passwordless") {
    return await getPasswordlessLoginCode(settings);
  } else if (
    settings.recipe.name === "thirdparty" ||
    settings.recipe.name === "thirdpartyemailpassword"
  ) {
    return await getThirdPartyLoginCode(settings);
  } else if (settings.recipe.name === "thirdpartypasswordless") {
    return await getThirdPartyPasswordlessLoginCode(settings);
  }
  const path = resolve(
    staticsPath,
    "admin-ui",
    settings.recipe.name,
    "Login.tsx",
  );
  return print(await readFile(path)).code;
};

const getPasswordlessLoginCode = async (settings: Settings) => {
  if (
    settings.recipe.name !== "passwordless" &&
    settings.recipe.name !== "thirdpartypasswordless"
  ) {
    throw new Error("Expected only passwordless recipe");
  }
  const { flowType, contactMethod, name } = settings.recipe;
  const flowTypeToSubDir: { [key in PasswordlessFlowType]: string } = {
    USER_INPUT_CODE: "otp_and_or_magiclink",
    MAGIC_LINK: "magiclink",
    USER_INPUT_CODE_AND_MAGIC_LINK: "otp_and_or_magiclink",
  };
  const contactMethodToFieldLabel: {
    [key in PasswordlessContactMethod]: string;
  } = {
    EMAIL: "Email",
    EMAIL_OR_PHONE: "Email or Phone Number",
    PHONE: "Phone Number",
  };
  const templatePath = resolve(
    templatesPath,
    "admin-ui",
    name,
    flowTypeToSubDir[flowType],
    "Login.template.tsx",
  );
  const template = await readFile(templatePath);
  interpolate(template, {
    CONTACT_METHOD_FIELD_LABEL: builders.stringLiteral(
      contactMethodToFieldLabel[contactMethod],
    ),
  });
  return print(template).code;
};

const getThirdPartyLoginCode = async (settings: Settings) => {
  if (
    settings.recipe.name !== "thirdparty" &&
    settings.recipe.name !== "thirdpartyemailpassword" &&
    settings.recipe.name !== "thirdpartypasswordless"
  ) {
    throw new Error("Expected only third party recipes");
  }
  const selectedProviders = getSelectedThirdPartyProviders(settings);
  const loginPath = resolve(
    templatesPath,
    "admin-ui",
    settings.recipe.name,
    "Login.tsx",
  );
  const loginPage = await readFile(loginPath);
  addThirdPartyLoginButtonImports(loginPage, selectedProviders);
  addThirdPartyLoginButtonExpressions(loginPage, selectedProviders);
  return print(loginPage).code;
};

const getThirdPartyPasswordlessLoginCode = async (settings: Settings) => {
  const code = parse(await getPasswordlessLoginCode(settings));
  const selectedProviders = getSelectedThirdPartyProviders(settings);
  addThirdPartyLoginButtonImports(code, selectedProviders);
  addThirdPartyLoginButtonExpressions(code, selectedProviders);
  return print(code).code;
};

const getSelectedThirdPartyProviders = (settings: Settings) => {
  const allProviders: (keyof ThirdPartyProvider)[] = [
    "google",
    "apple",
    "github",
    "twitter",
  ];
  return Object.keys(settings.recipe).filter((key) =>
    allProviders.includes(key as any),
  ) as (keyof ThirdPartyProvider)[];
};

const addThirdPartyLoginButtonExpressions = (
  loginPage: namedTypes.File,
  selectedProviders: (keyof ThirdPartyProvider)[],
) => {
  const btnExpressions = selectedProviders.map(
    (providerName) => providerToButtonExpression[providerName],
  );
  const templateMapping = {
    SIGN_IN_BUTTONS: builders.jsxFragment(
      builders.jsxOpeningFragment(),
      builders.jsxClosingFragment(),
      btnExpressions,
    ),
  };
  interpolate(loginPage, templateMapping);
};

const addThirdPartyLoginButtonImports = (
  loginPage: namedTypes.File,
  selectedProviders: (keyof ThirdPartyProvider)[],
) => {
  appendImports(loginPage, [
    builders.importDeclaration(
      selectedProviders.map((name) =>
        builders.importSpecifier(
          builders.identifier(
            providerToButtonName[name as keyof ThirdPartyProvider]!,
          ),
        ),
      ),
      builders.stringLiteral("react-social-login-buttons"),
    ),
  ]);
};

const providerToButtonName: {
  [key in keyof Required<ThirdPartyProvider>]: string;
} = {
  google: "GoogleLoginButton",
  github: "GithubLoginButton",
  apple: "AppleLoginButton",
  twitter: "TwitterLoginButton",
};

const jsxElement = (elString: string) => {
  const exprStmt = parse(elString).program
    .body[0] as namedTypes.ExpressionStatement;
  return exprStmt.expression as namedTypes.JSXElement;
};

const providerToButtonExpression: {
  [key in keyof Required<ThirdPartyProvider>]: namedTypes.JSXElement;
} = {
  google: jsxElement('<GoogleLoginButton onClick={signInClicked("google")} />'),
  github: jsxElement('<GithubLoginButton onClick={signInClicked("github")} />'),
  apple: jsxElement('<AppleLoginButton onClick={signInClicked("apple")} />'),
  twitter: jsxElement(
    '<TwitterLoginButton onClick={signInClicked("twitter")} />',
  ),
};
