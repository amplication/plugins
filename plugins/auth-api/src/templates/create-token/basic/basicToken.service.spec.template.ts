 //@ts-ignore
import { TokenServiceBase } from "/../../auth/base/token.service.base";
import {
  INVALID_USERNAME_ERROR,
  INVALID_PASSWORD_ERROR,
   //@ts-ignore
} from "../../auth/constants";
 //@ts-ignore
import { SIGN_TOKEN, VALID_CREDENTIALS, VALID_ID } from "./constants";
//@ts-ignore
describe("Testing the TokenServiceBase", () => {
  let tokenServiceBase: TokenServiceBase;
  //@ts-ignore
  beforeEach(() => {
    tokenServiceBase = new TokenServiceBase();
  });
  //@ts-ignore
  describe("Testing the BasicTokenService.createToken()", () => {
    //@ts-ignore
    it("should create valid token for given username and password", async () => {
      //@ts-ignore
      expect(
        await tokenServiceBase.createToken({
          id: VALID_ID,
          username: "admin",
          password: "admin",
        })
      ).toBe("YWRtaW46YWRtaW4=");
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
