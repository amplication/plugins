import { UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { BasicStrategy as Strategy } from "passport-http";
import { AuthService } from "../../auth.service";
import { IAuthStrategy } from "../../IAuthStrategy";

declare class ENTITY_NAME_INFO {}

export class BasicStrategyBase
  extends PassportStrategy(Strategy)
  implements IAuthStrategy
{
  constructor(protected readonly authService: AuthService) {
    super();
  }

  async validate(
    username: string,
    password: string
  ): Promise<ENTITY_NAME_INFO> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
