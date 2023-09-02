import {
  MiddlewareConsumer,
  Module,
  NestModule,
  DynamicModule,
  FactoryProvider,
  ModuleMetadata,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthMiddleware } from './auth.middleware';
import { CONFIG_INJECTION_TOKEN, AuthModuleConfig } from './config.interface';
import { SupertokensService } from './supertokens/supertokens.service';

@Module({
  providers: [SupertokensService],
  exports: [],
  controllers: [],
})
export class AuthModule implements NestModule {

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }

  static forRootAsync({ useFactory }: ConfigParams): DynamicModule {
    return {
      providers: [
        {
          provide: CONFIG_INJECTION_TOKEN,
          useFactory,
          inject: [ConfigService]
        },
        SupertokensService
      ],
      exports: [],
      imports: [],
      module: AuthModule
    }
  }
}

type ConfigParams = {
  useFactory: (cs: ConfigService) => AuthModuleConfig
};
