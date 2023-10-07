export interface Settings {
  apiDomain: string,
  appName: string,
  websiteDomain: string,
  websiteBasePath: string,
  apiBasePath: string,
  connectionUri: string,
  apiGatewayPath: string,
  apiKey: string,
  recipe: {
    name: "emailpassword",
    emailFieldName: string,
    passwordFieldName: string
  } | {
    name: "passwordless",
    flowType: "USER_INPUT_CODE_AND_MAGIC_LINK"
      | "USER_INPUT_CODE" | "MAGIC_LINK",
    contactMethod: "EMAIL" | "PHONE" | "EMAIL_OR_PHONE"
  }
}

export type EmailPasswordSettings = {
  emailFieldName: string,
  passwordFieldName: string
}

export type PasswordlessSettings = {}

export type RecipeSettings = EmailPasswordSettings | PasswordlessSettings;
