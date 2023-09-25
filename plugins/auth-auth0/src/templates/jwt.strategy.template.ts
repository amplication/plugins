import { Injectable } from "@nestjs/common";
import { JwtBaseStrategy } from "./base/jwt.strategy.base";
import { ConfigService } from "@nestjs/config";
import { UserService } from "src/user/user.service";
import { Auth0User } from "./base/User";
import { IAuthStrategy } from "../IAuthStrategy";
import { EnumUserPriority } from "src/user/base/EnumUserPriority";
import { UserInfo } from "../UserInfo";

declare class ENTITY_SERVICE {}
declare class ENTITY_NAME_INFO {}
declare class ENTITY_FIELDS {}

@Injectable()
export class JwtStrategy extends JwtBaseStrategy implements IAuthStrategy {
  constructor(
    protected readonly configService: ConfigService,
  ) {
    super(configService, ENTITY_SERVICE);
  }

  async validate(payload: { user: Auth0User; }) : Promise<ENTITY_NAME_INFO> {
    const VALIDATED_ENTITY = await this.validateBase(payload);
    // If the entity is valid, return it
    if(VALIDATED_ENTITY) {
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
      }
    });

    return { ...NEW_ENTITY, roles: NEW_ENTITY?.roles as string[] };    
  }
}