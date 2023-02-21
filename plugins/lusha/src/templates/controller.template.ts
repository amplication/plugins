import * as common from "@nestjs/common";
import { ApiTags } from '@nestjs/swagger';
// @ts-ignore
import { isRecordNotFoundError } from "../prisma.util";
// @ts-ignore
import * as errors from "../errors";
import { Request } from "express";
import { plainToClass } from "class-transformer";

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

declare interface SERVICE {
  create(args: { data: CREATE_INPUT }): Promise<ENTITY>;
  findMany(args: { where: WHERE_INPUT }): Promise<ENTITY[]>;
  findOne(args: {
    where: WHERE_UNIQUE_INPUT
  }): Promise<ENTITY | null>;
  update(args: {
    where: WHERE_UNIQUE_INPUT;
    data: UPDATE_INPUT;
  }): Promise<ENTITY>;
  delete(args: { where: WHERE_UNIQUE_INPUT }): Promise<ENTITY>;
}

declare const CREATE_DATA_MAPPING: CREATE_INPUT;
declare const UPDATE_DATA_MAPPING: UPDATE_INPUT;

@ApiTags('wished-contacts-v2')
@common.Controller(ENTITY_NAME)
export class CONTROLLER_BASE {
  constructor(protected readonly service: SERVICE) {}
  
  @common.Post()
  async CREATE_ENTITY_FUNCTION(
    @common.Body() data: CREATE_INPUT
  ): Promise<ENTITY> {
    return await this.service.create({
      data: CREATE_DATA_MAPPING
    });
  }

  @common.Get()
  async FIND_MANY_ENTITY_FUNCTION(
    @common.Req() request: Request
  ): Promise<ENTITY[]> {
    const args = plainToClass(FIND_MANY_ARGS, request.query);
    return this.service.findMany({
      ...args
    });
  }

  @common.Get(FINE_ONE_PATH)
  async FIND_ONE_ENTITY_FUNCTION(
    @common.Param() params: WHERE_UNIQUE_INPUT
  ): Promise<ENTITY | null> {
    const result = await this.service.findOne({
      where: params
    });
    if (result === null) {
      throw new errors.NotFoundException(
        `No resource was found for ${JSON.stringify(params)}`
      );
    }
    return result;
  }

  @common.Patch(UPDATE_PATH)
  async UPDATE_ENTITY_FUNCTION(
    @common.Param() params: WHERE_UNIQUE_INPUT,
    @common.Body() data: UPDATE_INPUT
  ): Promise<ENTITY | null> {
    try {
      return await this.service.update({
        where: params,
        data: UPDATE_DATA_MAPPING
      });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new errors.NotFoundException(
          `No resource was found for ${JSON.stringify(params)}`
        );
      }
      throw error;
    }
  }

  @common.Delete(DELETE_PATH)
  async DELETE_ENTITY_FUNCTION(
    @common.Param() params: WHERE_UNIQUE_INPUT
  ): Promise<ENTITY | null> {
    try {
      return await this.service.delete({
        where: params
      });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new errors.NotFoundException(
          `No resource was found for ${JSON.stringify(params)}`
        );
      }
      throw error;
    }
  }
}
