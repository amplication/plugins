import { NamedClassDeclaration } from "@amplication/code-gen-types";
import { namedTypes } from "ast-types";
import { visit } from "recast";
import { parse } from "@amplication/code-gen-utils"

export const addEmailPropertyToDTO = (
    dto: NamedClassDeclaration
) => {
    addPropertyToDTO(dto, "email", emailProp());
}

export const addPhoneNumberPropertyToDTO = (
    dto: NamedClassDeclaration
) => {
    addPropertyToDTO(dto, "phoneNumber", phoneNumberProp());
}

export const addThirdPartyIdPropertyToDTO = (
    dto: NamedClassDeclaration
) => {
    addPropertyToDTO(dto, "thirdPartyId", thirdPartyIdProp());
}

export const addPasswordPropertyToDTO = (
    dto: NamedClassDeclaration
) => {
    addPropertyToDTO(dto, "password", passwordProp());
}

export const addPropertyToDTO = (
    dto: NamedClassDeclaration,
    propName: string,
    prop: namedTypes.ClassProperty
) => {
    let propAlreadyExists = false;
    visit(dto, {
        visitClassProperty: function(path) {
            const prop = path.node;
            if(prop.key.type !== "Identifier") {
                return false;
            }
            if(propName === prop.key.name) {
                propAlreadyExists = true;
            }
            return false;
        }
    });
    if(propAlreadyExists) {
        throw new Error(`The ${propName} property already exists in the auth entity's createInput DTO`);
    }
    dto.body.body.push(prop);
}

const phoneNumberProp = (): namedTypes.ClassProperty => {
    const code = parse(`
        class Cls {
            @ApiProperty({
                required: false,
                type: String,
            })
            @IsString()
            @IsOptional()
            phoneNumber?: string;
        }
    `);
    const cls = code.program.body[0] as NamedClassDeclaration;
    const prop = cls.body.body[0] as namedTypes.ClassProperty;
    return prop;
}

const emailProp = (): namedTypes.ClassProperty => {
    const code = parse(`
        class Cls {
            @ApiProperty({
                required: false,
                type: String,
            })
            @IsString()
            @IsOptional()
            email?: string;
        }
    `);
    const cls = code.program.body[0] as NamedClassDeclaration;
    const prop = cls.body.body[0] as namedTypes.ClassProperty;
    return prop;
}

const thirdPartyIdProp = (): namedTypes.ClassProperty => {
    const code = parse(`
        class Cls {
            @ApiProperty({
                required: false,
                type: String,
            })
            @IsString()
            @IsOptional()
            thirdPartyId?: string;
        }
    `);
    const cls = code.program.body[0] as NamedClassDeclaration;
    const prop = cls.body.body[0] as namedTypes.ClassProperty;
    return prop;
}

const passwordProp = (): namedTypes.ClassProperty => {
    const code = parse(`
        class Cls {
            @ApiProperty({
                required: false,
                type: String,
            })
            @IsString()
            @IsOptional()
            password?: string;
        }
    `);
    const cls = code.program.body[0] as NamedClassDeclaration;
    const prop = cls.body.body[0] as namedTypes.ClassProperty;
    return prop;
}
