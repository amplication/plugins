import { UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt /*Strategy*/ } from "passport-jwt";
import { IAuthStrategy } from "../../IAuthStrategy";

import { Strategy } from "passport-keycloak-oauth2-oidc";

declare class ENTITY_NAME_INFO {}
declare class ENTITY_SERVICE {}

export interface IKcOpts {
  authServerURL: string;
  clientID: string;
  realm: string;
  publicClient: string;
  clientSecret: string;
  sslRequired: string;
  callbackURL: string;
}

/*
// Register the strategy with passport
passport.use(
  "keycloak",
  new KeycloakStrategy(
    {
      host: process.env.KEYCLOAK_HOST,
      realm: process.env.KEYCLOAK_REALM,
      clientID: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      callbackURL: `/api${AUTH_KEYCLOAK_CALLBACK}`
    },
    (accessToken, refreshToken, profile, done) => {
      // This is called after a successful authentication has been completed
      // Here's a sample of what you can then do, i.e., write the user to your DB
      User.findOrCreate({ email: profile.email }, (err, user) => {
        assert.ifError(err);
        user.keycloakId = profile.keycloakId;
        user.imageUrl = profile.avatar;
        user.name = profile.name;
        user.save((err, savedUser) => done(err, savedUser));
      });
    }
  )
);
*/

export class KeycloakStrategyBase
  extends PassportStrategy(Strategy)
  implements IAuthStrategy
{
  constructor(protected readonly opts: IKcOpts) {
    super({
      authServerURL: opts.authServerURL
        ? opts.authServerURL
        : process.env.authServerURL,
      clientID: opts.clientID ? opts.clientID : process.env.clientID,
      realm: opts.realm ? opts.realm : process.env.realm,
      publicClient: opts.publicClient
        ? opts.publicClient
        : process.env.publicClient,
      clientSecret: opts.clientSecret
        ? opts.clientSecret
        : process.env.clientSecret,
      sslRequired: opts.sslRequired
        ? opts.sslRequired
        : process.env.sslRequired,
      callbackURL: opts.callbackURL
        ? opts.callbackURL
        : process.env.callbackURL,
    });
  }

  async validate(payload: ENTITY_NAME_INFO): Promise<ENTITY_NAME_INFO> {
    const { username } = payload;
    const user = await this.ENTITY_SERVICE.findOne({
      where: { username },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    if (
      !Array.isArray(user.roles) ||
      typeof user.roles !== "object" ||
      user.roles === null
    ) {
      throw new Error("User roles is not a valid value");
    }
    return { ...user, roles: user.roles as string[] };
  }
}
