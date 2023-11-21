import {
  BuildLogger,
  CreateDTOsParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { parse } from "@amplication/code-gen-utils";
import { NamedClassDeclaration } from "@amplication/code-gen-types";
import { prettyCode } from "../../utils";
import SupertokensAuthPlugin from "../../index";
import { name } from "../../../package.json";

describe("Testing afterCreateDTOs for emailpassword recipe hook", () => {
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
            supertokensIdFieldName: "stId",
            recipe: {
              name: "emailpassword",
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
        //@ts-ignore
        TheEntity: {
          createInput: parse(createInputRaw).program
            .body[0] as NamedClassDeclaration,
          updateInput: parse(updateInputRaw).program
            .body[0] as NamedClassDeclaration,
          entity: parse(entityCode).program.body[0] as NamedClassDeclaration,
        },
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
    theEmail!: string;

    @ApiProperty({
        required: true,
        type: String,
    })
    @IsString()
    @Field(() => String)
    thePassword!: string;

    @ApiProperty({
        required: false,
        type: String,
    })
    @IsString()
    @IsOptional()
    @Field(() => String)
    firstName?: string;

    @ApiProperty({
        required: true,
        type: String,
    })
    @IsString()
    @Field(() => String)
    lastName!: string;

    @ApiProperty({
        required: true,
        type: String,
    })
    @IsString()
    @Field(() => String)
    stId!: string;

  @ApiProperty({
    required: true,
  })
  @IsJSONValue()
  @Field(() => GraphQLJSON)
  roles!: InputJsonValue;

  @ApiProperty({
    required: true,
    enum: EnumUserInterests,
    isArray: true,
  })
  @IsEnum(EnumUserInterests, {
    each: true,
  })
  @Field(() => [EnumUserInterests], {
    nullable: true,
  })
  interests!: Array<"programming" | "design">;

  @ApiProperty({
    required: true,
    enum: EnumUserPriority,
  })
  @IsEnum(EnumUserPriority)
  @Field(() => EnumUserPriority)
  priority!: "high" | "medium" | "low";

  @ApiProperty({
    required: true,
    type: Boolean,
  })
  @IsBoolean()
  @Field(() => Boolean)
  isCurious!: boolean;
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

  @ApiProperty({
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  @Field(() => String, {
    nullable: true,
  })
  stId?: string;
}
`;

const entityCode = `
@ObjectType()
class TheEntity {
  @ApiProperty({
    required: true,
    type: String,
  })
  @IsString()
  @Field(() => String)
  id!: string;

  @ApiProperty({
    required: true,
    type: String,
  })
  @IsString()
  @Field(() => String)
  theEmail!: string;

  @ApiProperty({
    required: true,
    type: String,
  })
  @IsString()
  @Field(() => String)
  thePassword!: string;
}
`;

const supertokensService = `
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import supertokens, { deleteUser, RecipeUserId, User as STUser } from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import Dashboard from "supertokens-node/recipe/dashboard";
import EmailPassword, { RecipeInterface } from "supertokens-node/recipe/emailpassword";
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
        EmailPassword.init({
          override: {
            functions: (originalImplementation: RecipeInterface): RecipeInterface => {
              return {
                ...originalImplementation,
                signUp: async function(input) {
                  let resp = await originalImplementation.signUp(input);
                  if(
                      resp.status === "OK" &&
                      resp.user.loginMethods.length === 1 &&
                      (!input.userContext || !input.userContext.skipDefaultPostUserSignUp)
                    ) {
                      userService.create({
                        data: {
                            stId: resp.user.id,
                            ...{
                              theEmail: "",
                              thePassword: "",
                              lastName: "",
                              roles: [],
                              interests: [],
                              priority: "high",
                              isCurious: false
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
                  const user = await userService.findOne({
                    where: {
                      stId: input.userId
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

  async getUserBySupertokensId(supertokensId: string): Promise<TheEntity | null> {
    return await this.userService.findOne({
      where: {
        stId: supertokensId
      }
    })
  }

  async createSupertokensUser(email: string, password: string): Promise<string> {
    const resp = await EmailPassword.signUp("public", email, password, {
      skipDefaultPostUserSignUp: true
    });
    if(resp.status === "OK") {
      return resp.user.id;
    } else if(resp.status === "EMAIL_ALREADY_EXISTS_ERROR") {
      throw new AuthError(resp.status);
    } else {
      throw new AuthError("UNKNOWN_ERROR")
    }
  }

  async deleteSupertokensUser(supertokensId: string): Promise<void> {
    const resp = await deleteUser(supertokensId);
    if(resp.status !== "OK") {
      throw new AuthError("UNKNOWN_ERROR");
    }
  }

  async updateSupertokensUser(recipeUserId: RecipeUserId, email?: string, password?: string): Promise<void> {
    const resp = await EmailPassword.updateEmailOrPassword({
      recipeUserId,
      email,
      password
    });
    switch(resp.status) {
      case "EMAIL_ALREADY_EXISTS_ERROR":
        throw new AuthError(resp.status);
      case "PASSWORD_POLICY_VIOLATED_ERROR":
        throw new AuthError("SUPERTOKENS_PASSWORD_POLICY_VIOLATED_ERROR");
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
    const loginMethod = user.loginMethods.find((lm) => lm.recipeId === "emailpassword");
    if(!loginMethod) {
      throw new Error("Failed to find the login method");
    }
    return loginMethod.recipeUserId;
  }
}
`;
