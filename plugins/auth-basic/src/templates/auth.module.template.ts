import { forwardRef, Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { SecretsManagerModule } from "../providers/secrets/secretsManager.module";
import { AuthController } from "./auth.controller";
import { AuthResolver } from "./auth.resolver";
import { AuthService } from "./auth.service";
import { BasicStrategy } from "./basic/basic.strategy";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";

declare class ENTITY_MODULE {}

@Module({
  imports: [
    forwardRef(() => ENTITY_MODULE),
    PassportModule,
    SecretsManagerModule,
  ],
  providers: [
    AuthService,
    BasicStrategy,
    PasswordService,
    AuthResolver,
    TokenService,
  ],
  controllers: [AuthController],
  exports: [AuthService, PasswordService],
})
export class AuthModule {}
