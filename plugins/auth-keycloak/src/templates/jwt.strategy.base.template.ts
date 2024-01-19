import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { passportJwtSecret } from "jwks-rsa";
import { ExtractJwt, Strategy } from "passport-jwt";
import { KeycloakPayload } from "./types";

declare class ENTITY_SERVICE {}
declare class ENTITY_NAME_INFO {}

export class JwtStrategyBase extends PassportStrategy(Strategy) {
  constructor(protected readonly configService: ConfigService) {
    const url = configService.get<string>("KEYCLOAK_URL");
    const realm = configService.get<string>("KEYCLOAK_REALM");
    const issuerURL = `${url}/realms/${realm}`;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract JWT from the Authorization header
      issuer: issuerURL,

      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${issuerURL}/protocol/openid-connect/certs`,
      }),
    });
  }

  // Validate the received JWT and construct the user object out of the decoded token.
  async validateBase(
    payload: KeycloakPayload
  ): Promise<ENTITY_NAME_INFO | null> {
    const ENTITY = await this.ENTITY_SERVICE.FIND_ONE_FUNCTION({
      where: {
        SEARCHABLE_AUTH_FIELD: payload.email,
      },
    });

    return ENTITY ? { ...ENTITY, roles: ENTITY?.roles as string[] } : null;
  }
}
