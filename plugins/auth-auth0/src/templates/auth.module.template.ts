import { Module, forwardRef } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./jwt/jwt.strategy";

declare class ENTITY_MODULE {}

@Module({
  imports: [
    forwardRef(() => ENTITY_MODULE),
    PassportModule.register({ defaultStrategy: "jwt" }),
  ],
  providers: [JwtStrategy],
  controllers: [],
  exports: [PassportModule],
})
export class AuthModule {}
