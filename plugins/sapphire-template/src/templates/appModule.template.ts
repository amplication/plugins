import {
  DynamicModule, MiddlewareConsumer,
  Module, NestModule, RequestMethod,
} from '@nestjs/common';
import { ConfigModule, SapphireConfigService } from '@sapphire/config-nestjs';
import { AuthMiddleware } from '@sapphire/core-nestjs';
import { PrismaModule } from './app/prisma/prisma.module';

@Module({
  imports: MODULES
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware)
      .exclude(
        { path: '/swagger', method: RequestMethod.ALL },
        { path: '/health', method: RequestMethod.ALL }
      )
      .forRoutes();
  }

  static register(): DynamicModule {
    return {
      module: AppModule,
    };
  }
}
