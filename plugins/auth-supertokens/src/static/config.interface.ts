import { AppInfo, RecipeListFunction } from "supertokens-node/types";

export const CONFIG_INJECTION_TOKEN = "ConfigInjectionToken";

export type AuthModuleConfig = {
  appInfo: AppInfo;
  connectionURI: string;
  apiKey?: string;
  recipeList: RecipeListFunction[]
}
