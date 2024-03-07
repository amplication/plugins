import { UnauthorizedException } from "@nestjs/common";
import { mock } from "jest-mock-extended";
import { JwtStrategyBase } from "../../../auth/jwt/base/jwt.strategy.base";
import { TEST_USER } from "../constants";

declare class ENTITY_SERVICE {}
describe("Testing the jwtStrategyBase.validate()", () => {
  const userService = mock<ENTITY_SERVICE>();
  const jwtStrategy = new JwtStrategyBase("Secret", userService);
  beforeEach(() => {
    userService.FIND_ONE_FUNCTION.mockClear();
  });
  it("should throw UnauthorizedException where there is no user", async () => {
    //ARRANGE
    userService.FIND_ONE_FUNCTION.calledWith({
      where: { username: TEST_USER.username },
    }).mockReturnValue(Promise.resolve(null));
    //ACT
    const result = jwtStrategy.validate({
      id: TEST_USER.id,
      username: TEST_USER.username,
      sessionId: TEST_USER.sessionId,
      roles: TEST_USER.roles,
    });
    //ASSERT
    return expect(result).rejects.toThrowError(UnauthorizedException);
  });
});
