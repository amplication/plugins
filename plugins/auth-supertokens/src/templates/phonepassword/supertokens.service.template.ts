import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import supertokens, {
  deleteUser,
  RecipeUserId,
  User as STUser,
} from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import Dashboard from "supertokens-node/recipe/dashboard";
import Passwordless from "supertokens-node/recipe/passwordless";
import EmailPassword, {
  RecipeInterface,
} from "supertokens-node/recipe/emailpassword";
import { parsePhoneNumber } from "libphonenumber-js";
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
        EmailPassword.init({
          signUpFeature: {
            formFields: [
              {
                id: "email",
                validate: async (value) => {
                  if (typeof value !== "string") {
                    return "Phone number is invalid";
                  }
                  const parsedPhoneNumber = parsePhoneNumber(value);
                  if (
                    parsedPhoneNumber === undefined ||
                    !parsedPhoneNumber.isValid()
                  ) {
                    return "Phone number is invalid";
                  }
                },
              },
            ],
          },
          emailDelivery: {
            override: (originalImplementation) => {
              return {
                ...originalImplementation,
                sendEmail: async function (input) {
                  if (input.type === "PASSWORD_RESET") {
                    // TODO: Send SMS to user.email (it's a phone number)
                    // console.log("The user's phone number:", input.user.email);
                    // console.log(
                    //   "The password reset link:",
                    //   input.passwordResetLink,
                    // );
                  } else {
                    return originalImplementation.sendEmail(input);
                  }
                },
              };
            },
          },
          override: {
            functions: (
              originalImplementation: RecipeInterface,
            ): RecipeInterface => {
              return {
                ...originalImplementation,
                signUp: async function (input) {
                  const resp = await originalImplementation.signUp(input);
                  if (
                    resp.status === "OK" &&
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
                  if (input.userContext.session !== undefined) {
                    return input.userContext.session;
                  }
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
                      ...PhoneVerifiedClaim.build(
                        input.userId,
                        input.recipeUserId,
                        input.tenantId,
                        input.userContext,
                      ),
                      phoneNumber: userInfo?.emails[0],
                      userId: user.id,
                    },
                  });
                },
                getGlobalClaimValidators: (input) => [
                  ...input.claimValidatorsAddedByOtherRecipes,
                  PhoneVerifiedClaim.validators.hasValue(true),
                ],
              };
            },
          },
        }),
        Passwordless.init({
          contactMethod: "PHONE",
          flowType: "USER_INPUT_CODE",
          override: {
            apis: (originalImplementation) => {
              return {
                ...originalImplementation,
                createCodePOST: async function (input) {
                  if (originalImplementation.createCodePOST === undefined) {
                    throw new Error(
                      "original implementation's createCodePOST is undefined",
                    );
                  }
                  const session = await Session.getSession(
                    input.options.req,
                    input.options.res,
                    {
                      overrideGlobalClaimValidators: () => [],
                    },
                  );
                  const phoneNumber: string =
                    session.getAccessTokenPayload().phoneNumber;
                  if (
                    !("phoneNumber" in input) ||
                    input.phoneNumber !== phoneNumber
                  ) {
                    throw new Error("phone number doesn't match");
                  }
                  return originalImplementation.createCodePOST(input);
                },
                consumeCodePOST: async function (input) {
                  if (originalImplementation.consumeCodePOST === undefined) {
                    throw new Error(
                      "original implementation's consumeCodePOST is undefined",
                    );
                  }
                  const session = await Session.getSession(
                    input.options.req,
                    input.options.res,
                    {
                      overrideGlobalClaimValidators: () => [],
                    },
                  );
                  input.userContext.session = session;
                  const resp =
                    await originalImplementation.consumeCodePOST(input);
                  if (resp.status === "OK") {
                    await session.setClaimValue(
                      PhoneVerifiedClaim,
                      true,
                      input.userContext,
                    );
                  }
                  return resp;
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
    password: string,
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
    password?: string,
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
          "SUPERTOKENS_ID_WITH_NO_CORRESPONDING_SUPERTOKENS_USER",
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
