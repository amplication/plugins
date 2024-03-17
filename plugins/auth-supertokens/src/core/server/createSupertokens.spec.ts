import {
  BuildLogger,
  ModuleMap,
  NamedClassDeclaration,
} from "@amplication/code-gen-types";
import { parse } from "@amplication/code-gen-utils";
import { mock } from "jest-mock-extended";
import { Settings } from "../../types";
import { prettyCode } from "../../utils";
import { createSupertokensService } from "./createSupertokensService";

const thirdPartyRecipeSettings: Settings["recipe"] = {
  name: "thirdparty",
  google: {
    clientId: "googleClientId",
    clientSecret: "googleClientSecret",
  },
  github: {
    clientId: "githubClientId",
    clientSecret: "githubClientSecret",
  },
  apple: {
    clientId: "appleClientId",
    additionalConfig: {
      keyId: "appleKeyId",
      privateKey: "applePrivateKey",
      teamId: "appleTeamId",
    },
  },
};

const authDirectory = "src/auth";
const srcDirectory = "src";
const authEntityName = "User";
const authEntityCreateInputRawCode = `
@InputType()
class UserCreateInput {
  @ApiProperty({
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  @Field(() => String, {
    nullable: true,
  })
  firstName?: string | null;

  @ApiProperty({
    required: true,
    type: String,
  })
  @IsString()
  @Field(() => String)
  lastName!: string;

  @ApiProperty({
    required: true,
  })
  @IsJSONValue()
  @Field(() => GraphQLJSON)
  roles!: InputJsonValue;
}
`;
const authEntityCreateInput = parse(authEntityCreateInputRawCode).program
  .body[0] as NamedClassDeclaration;

describe("createSupertokensService tests", () => {
  let modules: ModuleMap;

  beforeEach(() => {
    modules = new ModuleMap(mock<BuildLogger>());
  });

  it("should generate correct service when recipe is thirdparty", async () => {
    await createSupertokensService(
      thirdPartyRecipeSettings,
      authDirectory,
      srcDirectory,
      authEntityName,
      modules,
      authEntityCreateInput,
      "SuperTokensId",
      mock<BuildLogger>()
    );
    const code = prettyCode(
      modules.get(`${authDirectory}/supertokens/supertokens.service.ts`).code
    );
    const expectedCode = prettyCode(expectedThirdPartySupertokensRawCode);
    expect(code).toStrictEqual(expectedCode);
  });
});

const expectedThirdPartySupertokensRawCode = `
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import supertokens, {
  deleteUser,
  RecipeUserId,
  User as STUser,
} from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import Dashboard from "supertokens-node/recipe/dashboard";
import ThirdParty from 'supertokens-node/recipe/thirdparty';
import { generateSupertokensOptions } from "./generateSupertokensOptions";
import { AuthError } from "./auth.error";

import { UserService } from "../../user/user.service";
import { User } from "../../user/base/User";

@Injectable()
export class SupertokensService {
  constructor(
    protected readonly configService: ConfigService,
    protected readonly userService: UserService
  ) {
    supertokens.init({
      ...generateSupertokensOptions(configService),
      recipeList: [
        ThirdParty.init({
          signInAndUpFeature: {
              providers: [{
                  config: {
                      thirdPartyId: "google",
                      clients: [{
                          clientId: "googleClientId",
                          clientSecret: "googleClientSecret"
                      }]
                  }
              }, {
                  config: {
                      thirdPartyId: "github",
                      clients: [{
                          clientId: "githubClientId",
                          clientSecret: "githubClientSecret"
                      }]
                  }
              }, {
                config: {
                  thirdPartyId: "apple",
                  clients: [{
                    clientId: "appleClientId",
                    additionalConfig: {
                      "keyId": "appleKeyId",
                      "privateKey": "applePrivateKey",
                      "teamId": "appleTeamId",
                    }
                  }]
                }
              }],
          },
          override: {
            functions: (originalImplementation) => {
                return {
                  ...originalImplementation,
                  signInUp: async function (input) {
                      const resp = await originalImplementation.signInUp(input);

                      if (
                        resp.status === "OK" &&
                        resp.createdNewRecipeUser &&
                        resp.user.loginMethods.length === 1 &&
                        (!input.userContext || !input.userContext.skipDefaultPostUserSignUp)
                      ) {
                        userService.createUser({
                          data: {
                            SuperTokensId: resp.user.id,
                            ...{
                              lastName: "",
                              roles: []
                            }
                          }
                        })
                      }
                      return resp;
                  }
                }
              }
          }
        }),
        Session.init({
          override: {
            functions: (originalImplementation) => {
              return {
                ...originalImplementation,
                createNewSession: async function(input) {
                  const user = await userService.user({
                    where: {
                      SuperTokensId: input.userId
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

  async getUserBySupertokensId(supertokensId: string): Promise<User | null> {
    return await this.userService.user({
      where: {
        SuperTokensId: supertokensId,
      },
    });
  }

  async createSupertokensUser(
    email: string,
    thirdPartyId: string
  ): Promise<string> {
    const resp = await ThirdParty.manuallyCreateOrUpdateUser("public", thirdPartyId, "", email, false, {
      skipDefaultPostUserSignUp: true
    });
    switch(resp.status) {
      case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
      case "SIGN_IN_UP_NOT_ALLOWED":
        throw new AuthError(resp.status)
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
    supertokensId: string
  ): Promise<void> {
    if(!email || !thirdPartyId) {
      throw new Error("An email and third party ID must be supplied to update a user");
    }
    const user = await this.getSupertokensUserInfo(supertokensId);
    const thirdPartyData = user.thirdParty.find((tp) => tp.id === thirdPartyId);
    if(!thirdPartyData) {
      throw new Error(\`The user doesn't have a third party login with \${thirdPartyId}\`);
    }
    const thirdPartyMethod = user.loginMethods.find((lm) => lm.recipeId === "thirdparty");
    if(thirdPartyMethod === undefined) {
      throw new Error("Failed to find information on the user's third party login");
    }
    const resp = await ThirdParty.manuallyCreateOrUpdateUser("public", thirdPartyId, thirdPartyData.userId,
      email, thirdPartyMethod.verified);
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
        "SUPERTOKENS_ID_WITH_NO_CORRESPONDING_SUPERTOKENS_USER"
      );
    }
    return user;
  }

  async getRecipeUserId(supertokensId: string): Promise<RecipeUserId> {
    const user = await this.getSupertokensUserInfo(supertokensId);
    const loginMethod = user.loginMethods.find(
      (lm) => lm.recipeId === "thirdparty"
    );
    if (!loginMethod) {
      throw new Error("Failed to find the login method");
    }
    return loginMethod.recipeUserId;
  }
}

`;
