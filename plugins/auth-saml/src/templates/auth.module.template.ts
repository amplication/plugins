import { forwardRef, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { JWT_EXPIRATION } from "../constants";
import { SecretsManagerModule } from "../providers/secrets/secretsManager.module";
import { SecretsManagerService } from "../providers/secrets/secretsManager.service";
import { EnumSecretsNameKey } from "../providers/secrets/secretsNameKey.enum";
import { AuthController } from "./auth.controller";
import { AuthResolver } from "./auth.resolver";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt/jwt.strategy";
import { jwtSecretFactory } from "./jwt/jwtSecretFactory";
import { SamlStrategy } from "./saml/saml.strategy";
import { samlSecretFactory } from "./saml/samlSecretFactory";
import { TokenService } from "./token.service";

declare class ENTITY_MODULE {}
@Module({
  imports: [
    forwardRef(() => ENTITY_MODULE),
    SecretsManagerModule,
    JwtModule.registerAsync({
      imports: [SecretsManagerModule],
      inject: [SecretsManagerService, ConfigService],
      useFactory: async (
        secretsService: SecretsManagerService,
        configService: ConfigService,
      ) => {
        const secret = await secretsService.getSecret<string>(
          EnumSecretsNameKey.JwtSecretKey,
        );
        const expiresIn = configService.get(JWT_EXPIRATION);
        if (!secret) {
          throw new Error("Didn't get a valid jwt secret");
        }
        if (!expiresIn) {
          throw new Error("Jwt expire in value is not valid");
        }
        return {
          secret: secret,
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  providers: [
    AuthService,
    AuthResolver,
    JwtStrategy,
    jwtSecretFactory,
    SamlStrategy,
    samlSecretFactory,
    TokenService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
