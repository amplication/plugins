import * as graphql from "@nestjs/graphql";
import * as apollo from "apollo-server-express";
// @ts-ignore
import { isRecordNotFoundError } from "../../prisma.util";
// @ts-ignore
import { MetaQueryPayload } from "../../util/MetaQueryPayload";
import { isInstance } from "class-validator";
import { AuthError } from "../../auth/supertokens/auth.error";
import { AuthService } from "../../auth/auth.service";

declare interface CREATE_INPUT {}
declare interface WHERE_INPUT {}
declare interface WHERE_UNIQUE_INPUT {}
declare interface UPDATE_INPUT {}

declare interface CREATE_ARGS {
  data: CREATE_INPUT;
}
declare interface UPDATE_ARGS {
  where: WHERE_INPUT;
  data: UPDATE_INPUT;
}
declare interface DELETE_ARGS {
  where: WHERE_UNIQUE_INPUT;
}
declare interface COUNT_ARGS {
  where: WHERE_INPUT;
}
declare interface FIND_MANY_ARGS {
  where: WHERE_INPUT;
  skip: number | undefined;
  take: number | undefined;
}
declare interface FIND_ONE_ARGS {
  where: WHERE_UNIQUE_INPUT;
}

declare class ENTITY {}

declare const CREATE_DATA_MAPPING: CREATE_INPUT;
declare const UPDATE_DATA_MAPPING: UPDATE_INPUT;

declare interface SERVICE {
  create(args: { data: CREATE_INPUT }): Promise<ENTITY>;
  count(args: COUNT_ARGS): Promise<number>;
  findMany(args: FIND_MANY_ARGS): Promise<ENTITY[]>;
  findOne(args: { where: WHERE_UNIQUE_INPUT }): Promise<ENTITY | null>;
  update(args: {
    where: WHERE_UNIQUE_INPUT;
    data: UPDATE_INPUT;
  }): Promise<ENTITY>;
  delete(args: { where: WHERE_UNIQUE_INPUT }): Promise<ENTITY>;
}

declare const ENTITY_NAME: string;
@graphql.Resolver(() => ENTITY)
export class RESOLVER_BASE {
  constructor(protected readonly service: SERVICE, protected readonly authService: AuthService) {}

  async META_QUERY(
    @graphql.Args() args: COUNT_ARGS
  ): Promise<MetaQueryPayload> {
    const result = await this.service.count(args);
    return {
      count: result,
    };
  }

  @graphql.Query(() => [ENTITY])
  async ENTITIES_QUERY(
    @graphql.Args() args: FIND_MANY_ARGS
  ): Promise<ENTITY[]> {
    return this.service.findMany(args);
  }

  @graphql.Query(() => ENTITY, { nullable: true })
  async ENTITY_QUERY(
    @graphql.Args() args: FIND_ONE_ARGS
  ): Promise<ENTITY | null> {
    const result = await this.service.findOne(args);
    if (result === null) {
      return null;
    }
    return result;
  }

  @graphql.Mutation(() => ENTITY)
  async CREATE_MUTATION(@graphql.Args() args: CREATE_ARGS): Promise<ENTITY> {
    try {
        args.data.SUPERTOKENS_ID_FIELD_NAME = await this.authService.createSupertokensUser(args.data.EMAIL_FIELD_NAME, args.data.PASSWORD_FIELD_NAME);
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

  @graphql.Mutation(() => ENTITY)
  async UPDATE_MUTATION(
    @graphql.Args() args: UPDATE_ARGS
  ): Promise<ENTITY | null> {
    try {
        const user = await this.service.findOne({ where: { id: args.where.id } });
        if(!user) {
            throw new apollo.ApolloError(
                `No resource was found for ${JSON.stringify(args.where)}`
            );
        }
        if(args.data.EMAIL_FIELD_NAME || args.data.PASSWORD_FIELD_NAME) {
            await this.authService.updateSupertokensEmailPassword(user.SUPERTOKENS_ID_FIELD_NAME, args.data.EMAIL_FIELD_NAME, args.data.PASSWORD_FIELD_NAME);
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

  @graphql.Mutation(() => ENTITY)
  async DELETE_MUTATION(
    @graphql.Args() args: DELETE_ARGS
  ): Promise<ENTITY | null> {
    const user = await this.service.findOne({ where: { id: params.id } });
    if(!user) {
      throw new apollo.ApolloError(
          `No resource was found for ${JSON.stringify(args.where)}`
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
}
