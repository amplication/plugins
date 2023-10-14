import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { KeycloakStrategy } from "@exlinc/keycloak-passport";
import { KeyCloakUser } from "./User";

declare class ENTITY_SERVICE {}
declare class ENTITY_NAME_INFO {}

export class KeycloakStrategyBase extends PassportStrategy(KeycloakStrategy) {
  constructor(protected readonly configService: ConfigService) {
    super({
      host: configService.get("KEYCLOAK_HOST") || process.env.KEYCLOAK_HOST,
      realm: configService.get("KEYCLOAK_REALM") || process.env.KEYCLOAK_REALM,
      clientID: configService.get("KEYCLOAK_CLIENT_ID") || process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: configService.get("KEYCLOAK_CLIENT_SECRET") || process.env.KEYCLOAK_CLIENT_SECRET,
      callbackURL: configService.get("KEYCLOAK_CLIENT_SECRET") || process.env.KEYCLOAK_CLIENT_SECRET
    });
  }

  // Validate and construct the user object out of the decoded token.
  async validateBase(payload: {
    user: KeyCloakUser;
  }): Promise<ENTITY_NAME_INFO | null> {
    const { email, name } = payload.user;
    const ENTITY = await this.ENTITY_SERVICE.findOne({
      where: {
        name_email: { email, name },
      },
    });

    return ENTITY ? { ...ENTITY, roles: ENTITY?.roles as string[] } : null;
  }
}
