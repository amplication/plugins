import { forwardRef, Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { KeycloakStrategy } from "./keycloak/keycloak.strategy";

declare class ENTITY_MODULE {}

@Module({
  imports: [
    forwardRef(() => ENTITY_MODULE),
    PassportModule.register({ defaultStrategy: "jwt" }),
  ],
  providers: [KeycloakStrategy],
  controllers: [],
  exports: [PassportModule],
})
export class AuthModule {}
