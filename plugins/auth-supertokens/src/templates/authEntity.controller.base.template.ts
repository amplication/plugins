import * as common from "@nestjs/common";
import * as swagger from "@nestjs/swagger";
// @ts-ignore
import { isRecordNotFoundError } from "../../prisma.util";
// @ts-ignore
import * as errors from "../../errors";
import { Request } from "express";
import { plainToClass } from "class-transformer";
// @ts-ignore
import { ApiNestedQuery } from "../../decorators/api-nested-query.decorator";
import { AuthService } from "../../auth/auth.service";
import { isInstance } from "class-validator";
import { AuthError } from "src/auth/supertokens/auth.error";

declare interface CREATE_INPUT {}
declare interface WHERE_INPUT {}
declare interface WHERE_UNIQUE_INPUT {}
declare class FIND_MANY_ARGS {
  where: WHERE_INPUT;
}
declare interface UPDATE_INPUT {}

declare const FINE_ONE_PATH: string;
declare const UPDATE_PATH: string;
declare const DELETE_PATH: string;

declare class ENTITY {}
declare interface Select {}

declare interface SERVICE {
  create(args: { data: CREATE_INPUT; select: Select }): Promise<ENTITY>;
  findMany(args: { where: WHERE_INPUT; select: Select }): Promise<ENTITY[]>;
  findOne(args: {
    where: WHERE_UNIQUE_INPUT;
    select: Select;
  }): Promise<ENTITY | null>;
  update(args: {
    where: WHERE_UNIQUE_INPUT;
    data: UPDATE_INPUT;
    select: Select;
  }): Promise<ENTITY>;
  delete(args: { where: WHERE_UNIQUE_INPUT; select: Select }): Promise<ENTITY>;
}

declare const RESOURCE: string;
declare const ENTITY_NAME: string;
declare const CREATE_DATA_MAPPING: CREATE_INPUT;
declare const UPDATE_DATA_MAPPING: UPDATE_INPUT;
declare const SELECT: Select;

export class CONTROLLER_BASE {
  constructor(protected readonly service: SERVICE, protected readonly authService: AuthService) {}
    @common.Post()
    @swagger.ApiCreatedResponse({ type: ENTITY })
    async CREATE_ENTITY_FUNCTION(
        @common.Body() data: CREATE_INPUT
    ): Promise<ENTITY> {
        if(data.SUPERTOKENS_ID_FIELD_NAME) {
        throw new common.BadRequestException("You cannot set the supertokens user ID");
        }
        try {
            data.SUPERTOKENS_ID_FIELD_NAME = await this.authService.createSupertokensUser(data.EMAIL_FIELD_NAME, data.PASSWORD_FIELD_NAME);
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

  @common.Get()
  @swagger.ApiOkResponse({ type: [ENTITY] })
  @ApiNestedQuery(FIND_MANY_ARGS)
  async FIND_MANY_ENTITY_FUNCTION(
    @common.Req() request: Request
  ): Promise<ENTITY[]> {
    const args = plainToClass(FIND_MANY_ARGS, request.query);
    return this.service.findMany({
      ...args,
      select: SELECT,
    });
  }

  @common.Get(FINE_ONE_PATH)
  @swagger.ApiOkResponse({ type: ENTITY })
  @swagger.ApiNotFoundResponse({ type: errors.NotFoundException })
  async FIND_ONE_ENTITY_FUNCTION(
    @common.Param() params: WHERE_UNIQUE_INPUT
  ): Promise<ENTITY | null> {
    const result = await this.service.findOne({
      where: params,
      select: SELECT,
    });
    if (result === null) {
      throw new errors.NotFoundException(
        `No resource was found for ${JSON.stringify(params)}`
      );
    }
    return result;
  }

  @common.Patch(UPDATE_PATH)
  @swagger.ApiOkResponse({ type: ENTITY })
  @swagger.ApiNotFoundResponse({ type: errors.NotFoundException })
  async UPDATE_ENTITY_FUNCTION(
    @common.Param() params: WHERE_UNIQUE_INPUT,
    @common.Body() data: UPDATE_INPUT
  ): Promise<ENTITY | null> {
    //@ts-ignore
    if(data.SUPERTOKENS_ID_FIELD_NAME) {
        throw new common.BadRequestException("You cannot modify the supertokens user ID");
    }
    try {
        const user = await this.service.findOne({ where: { id: params.id } });
        if(!user) {
            throw new errors.NotFoundException(
            `No resource was found for ${JSON.stringify(params)}`
            );
        }
        if(data.EMAIL_FIELD_NAME || data.PASSWORD_FIELD_NAME) {
            await this.authService.updateSupertokensEmailPassword(user.SUPERTOKENS_ID_FIELD_NAME, data.EMAIL_FIELD_NAME, data.PASSWORD_FIELD_NAME);
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

  @common.Delete(DELETE_PATH)
  @swagger.ApiOkResponse({ type: ENTITY })
  @swagger.ApiNotFoundResponse({ type: errors.NotFoundException })
  async DELETE_ENTITY_FUNCTION(
    @common.Param() params: WHERE_UNIQUE_INPUT
  ): Promise<ENTITY | null> {
    const user = await this.service.findOne({ where: { id: params.id } });
    if(!user) {
      throw new errors.NotFoundException(
        `No resource was found for ${JSON.stringify(params)}`
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
