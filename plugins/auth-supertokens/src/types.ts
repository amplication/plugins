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
    flowType: PasswordlessFlowType,
    contactMethod: PasswordlessContactMethod
  } | {
    name: "thirdparty"
  } & ThirdPartyProvider
  | {
    name: "thirdpartyemailpassword" 
  } & ThirdPartyProvider
  | {
    name: "thirdpartypasswordless",
    flowType: PasswordlessFlowType,
    contactMethod: PasswordlessContactMethod
  } & ThirdPartyProvider
  | {
    name: "phonepassword"
  }
}

type PasswordlessFlowType = "USER_INPUT_CODE_AND_MAGIC_LINK"
  | "USER_INPUT_CODE" | "MAGIC_LINK";

type PasswordlessContactMethod = "EMAIL" | "PHONE" | "EMAIL_OR_PHONE";

export type ThirdPartyProvider = {
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
