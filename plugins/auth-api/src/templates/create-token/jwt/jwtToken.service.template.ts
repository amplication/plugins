import { Injectable } from "@nestjs/common";
//@ts-ignore
import { JwtService } from "@nestjs/jwt";
import { INVALID_PASSWORD_ERROR, INVALID_USERNAME_ERROR } from "../constants";
 //@ts-ignore
import { ITokenService, ITokenPayload } from "../ITokenService";
/**
 * TokenServiceBase is a jwt bearer implementation of ITokenService
 */
@Injectable()
 //@ts-ignore
export class TokenServiceBase implements ITokenService {
  constructor(protected readonly jwtService: JwtService) {}
  /**
   *
   * @object { id: String, username: String, password: String}
   * @returns a jwt token sign with the username and user id
   */
  createToken({ id, username, password }: ITokenPayload): Promise<string> {
    if (!username) return Promise.reject(INVALID_USERNAME_ERROR);
    if (!password) return Promise.reject(INVALID_PASSWORD_ERROR);
    return this.jwtService.signAsync({
      sub: id,
      username,
    });
  }
}
