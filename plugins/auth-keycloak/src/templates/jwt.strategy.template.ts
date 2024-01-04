import { Injectable } from "@nestjs/common";
import { JwtStrategyBase } from "./base/jwt.strategy.base";
import { ConfigService } from "@nestjs/config";
import { KeycloakPayload } from "./base/types";
import { IAuthStrategy } from "../IAuthStrategy";

declare class ENTITY_SERVICE {}
declare class ENTITY_NAME_INFO {}
declare class ENTITY_FIELDS {}

@Injectable()
export class JwtStrategy extends JwtStrategyBase implements IAuthStrategy {
  constructor(protected readonly configService: ConfigService) {
    super(configService, ENTITY_SERVICE);
  }

  async validate(payload: KeycloakPayload): Promise<ENTITY_NAME_INFO> {
    const VALIDATED_ENTITY = await this.validateBase(payload);

    // Validate if the user is authorized to the specified client
    if (payload.azp !== this.configService.get<string>("KEYCLOAK_CLIENT_ID")) {
      throw new Error("Invalid token");
    }

    // If the entity is valid, return it
    if (VALIDATED_ENTITY) {
      if (
        !Array.isArray(VALIDATED_ENTITY.roles) ||
        typeof VALIDATED_ENTITY.roles !== "object" ||
        VALIDATED_ENTITY.roles === null
      ) {
        throw new Error("ENTITY roles is not a valid value");
      }

      return VALIDATED_ENTITY;
    }

    // Otherwise, make a new entity and return it
    const ENTITY_FIELDS = payload;
    const defaultData = DATA;

    const NEW_ENTITY = await this.ENTITY_SERVICE.CREATE_FUNCTION({
      data: defaultData,
    });

    return { ...NEW_ENTITY, roles: NEW_ENTITY?.roles as string[] };
  }
}
