import { DsgContext, ModuleMap, NamedClassDeclaration } from "@amplication/code-gen-types";
import { resolve, join, relative } from "path";
import { readFile, print, appendImports, parse } from "@amplication/code-gen-utils";
import * as constants from "../constants";
import { Settings, ThirdPartyProviderSettings, ThirdPartyRecipeSettings } from "../types";
import { SUPERTOKENS_ID_FIELD_NAME } from "../constants";
import { namedTypes, builders } from "ast-types";
import { interpolate } from "../utils";
import { camelCase } from "lodash";
import { visit } from "recast";


export const createSupertokensService = async (
    recipeSettings: Settings["recipe"],
    authDirectory: string,
    srcDirectory: string,
    authEntityName: string,
    modules: ModuleMap,
    authEntityCreateInput: NamedClassDeclaration
) => {
    const createFunc = baseCreateSupertokensService(
        authDirectory,
        srcDirectory,
        authEntityName,
        modules,
        authEntityCreateInput
    );
    if(recipeSettings.name === "emailpassword") {
        const { emailFieldName, passwordFieldName } = recipeSettings;
        await createFunc(
            resolve(constants.templatesPath, "emailpassword"),
            {
                EMAIL_FIELD_NAME: builders.identifier(emailFieldName),
                PASSWORD_FIELD_NAME: builders.identifier(passwordFieldName),
            },
            [emailFieldName, passwordFieldName]
        );
    } else if(recipeSettings.name === "passwordless") {
        await createFunc(
            resolve(constants.templatesPath, "passwordless"),
            {
                FLOW_TYPE: builders.stringLiteral(recipeSettings.flowType),
                CONTACT_METHOD: builders.stringLiteral(recipeSettings.contactMethod)
            },
            []
        );
    } else if(recipeSettings.name === "thirdparty") {
        await createFunc(
            resolve(constants.templatesPath, "thirdparty"),
            {
                THIRD_PARTY_PROVIDERS: thirdPartyProvidersArray(recipeSettings)
            },
            []
        )
    } else if(recipeSettings.name === "thirdpartyemailpassword") {
        await createFunc(
            resolve(constants.templatesPath, "thirdpartyemailpassword"),
            {
                THIRD_PARTY_PROVIDERS: thirdPartyProvidersArray(recipeSettings)
            },
            []
        )
    } else if(recipeSettings.name === "thirdpartypasswordless") {
        await createFunc(
            resolve(constants.templatesPath, "thirdpartypasswordless"),
            {
                FLOW_TYPE: builders.stringLiteral(recipeSettings.flowType),
                CONTACT_METHOD: builders.stringLiteral(recipeSettings.contactMethod),
                THIRD_PARTY_PROVIDERS: thirdPartyProvidersArray(recipeSettings)
            },
            []
        )
    }
}

const baseCreateSupertokensService = (
    authDirectory: string,
    srcDirectory: string,
    authEntityName: string,
    modules: ModuleMap,
    authEntityCreateInput: NamedClassDeclaration
) => {
    return async (
        templateDir: string,
        baseTemplateMapping: {[key: string]: namedTypes.ASTNode},
        skipDefaultCreation: string[]
    ) => {
        const templatePath = resolve(templateDir, "supertokens.service.template.ts");
        const template = await readFile(templatePath);
        const templateMapping = {
            ...baseTemplateMapping,
            SUPERTOKENS_ID_FIELD_NAME: builders.identifier(constants.SUPERTOKENS_ID_FIELD_NAME),
            AUTH_ENTITY_SERVICE_ID: getAuthEntityServiceId(authEntityName),
            AUTH_ENTITY_ID: builders.identifier(authEntityName),
            DEFAULT_FIELD_VALUES: getDefaultCreateValues(
                authEntityCreateInput,
                skipDefaultCreation
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
}

const getDefaultCreateValues = (
    createInput: NamedClassDeclaration,
    skipDefaultCreation: string[]
): namedTypes.ObjectExpression => {
    const defaultValues: namedTypes.ObjectProperty[] = [];
    visit(createInput, {
        visitClassProperty: function(path) {
            const prop = path.node;
            //@ts-ignore
            const propName = prop.key.name;
            if(propName !== SUPERTOKENS_ID_FIELD_NAME && !skipDefaultCreation.includes(propName)
                //@ts-ignore
                && !prop.optional) {
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

const thirdPartyProvidersArray = (recipeSettings: Settings["recipe"]) => {
    if(recipeSettings.name !== "thirdparty"
        && recipeSettings.name !== "thirdpartyemailpassword"
        && recipeSettings.name !== "thirdpartypasswordless") {
        throw new Error("Not a third party recipe");
    }
    const { apple, twitter, google, github } = recipeSettings;
    if(!apple && !twitter && !google && !github) {
        throw new Error("At least one provider's configuration must be provided");
    }
    const providerNames: (keyof ThirdPartyRecipeSettings)[] = ["apple", "twitter", "google", "github"];
    const providerSettings = Object.keys(recipeSettings).map((sk) => {
        const settingKey = sk as keyof ThirdPartyRecipeSettings;
        if(providerNames.includes(settingKey)) {
            const providerSetting = recipeSettings[settingKey] as ThirdPartyProviderSettings
            return { name: settingKey, ...providerSetting }
        }
    }).filter((setting) => setting);
    const providersArray = [];
    for(const providerSetting of providerSettings) {
        if(!providerSetting) {
            continue;
        }
        const configObj = parse(`obj = {
            config: {
                thirdPartyId: "${providerSetting.name}",
                clients: [{
                    clientId: "${providerSetting.clientId}",
                    ${providerSetting.clientSecret ? 
                        `clientSecret: "${providerSetting.clientSecret}",`
                        : ""}
                    ${providerSetting.additionalConfig ?
                        `additionalConfig: ${JSON.stringify(providerSetting.additionalConfig)}`
                        : ""}
                }]
            }
        }`);
        const stmt = configObj.program.body[0] as namedTypes.ExpressionStatement;
        const assignment = stmt.expression as namedTypes.AssignmentExpression;
        providersArray.push(assignment.right);
    }
    return builders.arrayExpression(providersArray);
}
