import { Injectable, UnauthorizedException } from "@nestjs/common";
import { TokenService } from "./token.service";

declare class ENTITY_NAME_INFO {}

@Injectable()
export class AuthService {
  constructor(private readonly tokenService: TokenService) {}

  async login(user: ENTITY_NAME_INFO): Promise<ENTITY_NAME_INFO> {
    if (!user) {
      throw new UnauthorizedException("The passed credentials are incorrect");
    }
    const accessToken = await this.tokenService.createToken({
      id: user.id,
      username: user.username,
      sessionId: user.sessionId,
    });
    return {
      accessToken,
      ...user,
      roles: user.roles as string[],
    };
  }
}
