import { Module } from '@nestjs/common';

@Module({
  controllers: [ENTITY_CONTROLLER],
  providers: [ENTITY_REPOSITORY, ENTITY_SERVICE,
    {
      provide: COUNT_USE_CASE,
      useFactory: (
        repository: ENTITY_REPOSITORY_INTERFACE
      ) => new COUNT_USE_CASE(
        repository
      ),
      inject: [
        ENTITY_REPOSITORY
      ],
    },
    {
      provide: CREATE_USE_CASE,
      useFactory: (
        repository: ENTITY_REPOSITORY_INTERFACE
      ) => new CREATE_USE_CASE(
        repository
      ),
      inject: [
        ENTITY_REPOSITORY
      ],
    },
    {
      provide: DELETE_USE_CASE,
      useFactory: (
        repository: ENTITY_REPOSITORY_INTERFACE
      ) => new DELETE_USE_CASE(
        repository
      ),
      inject: [
        ENTITY_REPOSITORY
      ],
    },
    {
      provide: FIND_ONE_USE_CASE,
      useFactory: (
        repository: ENTITY_REPOSITORY_INTERFACE
      ) => new FIND_ONE_USE_CASE(
        repository
      ),
      inject: [
        ENTITY_REPOSITORY
      ],
    },
    {
      provide: UPDATE_USE_CASE,
      useFactory: (
        repository: ENTITY_REPOSITORY_INTERFACE
      ) => new UPDATE_USE_CASE(
        repository
      ),
      inject: [
        ENTITY_REPOSITORY
      ],
    },
    {
      provide: FIND_MANY_USE_CASE,
      useFactory: (
        repository: ENTITY_REPOSITORY_INTERFACE
      ) => new FIND_MANY_USE_CASE(
        repository
      ),
      inject: [
        ENTITY_REPOSITORY
      ],
    }],
})
export class ENTITY_MODULE_CLASS { }