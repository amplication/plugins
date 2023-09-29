import { CreateDTOsParams, DsgContext, ModuleMap } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { parse } from "@amplication/code-gen-utils";
import { NamedClassDeclaration } from "@amplication/code-gen-types";
import { prettyCode } from "../utils"
import SupertokensAuthPlugin from "../index";
import { print } from "@amplication/code-gen-utils";
import { name } from "../../package.json";

describe("Testing afterCreateDTOs hook", () => {
    let plugin: SupertokensAuthPlugin;
    let context: DsgContext;
    let params: CreateDTOsParams;

    beforeEach(() => {
        plugin = new SupertokensAuthPlugin();
        context = mock<DsgContext>({
            pluginInstallations: [{
                npm: name,
                settings: { emailFieldName: "theEmail", passwordFieldName: "thePassword" }
            }],
            serverDirectories: {
                srcDirectory: "/",
                authDirectory: "/auth"
            },
            entities: [
                {
                    name: "TheEntity"
                }
            ],
            resourceInfo: {
                settings: {
                    authEntityName: "TheEntity"
                }
            }
        });
        params = {
            ...mock<CreateDTOsParams>(),
            dtos: {
                // Ignoring the rest of the fields because only the createInput and
                // updateInput and entity are required for the tests
                //@ts-ignore
                TheEntity: {
                    createInput: parse(createInputRawBefore).program.body[0] as NamedClassDeclaration,
                    updateInput: parse(updateInputRawBefore).program.body[0] as NamedClassDeclaration,
                    entity: parse(entityCode).program.body[0] as NamedClassDeclaration
                }
            }
        }
    });
    it(`should remove the supertokensId from the auth entity's UpdateInput DTO
        and make it optional in the CreateInput`, () => {
        const updatedParams = plugin.beforeCreateDTOs(context, params);
        const expectedUpdateInputCode = prettyCode(updateInputRawAfter);
        const expectedCreateInputCode = prettyCode(createInputRawAfter);

        const createInputCode = prettyCode(print(updatedParams.dtos.TheEntity.createInput).code);
        const updateInputCode = prettyCode(print(params.dtos.TheEntity.updateInput).code);

        expect(createInputCode).toStrictEqual(expectedCreateInputCode);
        expect(updateInputCode).toStrictEqual(expectedUpdateInputCode);
    });
    it("should add the supertokens.service.ts to the auth/supertokens directory", async () => {
        const moduleMap = await plugin.afterCreateDTOs(context, params, new ModuleMap(context.logger));
        const expectedSupertokensCode = prettyCode(supertokensService);
        const code = prettyCode(moduleMap.get("/auth/supertokens/supertokens.service.ts").code);
        expect(code).toStrictEqual(expectedSupertokensCode);
    });
    it("should add the auth.service.ts to the auth directory", async () => {
        const moduleMap = await plugin.afterCreateDTOs(context, params, new ModuleMap(context.logger));
        const expectedAuthServiceCode = prettyCode(authService);
        const code = prettyCode(moduleMap.get("/auth/auth.service.ts").code);
        expect(code).toStrictEqual(expectedAuthServiceCode);
    })
});

const createInputRawBefore = `
@InputType()
class TheEntityCreateInput {
    @ApiProperty({
        required: true,
        type: String,
    })
    @IsString()
    @Field(() => String)
    username!: string;

    @ApiProperty({
        required: true,
        type: String,
    })
    @IsString()
    @Field(() => String)
    supertokensId!: string;
}
`

const createInputRawAfter = `
@InputType()
class TheEntityCreateInput {
    @ApiProperty({
        required: true,
        type: String,
    })
    @IsString()
    @Field(() => String)
    username!: string;

    @ApiProperty({
        required: false,
        type: String,
    })
    @IsString()
    @Field(() => String)
    supertokensId?: string;
}
`

const updateInputRawBefore = `
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
  supertokensId?: string;
}
`

const updateInputRawAfter = `
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
`

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
  username!: string;
}
`;

const supertokensService = `
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import supertokens, { deleteUser } from "supertokens-node";
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
                      (!input.userContext || !input.userContext.skipDefaultPostUserSignUp)
                    ) {
                      userService.create({
                        data: {
                            theEmail: input.email,
                            thePassword: input.password,
                            supertokensId: resp.user.id,
                            roles: []
                        }
                      })
                  }
                  return resp;
                }
              }
            }
          }
        }),
        Session.init(),
        Dashboard.init(),
      ],
    });
  }

  async getUserBySupertokensId(supertokensId: string): Promise<TheEntity | null> {
    return await this.userService.findOne({
      where: {
        supertokensId: supertokensId
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

  async updateSupertokensEmailPassword(supertokensId: string, email?: string, password?: string): Promise<void> {
    const resp = await EmailPassword.updateEmailOrPassword({
      userId: supertokensId,
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
}
`;

const authService = `
import { Injectable } from "@nestjs/common";
import { SupertokensService } from "./supertokens/supertokens.service";
import { ConfigService } from "@nestjs/config";
import { TheEntityService } from "../theEntity/theEntity.service";

@Injectable()
export class AuthService extends SupertokensService {
  constructor(
    protected readonly configService: ConfigService,
    protected readonly userService: TheEntityService) {
    super(configService, userService);
  }
}

`
