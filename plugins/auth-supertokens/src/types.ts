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
  } | ThirdPartyRecipeSettings
  | {
    name: "thirdpartyemailpassword" 
  } & Omit<ThirdPartyRecipeSettings, "name">
}

export type ThirdPartyRecipeSettings = {
  name: "thirdparty",
  google?: ThirdPartyProviderSettings,
  github?: ThirdPartyProviderSettings,
  apple?: ThirdPartyProviderSettings,
  twitter?: ThirdPartyProviderSettings
}

export type ThirdPartyProviderSettings = {
  clientId: string,
  clientSecret?: string,
  additionalConfig?: {[key: string]: string}
}
