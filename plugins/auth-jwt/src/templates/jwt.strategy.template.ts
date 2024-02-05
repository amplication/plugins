import { Inject, Injectable } from "@nestjs/common";
import { JWT_SECRET_KEY_PROVIDER_NAME } from "../../constants";
import { JwtStrategyBase } from "./base/jwt.strategy.base";

declare class ENTITY_SERVICE {}

@Injectable()
export class JwtStrategy extends JwtStrategyBase {
  constructor(@Inject(JWT_SECRET_KEY_PROVIDER_NAME) secretOrKey: string) {
    super(secretOrKey, ENTITY_SERVICE);
  }
}
