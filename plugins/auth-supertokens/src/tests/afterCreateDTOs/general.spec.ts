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

describe("Testing afterCreateDTOs hook", () => {
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
              name: "emailpassword",
              emailFieldName: "theEmail",
              passwordFieldName: "thePassword",
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
          createInput: parse(createInputRawBefore).program
            .body[0] as NamedClassDeclaration,
          updateInput: parse(updateInputRawBefore).program
            .body[0] as NamedClassDeclaration,
          entity: parse(entityCode).program.body[0] as NamedClassDeclaration,
        } as EntityEnumDTOs & EntityDTOs
      },
    };
  });
  it("should add the auth.service.ts to the auth directory", async () => {
    const moduleMap = await plugin.afterCreateDTOs(
      context,
      params,
      new ModuleMap(context.logger)
    );
    const expectedAuthServiceCode = prettyCode(authService);
    const code = prettyCode(moduleMap.get("/auth/auth.service.ts").code);
    expect(code).toStrictEqual(expectedAuthServiceCode);
  });
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
    theEmail!: string;

    @ApiProperty({
        required: true,
        type: String,
    })
    @IsString()
    @Field(() => String)
    thePassword!: string;

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
}
`;

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

`;
