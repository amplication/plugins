import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import supertokens, { deleteUser, RecipeUserId, User as STUser } from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import Dashboard from "supertokens-node/recipe/dashboard";
import ThirdPartyPasswordless from 'supertokens-node/recipe/thirdpartypasswordless';
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
        ThirdPartyPasswordless.init({
          contactMethod: CONTACT_METHOD,
          flowType: FLOW_TYPE,
          providers: THIRD_PARTY_PROVIDERS,
          override: {
            functions: (originalImplementation) => {
              return {
                ...originalImplementation,
                consumeCode: async function (input) {
                  const resp = await originalImplementation.consumeCode(
                    input
                  );
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
                thirdPartySignInUp: async function (input) {
                  let resp = await originalImplementation.thirdPartySignInUp(
                    input
                  );

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
          }
        }),
        Session.init({
          override: {
            functions: (originalImplementation) => {
              return {
                ...originalImplementation,
                createNewSession: async function(input) {
                  const user = await userService.findOne({
                    where: {
                      supertokensId: input.userId
                    },
                    select: {
                      id: true
                    }
                  });
                  if(!user) {
                    throw new Error("Failed to find a user with the corresponding supertokens ID");
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
                      userId: user.id
                    }
                  })
                }
              }
            }
          }
        }),
        Dashboard.init(),
      ],
    });
  }

  async getUserBySupertokensId(supertokensId: string): Promise<AUTH_ENTITY_ID | null> {
    return await this.userService.findOne({
      where: {
        SUPERTOKENS_ID_FIELD_NAME: supertokensId
      }
    })
  }

  async createSupertokensUser(
    email: string | undefined,
    phoneNumber: string | undefined,
    thirdPartyId: string | undefined
  ): Promise<string> {
    let resp;
    const userContext = {
      skipDefaultPostUserSignUp: true
    };
    if(thirdPartyId && email) {
      resp = await ThirdPartyPasswordless.thirdPartyManuallyCreateOrUpdateUser(
        "public",
        thirdPartyId,
        "",
        email,
        false,
        userContext
      );
    } else if (email) {
      resp = await ThirdPartyPasswordless.passwordlessSignInUp({ email, tenantId: "public", userContext });
    } else if(phoneNumber) {
      resp = await ThirdPartyPasswordless.passwordlessSignInUp({ phoneNumber, tenantId: "public", userContext });
    } else {
      throw new Error(
        "Either a third party ID and email or an email or a phone number must be provided with the email to create a user"
      );
    }
    switch (resp.status) {
      case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
      case "SIGN_IN_UP_NOT_ALLOWED":
        throw new AuthError(resp.status);
      case "OK":
        return resp.user.id;
      default:
        throw new AuthError("UNKNOWN_ERROR");
    }
  }

  async deleteSupertokensUser(supertokensId: string): Promise<void> {
    const resp = await deleteUser(supertokensId);
    if(resp.status !== "OK") {
      throw new AuthError("UNKNOWN_ERROR");
    }
  }

  async updateSupertokensUser(
    email: string | undefined,
    thirdPartyId: string | undefined,
    phoneNumber: string | undefined,
    supertokensId: string
  ): Promise<void> {
    if (!email) {
      throw new Error("An email must be supplied to update a user");
    }
    let resp;
    if (thirdPartyId && email) {
      const user = await this.getSupertokensUserInfo(supertokensId);
      const thirdPartyData = user.thirdParty.find(
        (tp) => tp.id === thirdPartyId
      );
      if (!thirdPartyData) {
        throw new Error(
          `The user doesn't have a third party login with ${thirdPartyId}`
        );
      }
      const thirdPartyMethod = user.loginMethods.find(
        (lm) => lm.recipeId === "thirdparty"
      );
      if (thirdPartyMethod === undefined) {
        throw new Error(
          "Failed to find information on the user's third party login"
        );
      }
      resp = await ThirdPartyPasswordless.thirdPartyManuallyCreateOrUpdateUser(
        "public",
        thirdPartyId,
        thirdPartyData.userId,
        email,
        thirdPartyMethod.verified
      );
    } else if(email || phoneNumber) {
      resp = await ThirdPartyPasswordless.updatePasswordlessUser({
        recipeUserId: await this.getRecipeUserId(supertokensId),
        email,
        phoneNumber
      })
    } else {
      throw new Error(
        "Either a third party ID and email or an email or a phone number must be supplied to update the SuperTokens user"
      );
    }
    switch (resp.status) {
      case "EMAIL_ALREADY_EXISTS_ERROR":
      case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
      case "PHONE_NUMBER_ALREADY_EXISTS_ERROR":
      case "PHONE_NUMBER_CHANGE_NOT_ALLOWED_ERROR":
      case "SIGN_IN_UP_NOT_ALLOWED":
        throw new AuthError(resp.status);
      case "UNKNOWN_USER_ID_ERROR":
        throw new AuthError("SUPERTOKENS_ID_WITH_NO_CORRESPONDING_SUPERTOKENS_USER");
      case "OK":
        return;
      default:
        throw new AuthError("UNKNOWN_ERROR");
    }
  }

  async getSupertokensUserInfo(supertokensId: string): Promise<STUser> {
    const user = await supertokens.getUser(supertokensId);
    if(!user) {
      throw new AuthError("SUPERTOKENS_ID_WITH_NO_CORRESPONDING_SUPERTOKENS_USER");
    }
    return user;
  }

  async getRecipeUserId(supertokensId: string): Promise<RecipeUserId> {
    const user = await this.getSupertokensUserInfo(supertokensId);
    const loginMethod = user.loginMethods.find((lm) => lm.recipeId === "passwordless");
    if(!loginMethod) {
      throw new Error("Failed to find the login method");
    }
    return loginMethod.recipeUserId;
  }
}
