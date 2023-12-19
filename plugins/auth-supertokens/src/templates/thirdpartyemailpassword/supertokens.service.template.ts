import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import supertokens, {
  deleteUser,
  RecipeUserId,
  User as STUser,
} from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import Dashboard from "supertokens-node/recipe/dashboard";
import ThirdPartyEmailPassword from "supertokens-node/recipe/thirdpartyemailpassword";
import { generateSupertokensOptions } from "./generateSupertokensOptions";
import { AuthError } from "./auth.error";

@Injectable()
export class SupertokensService {
  constructor(
    protected readonly configService: ConfigService,
    protected readonly userService: AUTH_ENTITY_SERVICE_ID,
  ) {
    supertokens.init({
      ...generateSupertokensOptions(configService),
      recipeList: [
        ThirdPartyEmailPassword.init({
          providers: THIRD_PARTY_PROVIDERS,
          override: {
            functions: (originalImplementation) => {
              return {
                ...originalImplementation,
                emailPasswordSignUp: async function (input) {
                  const resp =
                    await originalImplementation.emailPasswordSignUp(input);
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
                thirdPartySignInUp: async function (input) {
                  const resp =
                    await originalImplementation.thirdPartySignInUp(input);

                  if (
                    resp.status === "OK" &&
                    resp.createdNewRecipeUser &&
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
                      "Failed to find a user with the corresponding supertokens ID",
                    );
                  }
                  const userInfo = await supertokens.getUser(
                    input.userId,
                    input.userContext,
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
    supertokensId: string,
  ): Promise<AUTH_ENTITY_ID | null> {
    return await this.userService.findOne({
      where: {
        SUPERTOKENS_ID_FIELD_NAME: supertokensId,
      },
    });
  }

  async createSupertokensUser(
    email: string,
    password: string | undefined,
    thirdPartyId: string | undefined,
  ): Promise<string> {
    let resp;
    if (password) {
      resp = await ThirdPartyEmailPassword.emailPasswordSignUp(
        "public",
        email,
        password,
        {
          skipDefaultPostUserSignUp: true,
        },
      );
    } else if (thirdPartyId) {
      resp = await ThirdPartyEmailPassword.thirdPartyManuallyCreateOrUpdateUser(
        "public",
        thirdPartyId,
        "",
        email,
        false,
        {
          skipDefaultPostUserSignUp: true,
        },
      );
    } else {
      throw new Error(
        "Either a password or a third party ID must be provided with the email to create a user",
      );
    }
    switch (resp.status) {
      case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
      case "SIGN_IN_UP_NOT_ALLOWED":
      case "EMAIL_ALREADY_EXISTS_ERROR":
        throw new AuthError(resp.status);
      case "OK":
        return resp.user.id;
      default:
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
    email: string | undefined,
    thirdPartyId: string | undefined,
    password: string | undefined,
    supertokensId: string,
  ): Promise<void> {
    if (!email) {
      throw new Error("An email must be supplied to update a user");
    }
    let resp;
    if (password) {
      resp = await ThirdPartyEmailPassword.updateEmailOrPassword({
        recipeUserId: await this.getRecipeUserId(supertokensId),
        email,
        password,
      });
    } else if (thirdPartyId) {
      const user = await this.getSupertokensUserInfo(supertokensId);
      const thirdPartyData = user.thirdParty.find(
        (tp) => tp.id === thirdPartyId,
      );
      if (!thirdPartyData) {
        throw new Error(
          `The user doesn't have a third party login with ${thirdPartyId}`,
        );
      }
      const thirdPartyMethod = user.loginMethods.find(
        (lm) => lm.recipeId === "thirdparty",
      );
      if (thirdPartyMethod === undefined) {
        throw new Error(
          "Failed to find information on the user's third party login",
        );
      }
      resp = await ThirdPartyEmailPassword.thirdPartyManuallyCreateOrUpdateUser(
        "public",
        thirdPartyId,
        thirdPartyData.userId,
        email,
        thirdPartyMethod.verified,
      );
    } else {
      throw new Error(
        "Password or third party ID must be supplied to update the SuperTokens user",
      );
    }
    switch (resp.status) {
      case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
      case "SIGN_IN_UP_NOT_ALLOWED":
        throw new AuthError(resp.status);
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
        "SUPERTOKENS_ID_WITH_NO_CORRESPONDING_SUPERTOKENS_USER",
      );
    }
    return user;
  }

  async getRecipeUserId(supertokensId: string): Promise<RecipeUserId> {
    const user = await this.getSupertokensUserInfo(supertokensId);
    const loginMethod = user.loginMethods.find(
      (lm) => lm.recipeId === "emailpassword",
    );
    if (!loginMethod) {
      throw new Error("Failed to find the login method");
    }
    return loginMethod.recipeUserId;
  }
}
