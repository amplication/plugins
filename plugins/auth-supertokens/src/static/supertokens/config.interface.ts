import { AppInfo, RecipeListFunction } from "supertokens-node/types";
import { TypeInput } from "supertokens-node/types";

export type AuthModuleConfig = Omit<TypeInput, "recipeList">;
