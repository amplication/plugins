import { JwtService } from "@nestjs/jwt";
import { mock } from "jest-mock-extended";
import { TokenServiceBase } from "./token.service.base";
import {
  INVALID_USERNAME_ERROR,
} from "../constants";

const VALID_ID = "1";
const SIGN_TOKEN = "SIGN_TOKEN";
const VALID_CREDENTIALS = {
  username: "Valid User",
  sessionId: "User session", 
};
const INVALID_CREDENTIALS = {
  username: "Invalid User",
};

describe("Testing the TokenServiceBase", () => {
  let tokenServiceBase: TokenServiceBase;
  const jwtService = mock<JwtService>();
  beforeEach(() => {
    tokenServiceBase = new TokenServiceBase(jwtService);

    jwtService.signAsync.mockClear();
  });

  describe("Testing the TokenService.createToken()", () => {
    it("should create valid token for valid username and password", async () => {
      jwtService.signAsync.mockReturnValue(Promise.resolve(SIGN_TOKEN));
      expect(
        await tokenServiceBase.createToken({
          id: VALID_ID,
          username: VALID_CREDENTIALS.username,
          sessionId: VALID_CREDENTIALS.sessionId
        })
      ).toBe(SIGN_TOKEN);
    });
    it("should reject when username missing", () => {
      const result = tokenServiceBase.createToken({
        id: VALID_ID,
        username: "",
        sessionId: VALID_CREDENTIALS.sessionId,
      });

      return expect(result).rejects.toBe(INVALID_USERNAME_ERROR);
    });
  });
});
