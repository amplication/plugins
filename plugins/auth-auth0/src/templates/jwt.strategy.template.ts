import { Injectable } from "@nestjs/common";
import { JwtStrategyBase } from "./base/jwt.strategy.base";
import { ConfigService } from "@nestjs/config";
import { Auth0User } from "./base/User";
import { IAuthStrategy } from "../IAuthStrategy";

declare class ENTITY_SERVICE {}
declare class ENTITY_NAME_INFO {}
declare class ENTITY_FIELDS {}

@Injectable()
export class JwtStrategy extends JwtStrategyBase implements IAuthStrategy {
  constructor(protected readonly configService: ConfigService) {
    super(configService, ENTITY_SERVICE);
  }

  async validate(payload: { user: Auth0User }): Promise<ENTITY_NAME_INFO> {
    const VALIDATED_ENTITY = await this.validateBase(payload);
    // If the entity is valid, return it
    if (VALIDATED_ENTITY) {
      return VALIDATED_ENTITY;
    }

    // Otherwise, make a new entity and return it
    const ENTITY_FIELDS = payload.user;
    const defaultData = DATA;

    const NEW_ENTITY = await this.ENTITY_SERVICE.create({
      data: defaultData,
    });

    return { ...NEW_ENTITY, roles: NEW_ENTITY?.roles as string[] };
  }
}
