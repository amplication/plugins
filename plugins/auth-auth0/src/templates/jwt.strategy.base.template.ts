import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { passportJwtSecret } from "jwks-rsa";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Auth0User } from "./User";

declare class ENTITY_NAME_INFO {}

export class JwtStrategyBase extends PassportStrategy(Strategy) {
  constructor(protected readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract JWT from the Authorization header
      audience: configService.get("AUTH0_AUDIENCE"), // The resource server where the JWT is processed
      issuer: `${configService.get("AUTH0_ISSUER_URL")}`, // The issuing Auth0 server
      algorithms: ["RS256"], // Asymmetric signing algorithm

      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get(
          "AUTH0_ISSUER_URL"
        )}.well-known/jwks.json`,
      }),
    });
  }

  // Validate the received JWT and construct the user object out of the decoded token.
  async validateBase(payload: {
    user: Auth0User;
  }): Promise<ENTITY_NAME_INFO | null> {
    const ENTITY = await this.ENTITY_SERVICE.findOne({
      where: {
        SEARCHABLE_AUTH_FIELD: payload.user.email,
      },
    });

    return ENTITY ? { ...ENTITY, roles: ENTITY?.roles as string[] } : null;
  }
}
