import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Profile } from "@node-saml/passport-saml";
import { SamlStrategyBase } from "./base/saml.strategy.base";

declare class ENTITY_SERVICE {}
declare class ENTITY_NAME_CREATE_INPUT {}

@Injectable()
export class SamlStrategy extends SamlStrategyBase {
  constructor(protected readonly configService: ConfigService) {
    super(configService, ENTITY_SERVICE);
  }
}
