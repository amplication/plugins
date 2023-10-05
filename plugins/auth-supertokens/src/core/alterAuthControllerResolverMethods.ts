import { CreateEntityControllerBaseParams, CreateEntityResolverBaseParams } from "@amplication/code-gen-types";
import { appendImports, parse } from "@amplication/code-gen-utils";
import { builders, namedTypes } from "ast-types";
import { SUPERTOKENS_ID_FIELD_NAME } from "../constants";
import { Settings } from "../types";
import { ExpressionKind } from "ast-types/gen/kinds";
import { visit } from "recast";

const newMapping = (oldMapping: {[key: string]: string}, settings: Settings): any => ({
    ...oldMapping,
    SUPERTOKENS_ID_FIELD_NAME: builders.identifier(SUPERTOKENS_ID_FIELD_NAME),
    EMAIL_FIELD_NAME: builders.identifier(settings.emailFieldName),
    PASSWORD_FIELD_NAME: builders.identifier(settings.passwordFieldName)
})

export const alterAuthControllerBaseMethods = (
    eventParams: CreateEntityControllerBaseParams,
    settings: Settings
) => {
    const { template, templateMapping } = eventParams;
    eventParams.templateMapping = newMapping(templateMapping, settings);
    appendImports(template, [
        isInstanceImport(),
        authErrorImport()
    ])
    visit(template, {
        visitClassMethod: function(path) {
            const method = path.node;
            if(method.key.type !== "Identifier") {
                return false;
            }
            switch(method.key.name) {
                case "create":
                    method.body = extractFuncStmts(newCreateEntityFuncRaw);
                    return false;
                case "update":
                    method.body = extractFuncStmts(newUpdateEntityFuncRaw);
                    return false;
                case "delete":
                    method.body = extractFuncStmts(newDeleteEntityFuncRaw);
                    return false;
                default:
                    return false;
            }
        }
    });
    alterCreateDataMapping(eventParams.templateMapping.CREATE_DATA_MAPPING);
}

export const alterAuthResolverBaseMethods = (
    eventParams: CreateEntityResolverBaseParams,
    settings: Settings
) => {
    const { template, templateMapping } = eventParams;
    eventParams.templateMapping = newMapping(templateMapping, settings);
    appendImports(template, [
        isInstanceImport(),
        authErrorImport()
    ]);
    
    visit(template, {
        visitClassMethod: function(path) {
            const method = path.node;
            if(method.key.type !== "Identifier") {
                return false;
            }
            switch(method.key.name) {
                case "createUser":
                    method.body = extractFuncStmts(createUserFuncRaw);
                    return false;
                case "updateUser":
                    method.body = extractFuncStmts(updateUserFuncRaw);
                    return false;
                case "deleteUser":
                    method.body = extractFuncStmts(deleteUserFuncRaw);
                    return false;
                default:
                    return false;
            }
        }
    });
    alterCreateDataMapping(templateMapping.CREATE_DATA_MAPPING);
}

const isInstanceImport = (): namedTypes.ImportDeclaration => {
    return builders.importDeclaration([
        builders.importSpecifier(builders.identifier("isInstance"))
    ], builders.stringLiteral("class-validator"))
}

const authErrorImport = (): namedTypes.ImportDeclaration => {
    return builders.importDeclaration([
        builders.importSpecifier(builders.identifier("AuthError"))
    ], builders.stringLiteral("../../auth/supertokens/auth.error"))
}

const alterCreateDataMapping = (original: ExpressionKind) => {
    visit(original, {
        visitObjectExpression: function(path) {
            const obj = path.node;
            const supertokensIdProp = builders.objectProperty(
                builders.identifier(SUPERTOKENS_ID_FIELD_NAME),
                builders.identifier(SUPERTOKENS_ID_FIELD_NAME)
            );
            supertokensIdProp.shorthand = true;
            obj.properties.push(supertokensIdProp);
            return false;
        }
    })
}

const extractFuncStmts = (code: string): namedTypes.BlockStatement => {
    let body: namedTypes.BlockStatement | null = null;
    visit(parse(code), {
        visitFunctionDeclaration: function(path) {
            body = path.node.body;
            return false;
        }
    })
    if(!body) {
        throw new Error("Failed to extract function statements");
    }
    return body;
}

const newCreateEntityFuncRaw = `
async function CREATE_ENTITY_FUNCTION(): Promise<ENTITY> {
    if(data.SUPERTOKENS_ID_FIELD_NAME) {
        throw new common.BadRequestException("You cannot set the supertokens user ID");
    }
    try {
        const SUPERTOKENS_ID_FIELD_NAME = await this.authService.createSupertokensUser(data.EMAIL_FIELD_NAME, data.PASSWORD_FIELD_NAME);

        return await this.service.create({
            data: CREATE_DATA_MAPPING,
            select: SELECT,
        });
    } catch(err) {
        if(isInstance(err, AuthError)) {
            const error = err as AuthError;
            if(error.cause === "EMAIL_ALREADY_EXISTS_ERROR") {
                throw new common.BadRequestException("The email already exists");
            }
        }
        throw err;
    }
}
`

const newUpdateEntityFuncRaw = `
async function UPDATE_ENTITY_FUNCTION(): Promise<ENTITY | null> {
    if((data as any).SUPERTOKENS_ID_FIELD_NAME) {
        throw new common.BadRequestException("You cannot modify the supertokens user ID");
    }
    try {
        const user = await this.service.findOne({ where: { id: params.id } });
        if(!user) {
            throw new errors.NotFoundException(
            \`No resource was found for \${JSON.stringify(params)}\`
            );
        }
        if(data.EMAIL_FIELD_NAME || data.PASSWORD_FIELD_NAME) {
            await this.authService.updateSupertokensUser(
                await this.authService.getRecipeUserId(user.SUPERTOKENS_ID_FIELD_NAME),
                data.EMAIL_FIELD_NAME,
                data.PASSWORD_FIELD_NAME
            );
        }
        return await this.service.update({
            where: params,
            data: UPDATE_DATA_MAPPING,
            select: SELECT,
        });
    } catch (error) {
      if(isInstance(error, AuthError)) {
        const err = error as AuthError;
        switch(err.cause) {
          case "EMAIL_ALREADY_EXISTS_ERROR":
            throw new common.BadRequestException("The email already exists");
          case "SUPERTOKENS_PASSWORD_POLICY_VIOLATED_ERROR":
            throw new common.BadRequestException("The password doesn't fulfill the password requirements");
          default:
            throw err;
        }
      }
      throw error;
    }
  }
`;

const newDeleteEntityFuncRaw = `
  async function DELETE_ENTITY_FUNCTION(): Promise<ENTITY | null> {
    const user = await this.service.findOne({ where: { id: params.id } });
    if(!user) {
      throw new errors.NotFoundException(
        \`No resource was found for \${JSON.stringify(params)}\`
      );
    }
    await this.authService.deleteSupertokensUser(user.SUPERTOKENS_ID_FIELD_NAME);
    try {
      return await this.service.delete({
        where: params,
        select: SELECT,
      });
    } catch (error) {
      const newSupertokensId = await this.authService.createSupertokensUser(user.EMAIL_FIELD_NAME, user.PASSWORD_FIELD_NAME);
      await this.service.update({
        data: { SUPERTOKENS_ID_FIELD_NAME: newSupertokensId },
        where: { id: user.id }
      });
      throw error;
    }
  }
`;

const createUserFuncRaw = `
async function CREATE_MUTATION(): Promise<User> {
    try {
        const SUPERTOKENS_ID_FIELD_NAME = await this.authService.createSupertokensUser(args.data.EMAIL_FIELD_NAME, args.data.PASSWORD_FIELD_NAME);
        return await this.service.create({
            ...args,
            data: CREATE_DATA_MAPPING,
        });
    } catch(error) {
      if(isInstance(error, AuthError)) {
        const err = error as AuthError;
        if(err.cause === "EMAIL_ALREADY_EXISTS_ERROR") {
          throw new apollo.ApolloError("The email already exists");
        }
      }
      throw error;
    }
  }
`

const updateUserFuncRaw = `
  async function UPDATE_MUTATION(): Promise<ENTITY | null> {
    try {
        const user = await this.service.findOne({ where: { id: args.where.id } });
        if(!user) {
            throw new apollo.ApolloError(
                \`No resource was found for \${JSON.stringify(args.where)}\`
            );
        }
        if(args.data.EMAIL_FIELD_NAME || args.data.PASSWORD_FIELD_NAME) {
            await this.authService.updateSupertokensUser(
                await this.authService.getRecipeUserId(user.SUPERTOKENS_ID_FIELD_NAME),
                args.data.EMAIL_FIELD_NAME,
                args.data.PASSWORD_FIELD_NAME
            );
        }
        return await this.service.update({
        ...args,
        data: UPDATE_DATA_MAPPING,
        });
    } catch (error) {
        if(isInstance(error, AuthError)) {
            const err = error as AuthError;
            switch(err.cause) {
                case "EMAIL_ALREADY_EXISTS_ERROR":
                    throw new apollo.ApolloError("The email already exists");
                case "SUPERTOKENS_PASSWORD_POLICY_VIOLATED_ERROR":
                    throw new apollo.ApolloError("The password doesn't fulfill the password requirements");
                default:
                   throw err;
            }
        }
        throw error;
    }
  }
`

const deleteUserFuncRaw = `
async function DELETE_MUTATION(): Promise<ENTITY | null> {
    const user = await this.service.findOne({ where: { id: args.where.id } });
    if(!user) {
      throw new apollo.ApolloError(
          \`No resource was found for \${JSON.stringify(args.where)}\`
        );
    }
    await this.authService.deleteSupertokensUser(user.SUPERTOKENS_ID_FIELD_NAME);
    try {
      return await this.service.delete(args);
    } catch (error) {
      const newSupertokensId = await this.authService.createSupertokensUser(user.EMAIL_FIELD_NAME, user.PASSWORD_FIELD_NAME);
      await this.service.update({
        data: { SUPERTOKENS_ID_FIELD_NAME: newSupertokensId },
        where: { id: user.id }
      });
      throw error;
    }
  }
`
