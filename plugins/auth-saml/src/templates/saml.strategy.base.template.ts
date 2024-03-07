import { UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, SamlConfig, Profile } from "@node-saml/passport-saml";
import { ConfigService } from "@nestjs/config";
import { DoneCallback } from "passport";
import { SAML_STRATEGY_NAME } from "../saml.constant";

declare class ENTITY_SERVICE {}
declare class ENTITY_NAME_CREATE_INPUT {}

export abstract class SamlStrategyBase extends PassportStrategy(Strategy) {
  constructor(protected readonly configService: ConfigService) {
    const config: SamlConfig = {
      name: SAML_STRATEGY_NAME,
      // URL that goes from the Service Provider -> Identity Provider
      entryPoint: configService.get<string>("SAML_ENTRY_POINT"),
      // URL that goes from the Identity Provider -> Service Provider
      path: "/api/login/callback",
      issuer: configService.getOrThrow<string>("SAML_ISSUER"),
      // Service Provider private key
      decryptionPvk: configService.get<string>("SAML_DECRYPT_KEY"),
      // Service Provider Certificate
      privateKey: configService.get<string>("SAML_PRIVATE_CERT"),
      // Identity Provider's public key
      cert: configService.getOrThrow<string>("SAML_PUBLIC_CERT"),
      identifierFormat: null,
    };

    const signon = async (profile: Profile, done: DoneCallback) => {
      const { nameID: username, sessionIndex: sessionId } = profile;
      let user = await this.ENTITY_SERVICE.FIND_ONE_FUNCTION({
        where: { username },
      });

      if (!user) {
        user = await this.ENTITY_SERVICE.CREATE_FUNCTION({
          data: this.mapProfileToAuthEntity(profile),
        });
      } else {
        user = await this.ENTITY_SERVICE.UPDATE_FUNCTION({
          where: { username },
          data: this.mapProfileToAuthEntity(profile),
        });
      }

      if (!user) {
        return done(new UnauthorizedException());
      }
      return done(null, user);
    };

    const signout = async () => {
      // invalidate JWT
    };

    super(config, signon, signout);
  }

  abstract mapProfileToAuthEntity(profile: Profile): ENTITY_NAME_CREATE_INPUT;

  abstract mapProfileToRoles(profile: Profile): string[];
}
