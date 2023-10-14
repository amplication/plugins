import { Injectable } from "@nestjs/common";
import { KeycloakStrategyBase } from "./base/keycloak.strategy.base";
import { ConfigService } from "@nestjs/config";
import { keyCloakUser } from "./base/User";
import { IAuthStrategy } from "../IAuthStrategy";

declare class ENTITY_SERVICE {}
declare class ENTITY_NAME_INFO {}
declare class ENTITY_FIELDS {}

@Injectable()
export class KeycloakStrategy extends KeycloakStrategyBase implements IAuthStrategy {
  constructor(protected readonly configService: ConfigService) {
    super(configService, ENTITY_SERVICE);
  }

  async validate(payload: { user: keyCloakUser }): Promise<ENTITY_NAME_INFO> {
    const VALIDATED_ENTITY = await this.validateBase(payload);
    // If the entity is valid, return it
    if (VALIDATED_ENTITY) {
      return VALIDATED_ENTITY;
    }

    // Otherwise, make a new entity and return it
    const ENTITY_FIELDS = payload.user;
    const { name, email } = ENTITY_FIELDS;

    const NEW_ENTITY = await this.ENTITY_SERVICE.create({
      data: {
        name,
        email,
        ...ENTITY_FIELDS,
        // TODO: Add the rest of the fields here according to your authEntity schema
      },
    });

    return { ...NEW_ENTITY, roles: NEW_ENTITY?.roles as string[] };
  }
}
