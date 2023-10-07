import { NamedClassDeclaration } from "@amplication/code-gen-types";
import { namedTypes } from "ast-types";
import { visit } from "recast";
import { parse } from "@amplication/code-gen-utils"

export const addEmailPhoneNumberToDTO = (
    dto: NamedClassDeclaration
) => {
    let propsAlreadyExist = false;
    visit(dto, {
        visitClassProperty: function(path) {
            const prop = path.node;
            if(prop.key.type !== "Identifier") {
                return false;
            }
            const propName = prop.key.name;
            if(propName === "phoneNumber" || propName === "email") {
                propsAlreadyExist = true;
            }
            return false;
        }
    });
    if(propsAlreadyExist) {
        throw new Error("The phoneNumber/email field already exists in the auth entity's createInput DTO");
    }
    dto.body.body.push(emailProp());
    dto.body.body.push(phoneNumberProp());
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
