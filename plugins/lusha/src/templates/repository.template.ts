import { PrismaService } from '@app/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';


@Injectable()
export class ENTITY_REPOSITORY implements ENTITY_REPOSITORY_INTERFACE {
  constructor(
    protected readonly prisma: PrismaService,
  ) { }

  async count<T extends COUNT_ARGS >(
    args: Prisma.SelectSubset<T, COUNT_ARGS>
  ): Promise<number> {
    return await this.prisma.ENTITY.findMany(args);
  }

  async findMany<T extends FIND_MANY_ARGS >(
    args: Prisma.SelectSubset<T, FIND_MANY_ARGS>
  ): Promise<ENTITY[]> {
    return await this.prisma.ENTITY.findMany(args);
  }

  async findOne<T extends FIND_ONE_ARGS >(
    args: Prisma.SelectSubset<T, FIND_ONE_ARGS>
  ): Promise<ENTITY | null> {
    return await this.prisma.ENTITY.findUnique(args as FIND_ONE_ARGS);
  }

  async create<T extends CREATE_ARGS >(
    args: Prisma.SelectSubset<T, CREATE_ARGS>
  ): Promise<ENTITY> {
    return await this.prisma.ENTITY.create<T>(args);
  }

  async update<T extends UPDATE_ARGS >(
    args: Prisma.SelectSubset<T, UPDATE_ARGS>
  ): Promise<ENTITY> {
    return await this.prisma.ENTITY.update<T>(args);
  }

  async delete<T extends DELETE_ARGS >(
    args: Prisma.SelectSubset<T, DELETE_ARGS>
  ): Promise<ENTITY> {
    return await this.prisma.ENTITY.delete(args);
  }
  
}