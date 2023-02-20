import {
  DynamicModule, MiddlewareConsumer,
  Module, NestModule, RequestMethod,
} from '@nestjs/common';
import { ConfigModule, LushaConfigService } from '@lusha/config-nestjs';
import { AuthMiddleware } from '@lusha/core-nestjs';
import { LushaPetsModule } from './app/pets/pets.module';
import { PrismaModule } from './app/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    LushaPetsModule,
    ConfigModule
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware)
      .exclude(
        { path: '/swagger', method: RequestMethod.ALL },
        { path: '/health', method: RequestMethod.ALL }
      )
      .forRoutes(
        // { path: '/lusha-pet', method: RequestMethod.ALL }
      );
  }

  static register(): DynamicModule {
    return {
      module: AppModule,
    };
  }
}
