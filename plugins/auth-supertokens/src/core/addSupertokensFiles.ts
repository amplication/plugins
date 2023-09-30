import { DsgContext, ModuleMap, NamedClassDeclaration } from "@amplication/code-gen-types";
import { resolve, join, relative } from "path";
import { readFile, print, appendImports } from "@amplication/code-gen-utils";
import * as constants from "../constants";
import { Settings } from "../types";
import { SUPERTOKENS_ID_FIELD_NAME } from "../constants";
import { namedTypes, builders } from "ast-types";
import { interpolate } from "../utils";
import { camelCase } from "lodash";
import { visit } from "recast";

export const addSupertokensFiles = async (context: DsgContext, modules: ModuleMap, settings: Settings) => {
    const { authDirectory, srcDirectory } = context.serverDirectories;

    const unneededInAuth = [
      "token.service.ts",
      "LoginArgs.ts",
      "ITokenService.ts",
      "IAuthStrategy.ts",
      "Credentials.ts",
      "constants.ts",
      "auth.service.ts",
      "auth.service.spec.ts",
      "auth.controller.ts",
      "auth.resolver.ts"
    ];

    const newModules = new ModuleMap(context.logger);

    for(const module of modules.modules()) {
      if(unneededInAuth.find((filename) => `${authDirectory}/${filename}` === module.path)) {
        continue;
      }
      if(module.path === `${srcDirectory}/tests/auth/constants.ts`) {
        continue;
      }
      newModules.set(module);
    }

    const fileNames = [
      "auth.filter.ts",
      "auth.guard.ts",
      "auth.middleware.ts",
      "config.interface.ts",
      "generateSupertokensOptions.ts",
      "session.decorator.ts",
      "auth.error.ts"
    ];

    for(const name of fileNames) {
      const filePath = resolve(constants.staticsPath, "supertokens", name);
      const file = await readFile(filePath);
      await newModules.set({
        code: print(file).code,
        path: join(authDirectory, "supertokens", name)
      });
    }

    const authGuardFileName = "defaultAuth.guard.ts";
    const filePath = resolve(constants.staticsPath, authGuardFileName);
    const file = await readFile(filePath);
    await newModules.set({
        path: join(authDirectory, authGuardFileName),
        code: print(file).code
    });

    return newModules;
}

export const createSupertokensService = async (
    settings: Settings,
    authDirectory: string,
    srcDirectory: string,
    authEntityName: string,
    modules: ModuleMap,
    authEntityCreateInput: NamedClassDeclaration
) => {
    const templatePath = resolve(constants.templatesPath, "supertokens.service.template.ts");
    const template = await readFile(templatePath);
    const templateMapping = {
        EMAIL_FIELD_NAME: builders.identifier(settings.emailFieldName),
        PASSWORD_FIELD_NAME: builders.identifier(settings.passwordFieldName),
        SUPERTOKENS_ID_FIELD_NAME: builders.identifier(constants.SUPERTOKENS_ID_FIELD_NAME),
        AUTH_ENTITY_SERVICE_ID: getAuthEntityServiceId(authEntityName),
        AUTH_ENTITY_ID: builders.identifier(authEntityName),
        DEFAULT_FIELD_VALUES: getDefaultCreateValues(
            authEntityCreateInput,
            settings.emailFieldName,
            settings.passwordFieldName
        )
    }
    appendImports(template, [
        authEntityServiceImport(srcDirectory, authDirectory, authEntityName),
        authEntityImport(srcDirectory, authDirectory, authEntityName)
    ])
    interpolate(template, templateMapping);
    modules.set({
        path: join(authDirectory, "supertokens", "supertokens.service.ts"),
        code: print(template).code
    })
}

const getDefaultCreateValues = (
    createInput: NamedClassDeclaration,
    emailFieldName: string,
    passwordFieldName: string
): namedTypes.ObjectExpression => {
    const defaultValues: namedTypes.ObjectProperty[] = [];
    visit(createInput, {
        visitClassProperty: function(path) {
            const prop = path.node;
            //@ts-ignore
            const propName = prop.key.name;
            if(propName !== SUPERTOKENS_ID_FIELD_NAME && propName !== emailFieldName
                //@ts-ignore
                && propName !== passwordFieldName && !prop.optional) {
                    if(!prop.typeAnnotation) {
                        throw new Error("Failed to find the type annotation of a property");
                    }
                    const propType = prop.typeAnnotation.typeAnnotation;
                    if(!propType || !propType.type) {
                        throw new Error(`Failed to find the type annotation of the auth entity create input property: ${propName}`)
                    }
                    if(propName === "roles") {
                        defaultValues.push(builders.objectProperty(
                            builders.identifier("roles"),
                            builders.arrayExpression([])
                        ));
                    } else {
                        defaultValues.push(builders.objectProperty(
                            builders.identifier(propName),
                            //@ts-ignore
                            getDefaultValueForType(propType)
                        ))
                    }
            }
            return false;
        }
    })
    return builders.objectExpression(defaultValues);
}

const getDefaultValueForType = (propType: namedTypes.TSTypeAnnotation["typeAnnotation"]): any => {
    switch(propType.type) {
        case "TSArrayType":
            return builders.arrayExpression([])
        case "TSBigIntKeyword":
            return builders.numericLiteral(0)
        case "TSBooleanKeyword":
            return builders.booleanLiteral(false)
        case "TSNullKeyword":
            return builders.nullLiteral()
        case "TSStringKeyword":
            return builders.stringLiteral("")
        case "TSNumberKeyword":
            return builders.numericLiteral(0)
        case "TSObjectKeyword":
            return builders.objectExpression([])
        case "TSLiteralType":
            const lit = propType.literal;
            switch(lit.type) {
                case "BooleanLiteral":
                    return builders.booleanLiteral(lit.value)
                case "NumericLiteral":
                    return builders.numericLiteral(lit.value)
                case "StringLiteral":
                    return builders.stringLiteral(lit.value)
                case "TemplateLiteral":
                    return builders.templateLiteral(lit.quasis, lit.expressions)
                case "UnaryExpression":
                    return builders.unaryExpression(lit.operator, lit.argument, lit.prefix)
                default:
                    //@ts-ignore
                    throw new Error(`Can't figure out the default value for literal type ${lit.type}`);
            }
        case "TSTypeReference":
            const name = propType.typeName;
            if(name.type !== "Identifier") {
                throw new Error(`Can't figure out default value for property with type ${propType.type}: ${name}`);
            }
            switch(name.name) {
                case "Date":
                    return builders.newExpression(builders.identifier("Date"), [])
                case "InputJsonValue":
                    return builders.objectExpression([])
                case "Decimal":
                case "bigint":
                case "GraphQLBigInt":
                    return builders.numericLiteral(0)
                case "Array":
                    return builders.arrayExpression([])
                default:
                    throw new Error(`Can't figure out default value for property with type ${propType.type}: ${name.name}`);
            }
        case "TSUnionType":
            return getDefaultValueForType(propType.types[0])
        default:
            throw new Error(`Can't figure out default value for property with type ${propType.type}`);
    }
}

const getAuthEntityServiceId = (authEntityName: string): namedTypes.Identifier => {
    return builders.identifier(`${authEntityName}Service`)
}

const getAuthEntityIdPath = (
    authEntityName: string,
    srcDirectory: string,
    authDirectory: string
): namedTypes.StringLiteral => {
    const entityPath = `${srcDirectory}/${camelCase(authEntityName)}/base/${authEntityName}`;
    const supertokensDir = `${authDirectory}/supertokens`;
    return builders.stringLiteral(relative(supertokensDir, entityPath));
}

const getAuthEntityServicePath = (
    srcDirectory: string,
    authDirectory: string,
    authEntityName: string
): namedTypes.StringLiteral => {
    const servicePath = `${srcDirectory}/${camelCase(authEntityName)}/${camelCase(authEntityName)}.service`;
    const supertokensDir = `${authDirectory}/supertokens`;
    return builders.stringLiteral(relative(supertokensDir, servicePath));
}

const authEntityServiceImport = (
    srcDirectory: string,
    authDirectory: string,
    authEntityName: string
): namedTypes.ImportDeclaration => {
    return builders.importDeclaration([
        builders.importSpecifier(getAuthEntityServiceId(authEntityName))
    ], getAuthEntityServicePath(srcDirectory, authDirectory, authEntityName));
}

const authEntityImport = (
    srcDirectory: string,
    authDirectory: string,
    authEntityName: string
): namedTypes.ImportDeclaration => {
    return builders.importDeclaration([
        builders.importSpecifier(builders.identifier(authEntityName))
    ], getAuthEntityIdPath(authEntityName, srcDirectory, authDirectory))
}
