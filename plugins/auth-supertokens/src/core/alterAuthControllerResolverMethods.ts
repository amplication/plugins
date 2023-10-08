import { CreateEntityControllerBaseParams, CreateEntityResolverBaseParams } from "@amplication/code-gen-types";
import { appendImports, parse } from "@amplication/code-gen-utils";
import { builders, namedTypes } from "ast-types";
import { SUPERTOKENS_ID_FIELD_NAME } from "../constants";
import { Settings } from "../types";
import { ExpressionKind } from "ast-types/gen/kinds";
import { visit } from "recast";

const newMapping = (oldMapping: {[key: string]: string}, settings: Settings): any => {
    const base = {
        ...oldMapping,
        SUPERTOKENS_ID_FIELD_NAME: builders.identifier(SUPERTOKENS_ID_FIELD_NAME),
    }
    switch(settings.recipe.name) {
        case "emailpassword":
            return {
                ...base,
                EMAIL_FIELD_NAME: builders.identifier(settings.recipe.emailFieldName),
                PASSWORD_FIELD_NAME: builders.identifier(settings.recipe.passwordFieldName)
            }
        case "passwordless":
        case "thirdparty":
        case "thirdpartyemailpassword":
        case "thirdpartypasswordless":
            return base
        default:
            throw new Error("unrecognized recipe");
    }
}

export const alterAuthControllerBaseMethods = (
    eventParams: CreateEntityControllerBaseParams,
    settings: Settings
) => {
    const { template, templateMapping } = eventParams;
    eventParams.templateMapping = newMapping(templateMapping, settings);
    appendImports(template, [
        isInstanceImport(),
        authErrorImport()
    ]);
    const extractFuncStmts = baseExtractFuncStmts(settings.recipe.name, "controller");
    visit(template, {
        visitClassMethod: function(path) {
            const method = path.node;
            if(method.key.type !== "Identifier") {
                return false;
            }
            switch(method.key.name) {
                case "create":
                    method.body = extractFuncStmts("create");
                    return false;
                case "update":
                    method.body = extractFuncStmts("update");
                    return false;
                case "delete":
                    method.body = extractFuncStmts("delete");
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
    const extractFuncStmts = baseExtractFuncStmts(settings.recipe.name, "resolver");
    visit(template, {
        visitClassMethod: function(path) {
            const method = path.node;
            if(method.key.type !== "Identifier") {
                return false;
            }
            switch(method.key.name) {
                case "createUser":
                    method.body = extractFuncStmts("create");
                    return false;
                case "updateUser":
                    method.body = extractFuncStmts("update");
                    return false;
                case "deleteUser":
                    method.body = extractFuncStmts("delete");
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

const baseExtractFuncStmts = (
    recipe: Settings["recipe"]["name"],
    codeType: keyof RawFuncs["emailpassword"]
) => {
    return (code: keyof RawFuncs["emailpassword"]["controller"]): namedTypes.BlockStatement => {
        let body: namedTypes.BlockStatement | null = null;
        visit(parse(rawFuncs[recipe][codeType][code]), {
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
}

const emailPasswordControllerCreateEntityFuncRaw = `
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
    } catch(error) {
        if(isInstance(error, AuthError)) {
            const err = error as AuthError;
            if(err.cause === "EMAIL_ALREADY_EXISTS_ERROR") {
                throw new common.BadRequestException("The email already exists");
            }
        }
        throw error;
    }
}
`

const emailPasswordControllerUpdateEntityFuncRaw = `
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

const emailPasswordControllerDeleteEntityFuncRaw = `
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

const emailPasswordResolverCreateEntityFuncRaw = `
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

const emailPasswordResolverUpdateEntityFuncRaw = `
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

const emailPasswordResolverDeleteEntityFuncRaw = `
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

const passwordlessControllerCreateEntityFuncRaw = `
async function CREATE_ENTITY_FUNCTION(): Promise<ENTITY> {
    if(data.SUPERTOKENS_ID_FIELD_NAME) {
        throw new common.BadRequestException("You cannot set the supertokens user ID");
    }
    if(!data.email && !data.phoneNumber) {
      throw new common.BadRequestException("An email or a phone number must be supplied to create a user");
    }
    try {
        const SUPERTOKENS_ID_FIELD_NAME = await this.authService.createSupertokensUser(
            data.email,
            data.phoneNumber
        );
        delete data.email;
        delete data.phoneNumber;

        return await this.service.create({
            data: CREATE_DATA_MAPPING,
            select: SELECT,
        });
    } catch(error) {
        throw error;
    }
}
`

const passwordlessControllerUpdateEntityFuncRaw = `
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
        if(data.email || data.phoneNumber) {
            await this.authService.updateSupertokensUser(
                await this.authService.getRecipeUserId(user.SUPERTOKENS_ID_FIELD_NAME),
                data.email,
                data.phoneNumber
            );
        }
        delete data.email;
        delete data.phoneNumber;
        return await this.service.update({
            where: params,
            data: UPDATE_DATA_MAPPING,
            select: SELECT,
        });
    } catch (error) {
      if (isInstance(error, AuthError)) {
        const err = error as AuthError;
        switch (err.cause) {
          case "EMAIL_ALREADY_EXISTS_ERROR":
            throw new common.BadRequestException("The email already exists");
          case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
            throw new common.BadRequestException("You are not allowed to change the email");
          case "PHONE_NUMBER_ALREADY_EXISTS_ERROR":
            throw new common.BadRequestException("The phone number already exists");
          case "PHONE_NUMBER_CHANGE_NOT_ALLOWED_ERROR":
            throw new common.BadRequestException("You are not allowed to change your phone number");
          default:
            throw err;
        }
      }
      throw error;
    }
  }
`

const passwordlessControllerDeleteEntityFuncRaw = `
async function DELETE_ENTITY_FUNCTION(): Promise<ENTITY | null> {
    const user = await this.service.findOne({ where: { id: params.id } });
    if(!user) {
        throw new errors.NotFoundException(
        \`No resource was found for \${JSON.stringify(params)}\`
        );
    }
    await this.authService.deleteSupertokensUser(user.SUPERTOKENS_ID_FIELD_NAME);
    return await this.service.delete({
        where: params,
        select: SELECT,
    });
}
`

const passwordlessResolverCreateEntityFuncRaw = `
async function CREATE_MUTATION(): Promise<User> {
    if(!args.data.email && !args.data.phoneNumber) {
      throw new apollo.ApolloError("An email or a phone number must be supplied to create a user");
    }
    try {
        const SUPERTOKENS_ID_FIELD_NAME = await this.authService.createSupertokensUser(
            args.data.email,
            args.data.phoneNumber
        );
        delete args.data.email;
        delete args.data.phoneNumber;
        return await this.service.create({
            ...args,
            data: CREATE_DATA_MAPPING,
        });
    } catch(error) {
      throw error;
    }
}
`

const passwordlessResolverUpdateEntityFuncRaw = `
async function UPDATE_MUTATION(): Promise<ENTITY | null> {
    try {
        const user = await this.service.findOne({ where: { id: args.where.id } });
        if(!user) {
            throw new apollo.ApolloError(
                \`No resource was found for \${JSON.stringify(args.where)}\`
            );
        }
        if (args.data.email || args.data.phoneNumber) {
            await this.authService.updateSupertokensUser(
            await this.authService.getRecipeUserId(user.SUPERTOKENS_ID_FIELD_NAME),
            args.data.email,
            args.data.phoneNumber
            );
        }
        delete args.data.email;
        delete args.data.phoneNumber;
        return await this.service.update({
        ...args,
        data: UPDATE_DATA_MAPPING,
        });
    } catch (error) {
        if (isInstance(error, AuthError)) {
            const err = error as AuthError;
            switch (err.cause) {
            case "EMAIL_ALREADY_EXISTS_ERROR":
                throw new apollo.ApolloError("The email already exists");
            case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
                throw new apollo.ApolloError("You are not allowed to change the email");
            case "PHONE_NUMBER_ALREADY_EXISTS_ERROR":
                throw new apollo.ApolloError("The phone number already exists");
            case "PHONE_NUMBER_CHANGE_NOT_ALLOWED_ERROR":
                throw new apollo.ApolloError("You are not allowed to change your phone number");
            default:
                throw err;
            }
        }
        throw error;
    }
  }
`

const passwordlessResolverDeleteEntityFuncRaw = `
async function DELETE_MUTATION(): Promise<ENTITY | null> {
    const user = await this.service.findOne({ where: { id: args.where.id } });
    if(!user) {
      throw new apollo.ApolloError(
          \`No resource was found for \${JSON.stringify(args.where)}\`
        );
    }
    await this.authService.deleteSupertokensUser(user.SUPERTOKENS_ID_FIELD_NAME);
    return await this.service.delete(args);
}
`

const thirdPartyControllerCreateEntityFuncRaw = `
async function CREATE_ENTITY_FUNCTION(): Promise<ENTITY> {
    if(data.SUPERTOKENS_ID_FIELD_NAME) {
        throw new common.BadRequestException("You cannot set the supertokens user ID");
    }
    if (!data.email || !data.thirdPartyId) {
      throw new common.BadRequestException(
        "An email and third party ID must be supplied to create a user"
      );
    }
    try {
        const SUPERTOKENS_ID_FIELD_NAME = await this.authService.createSupertokensUser(
            data.email,
            data.thirdPartyId
        );
        delete data.email;
        delete data.thirdPartyId;

        return await this.service.create({
            data: CREATE_DATA_MAPPING,
            select: SELECT,
        });
    } catch(error) {
        if(isInstance(error, AuthError)) {
            const err = error as AuthError;
            switch(err.cause) {
            case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
                throw new common.BadRequestException(
                "You are not allowed to change the email"
                );
            case "SIGN_IN_UP_NOT_ALLOWED":
                throw new common.BadRequestException(
                "You are not allowed to sign up or sign in"
                );
            default:
                throw err;
            }
        }
        throw error;
    }
}
`

const thirdPartyControllerUpdateEntityFuncRaw = `
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
        if (data.email || data.thirdPartyId) {
            await this.authService.updateSupertokensUser(
                data.email,
                data.thirdPartyId,
                user.SUPERTOKENS_ID_FIELD_NAME
            );
        }
        delete data.email;
        delete data.thirdPartyId; 
        return await this.service.update({
            where: params,
            data: UPDATE_DATA_MAPPING,
            select: SELECT,
        });
    } catch (error) {
      if (isInstance(error, AuthError)) {
        const err = error as AuthError;
        switch (err.cause) {
          case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
            throw new common.BadRequestException(
              "You are not allowed to change the email"
            );
          case "SIGN_IN_UP_NOT_ALLOWED":
            throw new common.BadRequestException(
              "You are not allowed to sign up or sign in"
            );
          default:
            throw err;
        }
      }
      throw error;
    }
  }
`

const thirdPartyResolverCreateEntityFuncRaw = `
async function CREATE_MUTATION(): Promise<User> {
    if (!args.data.email || !args.data.thirdPartyId) {
      throw new apollo.ApolloError(
        "An email and a third party ID must be supplied to create a user"
      );
    }
    try {
        const SUPERTOKENS_ID_FIELD_NAME = await this.authService.createSupertokensUser(
            args.data.email,
            args.data.thirdPartyId
        );
        delete args.data.email;
        delete args.data.thirdPartyId;
        return await this.service.create({
            ...args,
            data: CREATE_DATA_MAPPING,
        });
    } catch(error) {
      if(isInstance(error, AuthError)) {
        const err = error as AuthError;
        switch(err.cause) {
          case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
            throw new apollo.ApolloError(
              "You are not allowed to change the email"
            );
          case "SIGN_IN_UP_NOT_ALLOWED":
            throw new apollo.ApolloError(
              "You are not allowed to sign up or sign in"
            );
          default:
            throw err;
        }
      }
      throw error;
    }
  }
`

const thirdPartyResolverUpdateEntityFuncRaw = `
async function UPDATE_MUTATION(): Promise<ENTITY | null> {
    try {
        const user = await this.service.findOne({ where: { id: args.where.id } });
        if(!user) {
            throw new apollo.ApolloError(
                \`No resource was found for \${JSON.stringify(args.where)}\`
            );
        }
        if (args.data.email || args.data.thirdPartyId) {
            await this.authService.updateSupertokensUser(
                args.data.email,
                args.data.thirdPartyId,
                user.SUPERTOKENS_ID_FIELD_NAME
            );
        }
        delete args.data.email;
        delete args.data.thirdPartyId;
        return await this.service.update({
            ...args,
            data: UPDATE_DATA_MAPPING,
        });
    } catch (error) {
        if (isInstance(error, AuthError)) {
        const err = error as AuthError;
        switch (err.cause) {
          case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
            throw new apollo.ApolloError(
              "You are not allowed to change the email"
            );
          case "SIGN_IN_UP_NOT_ALLOWED":
            throw new apollo.ApolloError(
              "You are not allowed to sign up or sign in"
            );
          default:
            throw err;
        }
      }
      throw error;
    }
  }
`

const thirdPartyPasswordlessControllerCreateEntityFuncRaw = `
async function CREATE_ENTITY_FUNCTION(): Promise<ENTITY> {
    if(data.SUPERTOKENS_ID_FIELD_NAME) {
        throw new common.BadRequestException("You cannot set the supertokens user ID");
    }
    if (data.thirdPartyId && !data.thirdPartyId && !data.phoneNumber) {
      throw new common.BadRequestException(
        "An email must be supplied with the third party ID to create a user"
      );
    }
    try {
        const supertokensId = await this.authService.createSupertokensUser(
          data.email,
          data.phoneNumber,
          data.thirdPartyId
        );
        delete data.email;
        delete data.thirdPartyId;
        delete data.phoneNumber;

        return await this.service.create({
            data: CREATE_DATA_MAPPING,
            select: SELECT,
        });
    } catch(error) {
       if (isInstance(error, AuthError)) {
        const err = error as AuthError;
        switch (err.cause) {
          case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
            throw new common.BadRequestException(
              "You are not allowed to change the email"
            );
          case "SIGN_IN_UP_NOT_ALLOWED":
            throw new common.BadRequestException(
              "You are not allowed to sign up or sign in"
            );
          default:
            throw err;
        }
      }
      throw error;
    }
}
`

const thirdPartyPasswordlessControllerUpdateEntityFuncRaw = `
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
        if (data.email || data.thirdPartyId || data.phoneNumber) {
        await this.authService.updateSupertokensUser(
            data.email,
            data.thirdPartyId,
            data.phoneNumber,
            user.supertokensId
          );
        }
        delete data.email;
        delete data.thirdPartyId;
        delete data.phoneNumber;
        return await this.service.update({
            where: params,
            data: UPDATE_DATA_MAPPING,
            select: SELECT,
        });
    } catch (error) {
      if (isInstance(error, AuthError)) {
        const err = error as AuthError;
        switch (err.cause) {
          case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
            throw new common.BadRequestException(
              "You are not allowed to change the email"
            );
          case "SIGN_IN_UP_NOT_ALLOWED":
            throw new common.BadRequestException(
              "You are not allowed to sign up or sign in"
            );
          case "EMAIL_ALREADY_EXISTS_ERROR":
            throw new common.BadRequestException("The email already exists")
          case "PHONE_NUMBER_ALREADY_EXISTS_ERROR":
            throw new common.BadRequestException("The phone number already exists");
          case "PHONE_NUMBER_CHANGE_NOT_ALLOWED_ERROR":
            throw new common.BadRequestException("You are not allowed to change the phone number");
          default:
            throw err;
        }
      }
      throw error;
    }
  }
`

const thirdPartyPasswordlessResolverCreateEntityFuncRaw = `
async function CREATE_MUTATION(): Promise<User> {
    if (args.data.thirdPartyId && !args.data.thirdPartyId && !args.data.phoneNumber) {
      throw new apollo.ApolloError(
        "An email must be supplied with the third party ID to create a user"
      );
    }
    try {
        const SUPERTOKENS_ID_FIELD_NAME = await this.authService.createSupertokensUser(
            args.data.email,
            args.data.phoneNumber,
            args.data.thirdPartyId
        );
        delete args.data.email;
        delete args.data.thirdPartyId;
        delete args.data.phoneNumber;

        return await this.service.create({
            ...args,
            data: CREATE_DATA_MAPPING,
        });
    } catch(error) {
      if (isInstance(error, AuthError)) {
        const err = error as AuthError;
        switch (err.cause) {
          case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
            throw new apollo.ApolloError(
              "You are not allowed to change the email"
            );
          case "SIGN_IN_UP_NOT_ALLOWED":
            throw new apollo.ApolloError(
              "You are not allowed to sign up or sign in"
            );
          default:
            throw err;
        }
      }
      throw error;
    }
  }
`

const thirdPartyPasswordlessResolverUpdateEntityFuncRaw = `
async function UPDATE_MUTATION(): Promise<ENTITY | null> {
    try {
        const user = await this.service.findOne({ where: { id: args.where.id } });
        if(!user) {
            throw new apollo.ApolloError(
                \`No resource was found for \${JSON.stringify(args.where)}\`
            );
        }
        if (args.data.email || args.data.thirdPartyId || args.data.phoneNumber) {
          await this.authService.updateSupertokensUser(
            args.data.email,
            args.data.thirdPartyId,
            args.data.phoneNumber,
            user.SUPERTOKENS_ID_FIELD_NAME
          );
        }
        delete args.data.email;
        delete args.data.thirdPartyId;
        delete args.data.phoneNumber;

        return await this.service.update({
            ...args,
            data: UPDATE_DATA_MAPPING,
        });
    } catch (error) {
      if (isInstance(error, AuthError)) {
        const err = error as AuthError;
        switch (err.cause) {
          case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
            throw new apollo.ApolloError(
              "You are not allowed to change the email"
            );
          case "SIGN_IN_UP_NOT_ALLOWED":
            throw new apollo.ApolloError(
              "You are not allowed to sign up or sign in"
            );
          case "EMAIL_ALREADY_EXISTS_ERROR":
            throw new apollo.ApolloError("The email already exists")
          case "PHONE_NUMBER_ALREADY_EXISTS_ERROR":
            throw new apollo.ApolloError("The phone number already exists");
          case "PHONE_NUMBER_CHANGE_NOT_ALLOWED_ERROR":
            throw new apollo.ApolloError("You are not allowed to change the phone number");
          default:
            throw err;
        }
      }
      throw error;
    }
  }
`

const thirdPartyEmailPasswordControllerCreateEntityFuncRaw = `
async function CREATE_ENTITY_FUNCTION(): Promise<ENTITY> {
    if(data.SUPERTOKENS_ID_FIELD_NAME) {
        throw new common.BadRequestException("You cannot set the supertokens user ID");
    }
    if (!data.email || (!data.thirdPartyId && !data.password)) {
      throw new common.BadRequestException(
        "An email and either a third party ID or password must be supplied to create a user"
      );
    }
    try {
        const supertokensId = await this.authService.createSupertokensUser(
            data.email,
            data.password,
            data.thirdPartyId
        );
        delete data.email;
        delete data.thirdPartyId;
        delete data.password;

        return await this.service.create({
            data: CREATE_DATA_MAPPING,
            select: SELECT,
        });
    } catch(error) {
        if(isInstance(error, AuthError)) {
            const err = error as AuthError;
            switch(err.cause) {
            case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
                throw new common.BadRequestException(
                "You are not allowed to change the email"
                );
            case "SIGN_IN_UP_NOT_ALLOWED":
                throw new common.BadRequestException(
                "You are not allowed to sign up or sign in"
                );
            default:
                throw err;
            }
        }
        throw error;
    }
}
`

const thirdPartyEmailPasswordControllerUpdateEntityFuncRaw = `
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
        if (data.email || data.thirdPartyId || data.password) {
            await this.authService.updateSupertokensUser(
            data.email,
            data.thirdPartyId,
            data.password,
            user.supertokensId
            );
        }
        delete data.email;
        delete data.thirdPartyId;
        delete data.password;
        return await this.service.update({
            where: params,
            data: UPDATE_DATA_MAPPING,
            select: SELECT,
        });
    } catch (error) {
      if (isInstance(error, AuthError)) {
        const err = error as AuthError;
        switch (err.cause) {
          case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
            throw new common.BadRequestException(
              "You are not allowed to change the email"
            );
          case "SIGN_IN_UP_NOT_ALLOWED":
            throw new common.BadRequestException(
              "You are not allowed to sign up or sign in"
            );
          default:
            throw err;
        }
      }
      throw error;
    }
  }
`

const thirdPartyEmailPasswordResolverCreateEntityFuncRaw = `
async function CREATE_MUTATION(): Promise<User> {
    if (!args.data.email || (!args.data.thirdPartyId && !args.data.password)) {
      throw new apollo.ApolloError(
        "An email and either a third party ID or password must be supplied to create a user"
      );
    }
    try {
        const SUPERTOKENS_ID_FIELD_NAME = await this.authService.createSupertokensUser(
            args.data.email,
            args.data.password,
            args.data.thirdPartyId
        );
        delete args.data.email;
        delete args.data.thirdPartyId;
        delete args.data.password;
        return await this.service.create({
            ...args,
            data: CREATE_DATA_MAPPING,
        });
    } catch(error) {
      if(isInstance(error, AuthError)) {
        const err = error as AuthError;
        switch(err.cause) {
          case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
            throw new apollo.ApolloError(
              "You are not allowed to change the email"
            );
          case "SIGN_IN_UP_NOT_ALLOWED":
            throw new apollo.ApolloError(
              "You are not allowed to sign up or sign in"
            );
          default:
            throw err;
        }
      }
      throw error;
    }
  }
`

const thirdPartyEmailPasswordResolverUpdateEntityFuncRaw = `
async function UPDATE_MUTATION(): Promise<ENTITY | null> {
    try {
        const user = await this.service.findOne({ where: { id: args.where.id } });
        if(!user) {
            throw new apollo.ApolloError(
                \`No resource was found for \${JSON.stringify(args.where)}\`
            );
        }
        if (args.data.email || args.data.thirdPartyId || args.data.password) {
            await this.authService.updateSupertokensUser(
                args.data.email,
                args.data.thirdPartyId,
                args.data.password,
                user.supertokensId
            );
        }
        delete args.data.email;
        delete args.data.thirdPartyId;
        delete args.data.password;
        return await this.service.update({
            ...args,
            data: UPDATE_DATA_MAPPING,
        });
    } catch (error) {
        if (isInstance(error, AuthError)) {
        const err = error as AuthError;
        switch (err.cause) {
          case "EMAIL_CHANGE_NOT_ALLOWED_ERROR":
            throw new apollo.ApolloError(
              "You are not allowed to change the email"
            );
          case "SIGN_IN_UP_NOT_ALLOWED":
            throw new apollo.ApolloError(
              "You are not allowed to sign up or sign in"
            );
          default:
            throw err;
        }
      }
      throw error;
    }
  }
`

const rawFuncs: RawFuncs = {
    emailpassword: {
        controller: {
            create: emailPasswordControllerCreateEntityFuncRaw,
            update: emailPasswordControllerUpdateEntityFuncRaw,
            delete: emailPasswordControllerDeleteEntityFuncRaw
        },
        resolver: {
            create: emailPasswordResolverCreateEntityFuncRaw,
            update: emailPasswordResolverUpdateEntityFuncRaw,
            delete: emailPasswordResolverDeleteEntityFuncRaw
        }
    },
    passwordless: {
        controller: {
            create: passwordlessControllerCreateEntityFuncRaw,
            update: passwordlessControllerUpdateEntityFuncRaw,
            delete: passwordlessControllerDeleteEntityFuncRaw
        },
        resolver: {
            create: passwordlessResolverCreateEntityFuncRaw,
            update: passwordlessResolverUpdateEntityFuncRaw,
            delete: passwordlessResolverDeleteEntityFuncRaw
        }
    },
    thirdparty: {
        controller: {
            create: thirdPartyControllerCreateEntityFuncRaw,
            update: thirdPartyControllerUpdateEntityFuncRaw,
            delete: passwordlessControllerDeleteEntityFuncRaw
        },
        resolver: {
            create: thirdPartyResolverCreateEntityFuncRaw,
            update: thirdPartyResolverUpdateEntityFuncRaw,
            delete: passwordlessResolverDeleteEntityFuncRaw
        }
    },
    thirdpartyemailpassword: {
        controller: {
            create: thirdPartyEmailPasswordControllerCreateEntityFuncRaw,
            update: thirdPartyEmailPasswordControllerUpdateEntityFuncRaw,
            delete: passwordlessControllerDeleteEntityFuncRaw
        },
        resolver: {
            create: thirdPartyEmailPasswordResolverCreateEntityFuncRaw,
            update: thirdPartyEmailPasswordResolverUpdateEntityFuncRaw,
            delete: passwordlessResolverDeleteEntityFuncRaw
        }
    },
    thirdpartypasswordless: {
      controller: {
            create: thirdPartyPasswordlessControllerCreateEntityFuncRaw,
            update: thirdPartyPasswordlessControllerUpdateEntityFuncRaw,
            delete: passwordlessControllerDeleteEntityFuncRaw
        },
        resolver: {
            create: thirdPartyPasswordlessResolverCreateEntityFuncRaw,
            update: thirdPartyPasswordlessResolverUpdateEntityFuncRaw,
            delete: passwordlessResolverDeleteEntityFuncRaw
        }
    }
}

type RawFuncs = {
    [key in Settings["recipe"]["name"]]: {
        controller: {
            create: string,
            update: string,
            delete: string
        },
        resolver: {
            create: string,
            update: string,
            delete: string
        }
    }
}
