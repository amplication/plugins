import { Prisma } from "@prisma/client";

export interface ENTITY_REPOSITORY_INTERFACE {
  count: (args: COUNT_ARGS) => Promise<number>;
  findMany: (args: FIND_MANY_ARGS) => Promise<ENTITY[]>;
  findOne: (args: FIND_ONE_ARGS) => Promise<ENTITY>;
  create: (args: CREATE_ARGS) => Promise<ENTITY>;
  update: (args: UPDATE_ARGS) => Promise<ENTITY>;
  delete: (args: DELETE_ARGS) => Promise<ENTITY>;
}
