import { Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { SamlAuthGuard } from "./saml/samlAuth.guard";
import { AuthService } from "./auth.service";
import { ConfigService } from "@nestjs/config";

declare class ENTITY_NAME_INFO {}

@ApiTags("auth")
@Controller()
export class AuthController {
  private readonly callbackUrl: string;
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    this.callbackUrl = `${configService.get<string>(
      "SAML_REDIRECT_CALLBACK_URL",
    )}`;
  }
  @UseGuards(SamlAuthGuard)
  @Get("login")
  async login(): Promise<void> {}

  @UseGuards(SamlAuthGuard)
  @Post("login/callback")
  async callback(@Req() req: Request, @Res() res: Response): Promise<void> {
    if (req.user) {
      // req.user is populated by the passport-saml strategy with the user info
      const user = await this.authService.login(req.user as ENTITY_NAME_INFO);

      // Change for the more appropriate way to handle the generated token
      res.cookie("token", user.accessToken, {
        httpOnly: true,
        secure: true,
      });

      if (this.callbackUrl) {
        res.redirect(302, `${this.callbackUrl}?code=${user.accessToken}`);
      } else {
        res.sendStatus(200);
      }
    }
  }
}
