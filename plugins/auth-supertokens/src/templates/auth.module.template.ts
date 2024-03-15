import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  NestModule,
} from "@nestjs/common";
import { STAuthMiddleware } from "./supertokens/auth.middleware";
import { AuthService } from "./auth.service";

@Module({
  providers: [AuthService],
  imports: [forwardRef(() => AUTH_ENTITY_MODULE_ID)],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(STAuthMiddleware).forRoutes("*");
  }
}
