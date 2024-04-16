import {
  BuildLogger,
  CreateDTOsParams,
  DsgContext,
  EntityDTOs,
  EntityEnumDTOs,
  ModuleMap,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { parse } from "@amplication/code-gen-utils";
import { NamedClassDeclaration } from "@amplication/code-gen-types";
import { prettyCode } from "../../utils";
import SupertokensAuthPlugin from "../../index";
import { name } from "../../../package.json";

describe("Testing afterCreateDTOs for passwordless recipe", () => {
  let plugin: SupertokensAuthPlugin;
  let context: DsgContext;
  let params: CreateDTOsParams;

  beforeEach(() => {
    plugin = new SupertokensAuthPlugin();
    context = mock<DsgContext>({
      pluginInstallations: [
        {
          npm: name,
          settings: {
            recipe: {
              name: "passwordless",
              flowType: "MAGIC_LINK",
              contactMethod: "PHONE",
            },
          },
        },
      ],
      serverDirectories: {
        srcDirectory: "/",
        authDirectory: "/auth",
      },
      entities: [
        {
          name: "TheEntity",
        },
      ],
      resourceInfo: {
        settings: {
          authEntityName: "TheEntity",
        },
      },
      logger: mock<BuildLogger>(),
    });
    params = {
      ...mock<CreateDTOsParams>(),
      dtos: {
        // Ignoring the rest of the fields because only the createInput and
        // updateInput and entity are required for the tests
        TheEntity: {
          createInput: parse(createInputRaw).program
            .body[0] as NamedClassDeclaration,
          updateInput: parse(updateInputRaw).program
            .body[0] as NamedClassDeclaration,
          entity: parse(entityCode).program.body[0] as NamedClassDeclaration,
        } as EntityEnumDTOs & EntityDTOs,
      },
    };
  });
  it("should add the supertokens.service.ts to the auth/supertokens directory", async () => {
    const moduleMap = await plugin.afterCreateDTOs(
      context,
      params,
      new ModuleMap(context.logger)
    );
    const expectedSupertokensCode = prettyCode(supertokensService);
    const code = prettyCode(
      moduleMap.get("/auth/supertokens/supertokens.service.ts").code
    );
    expect(code).toStrictEqual(expectedSupertokensCode);
  });
});

const createInputRaw = `
@InputType()
class TheEntityCreateInput {
    @ApiProperty({
        required: true,
        type: String,
    })
    @IsString()
    @Field(() => String)
    supertokensId!: string;

    @ApiProperty({
        required: true,
    })
    @IsJSONValue()
    @Field(() => GraphQLJSON)
    roles!: InputJsonValue;

  @ApiProperty({
        required: true,
        type: String,
    })
    @IsString()
    @Field(() => String)
    firstName!: string;
}
`;

const updateInputRaw = `
@InputType()
class UserUpdateInput {
    @ApiProperty({
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  @Field(() => String, {
    nullable: true,
  })
  username?: string;
}
`;

const entityCode = `
@ObjectType()
class TheEntity {}
`;

const supertokensService = `
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import supertokens, { deleteUser, RecipeUserId, User as STUser } from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import Dashboard from "supertokens-node/recipe/dashboard";
import Passwordless from "supertokens-node/recipe/passwordless";
import { generateSupertokensOptions } from "./generateSupertokensOptions";
import { AuthError } from "./auth.error";
import { TheEntityService } from "../../theEntity/theEntity.service";
import { TheEntity } from "../../theEntity/base/TheEntity";

@Injectable()
export class SupertokensService {
  constructor(
    protected readonly configService: ConfigService,
    protected readonly userService: TheEntityService
  ) {
    supertokens.init({
      ...generateSupertokensOptions(configService),
      recipeList: [
        Passwordless.init({
          flowType: "MAGIC_LINK",
          contactMethod: "PHONE",
          override: {
            functions: (originalImplementation) => {
              return {
                ...originalImplementation,
                consumeCode: async (input) => {
                  const resp = await originalImplementation.consumeCode(input);
                  if(
                      resp.status === "OK" &&
                      resp.createdNewRecipeUser &&
                      resp.user.loginMethods.length === 1 &&
                      (!input.userContext || !input.userContext.skipDefaultPostUserSignUp)
                    ) {
                      userService.createUser({
                        data: {
                          supertokensId: resp.user.id,
                          ...{
                              roles: [],
                              firstName: ""
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
                      phoneNumber: userInfo?.phoneNumbers[0],
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

  async getUserBySupertokensId(supertokensId: string): Promise<TheEntity | null> {
    return await this.userService.user({
      where: {
        supertokensId: supertokensId
      }
    })
  }

  async createSupertokensUser(
    email: string | undefined,
    phoneNumber: string | undefined
  ): Promise<string> {
    let userInfo;
    if(email) {
      userInfo = { email };
    } else if(phoneNumber) {
      userInfo  = { phoneNumber };
    } else {
      throw new Error("An email or a phone number must be supplied to create a user");
    }
    const resp = await Passwordless.signInUp({ ...userInfo, tenantId: "public", userContext: {
      skipDefaultPostUserSignUp: true
    }});
    if (resp.status === "OK") {
      return resp.user.id;
    } else {
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
    recipeUserId: RecipeUserId,
    email?: string,
    phoneNumber?: string
  ): Promise<void> {
    const resp = await Passwordless.updateUser({
      recipeUserId,
      email,
      phoneNumber
    })
    switch (resp.status) {
      case "EMAIL_ALREADY_EXISTS_ERROR":
      case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
      case "PHONE_NUMBER_ALREADY_EXISTS_ERROR":
      case "PHONE_NUMBER_CHANGE_NOT_ALLOWED_ERROR":
        throw new AuthError(resp.status);
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

`;
