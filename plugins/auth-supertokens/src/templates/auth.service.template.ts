import { Injectable } from "@nestjs/common";
import { SupertokensService } from "./supertokens/supertokens.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService extends SupertokensService {
  constructor(
    protected readonly configService: ConfigService,
    protected readonly userService: AUTH_ENTITY_SERVICE_ID,
  ) {
    super(configService, userService);
  }
}
