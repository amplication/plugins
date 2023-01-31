//@ts-ignore
import { JwtService } from "@nestjs/jwt";
import { mock } from "jest-mock-extended";
//@ts-ignore
import { TokenServiceBase } from "../../auth/base/token.service.base";
import {
  INVALID_PASSWORD_ERROR,
  INVALID_USERNAME_ERROR,
  //@ts-ignore
} from "../../auth/constants";
//@ts-ignore
import { SIGN_TOKEN, VALID_CREDENTIALS, VALID_ID } from "./constants";

//@ts-ignore
describe("Testing the TokenServiceBase", () => {
  let tokenServiceBase: TokenServiceBase;
  const jwtService = mock<JwtService>();
  //@ts-ignore
  beforeEach(() => {
    tokenServiceBase = new TokenServiceBase(jwtService);
    //@ts-ignore

    jwtService.signAsync.mockClear();
  });
  //@ts-ignore

  describe("Testing the BasicTokenService.createToken()", () => {
    //@ts-ignore
    it("should create valid token for valid username and password", async () => {
      //@ts-ignore
      jwtService.signAsync.mockReturnValue(Promise.resolve(SIGN_TOKEN));
      //@ts-ignore
      expect(
        await tokenServiceBase.createToken({
          id: VALID_ID,
          username: VALID_CREDENTIALS.username,
          password: VALID_CREDENTIALS.password,
        })
      ).toBe(SIGN_TOKEN);
    });
    //@ts-ignore
    it("should reject when username missing", () => {
      const result = tokenServiceBase.createToken({
        id: VALID_ID,
        //@ts-ignore
        username: null,
        password: VALID_CREDENTIALS.password,
      });
      //@ts-ignore

      return expect(result).rejects.toBe(INVALID_USERNAME_ERROR);
    });
    //@ts-ignore
    it("should reject when password missing", () => {
      const result = tokenServiceBase.createToken({
        id: VALID_ID,
        username: VALID_CREDENTIALS.username,
        //@ts-ignore
        password: null,
      });
       //@ts-ignore
      return expect(result).rejects.toBe(INVALID_PASSWORD_ERROR);
    });
  });
});
