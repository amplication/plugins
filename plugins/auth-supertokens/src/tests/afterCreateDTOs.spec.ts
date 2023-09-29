import { CreateDTOsParams, CreateEntityModuleParams, CreateServerParams, DsgContext, ModuleMap } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { parse } from "@amplication/code-gen-utils";
import { namedTypes } from "ast-types"
import { NamedClassDeclaration } from "@amplication/code-gen-types";
import * as recast from "recast"
import { prettyCode } from "../utils"
import SupertokensAuthPlugin from "../index";
import { print } from "@amplication/code-gen-utils";
import { name } from "../../package.json";

describe("Testing afterCreateEntityModule hook", () => {
    let plugin: SupertokensAuthPlugin;
    let context: DsgContext;
    let params: CreateDTOsParams;

    beforeEach(() => {
        plugin = new SupertokensAuthPlugin();
        context = mock<DsgContext>({
            pluginInstallations: [{ npm: name }],
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
                // updateInput are required for the test
                //@ts-ignore
                TheEntity: {
                    createInput: parse(createInputRawBefore).program.body[0] as NamedClassDeclaration,
                    updateInput: parse(updateInputRawBefore).program.body[0] as NamedClassDeclaration
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
