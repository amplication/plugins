import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { Credentials } from "../auth/Credentials";

declare class ENTITY_NAME_INFO {}
// LIB

@ApiTags("auth")
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post("login")
  async login(@Body() body: Credentials): Promise<ENTITY_NAME_INFO> {
    return this.authService.login(body);
  }
}
