import { Inject, Injectable } from "@nestjs/common";
import { KeycloakStrategyBase, IKcOpts } from "./base/keycloak.strategy.base";

declare class ENTITY_SERVICE {}

@Injectable()
export class KeycloakStrategy extends KeycloakStrategyBase {
  constructor(@Inject("KC_OPTS") opts: IKcOpts) {
    super(opts, ENTITY_SERVICE);
  }
}
