import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import supertokens, {
  deleteUser,
  RecipeUserId,
  User as STUser,
} from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import Dashboard from "supertokens-node/recipe/dashboard";
import EmailPassword, {
  RecipeInterface,
} from "supertokens-node/recipe/emailpassword";
import { generateSupertokensOptions } from "./generateSupertokensOptions";
import { AuthError } from "./auth.error";

@Injectable()
export class SupertokensService {
  constructor(
    protected readonly configService: ConfigService,
    protected readonly userService: AUTH_ENTITY_SERVICE_ID
  ) {
    supertokens.init({
      ...generateSupertokensOptions(configService),
      recipeList: [
        EmailPassword.init({
          override: {
            functions: (
              originalImplementation: RecipeInterface
            ): RecipeInterface => {
              return {
                ...originalImplementation,
                signUp: async function (input) {
                  let resp = await originalImplementation.signUp(input);
                  if (
                    resp.status === "OK" &&
                    resp.user.loginMethods.length === 1 &&
                    (!input.userContext ||
                      !input.userContext.skipDefaultPostUserSignUp)
                  ) {
                    userService.create({
                      data: {
                        SUPERTOKENS_ID_FIELD_NAME: resp.user.id,
                        ...DEFAULT_FIELD_VALUES,
                      },
                    });
                  }
                  return resp;
                },
              };
            },
          },
        }),
        Session.init({
          override: {
            functions: (originalImplementation) => {
              return {
                ...originalImplementation,
                createNewSession: async function (input) {
                  const user = await userService.findOne({
                    where: {
                      SUPERTOKENS_ID_FIELD_NAME: input.userId,
                    },
                    select: {
                      id: true,
                    },
                  });
                  if (!user) {
                    throw new Error(
                      "Failed to find a user with the corresponding supertokens ID"
                    );
                  }
                  const userInfo = await supertokens.getUser(
                    input.userId,
                    input.userContext
                  );
                  return originalImplementation.createNewSession({
                    ...input,
                    accessTokenPayload: {
                      ...input.accessTokenPayload,
                      email: userInfo?.emails[0],
                      userId: user.id,
                    },
                  });
                },
              };
            },
          },
        }),
        Dashboard.init(),
      ],
    });
  }

  async getUserBySupertokensId(
    supertokensId: string
  ): Promise<AUTH_ENTITY_ID | null> {
    return await this.userService.findOne({
      where: {
        SUPERTOKENS_ID_FIELD_NAME: supertokensId,
      },
    });
  }

  async createSupertokensUser(
    email: string,
    password: string
  ): Promise<string> {
    const resp = await EmailPassword.signUp("public", email, password, {
      skipDefaultPostUserSignUp: true,
    });
    if (resp.status === "OK") {
      return resp.user.id;
    } else if (resp.status === "EMAIL_ALREADY_EXISTS_ERROR") {
      throw new AuthError(resp.status);
    } else {
      throw new AuthError("UNKNOWN_ERROR");
    }
  }

  async deleteSupertokensUser(supertokensId: string): Promise<void> {
    const resp = await deleteUser(supertokensId);
    if (resp.status !== "OK") {
      throw new AuthError("UNKNOWN_ERROR");
    }
  }

  async updateSupertokensUser(
    recipeUserId: RecipeUserId,
    email?: string,
    password?: string
  ): Promise<void> {
    const resp = await EmailPassword.updateEmailOrPassword({
      recipeUserId,
      email,
      password,
    });
    switch (resp.status) {
      case "EMAIL_ALREADY_EXISTS_ERROR":
        throw new AuthError(resp.status);
      case "PASSWORD_POLICY_VIOLATED_ERROR":
        throw new AuthError("SUPERTOKENS_PASSWORD_POLICY_VIOLATED_ERROR");
      case "UNKNOWN_USER_ID_ERROR":
        throw new AuthError(
          "SUPERTOKENS_ID_WITH_NO_CORRESPONDING_SUPERTOKENS_USER"
        );
      case "OK":
        return;
      default:
        throw new AuthError("UNKNOWN_ERROR");
    }
  }

  async getSupertokensUserInfo(supertokensId: string): Promise<STUser> {
    const user = await supertokens.getUser(supertokensId);
    if (!user) {
      throw new AuthError(
        "SUPERTOKENS_ID_WITH_NO_CORRESPONDING_SUPERTOKENS_USER"
      );
    }
    return user;
  }

  async getRecipeUserId(supertokensId: string): Promise<RecipeUserId> {
    const user = await this.getSupertokensUserInfo(supertokensId);
    const loginMethod = user.loginMethods.find(
      (lm) => lm.recipeId === "emailpassword"
    );
    if (!loginMethod) {
      throw new Error("Failed to find the login method");
    }
    return loginMethod.recipeUserId;
  }
}
