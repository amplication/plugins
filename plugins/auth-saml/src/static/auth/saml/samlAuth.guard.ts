import { AuthGuard } from "@nestjs/passport";
import { SAML_STRATEGY_NAME } from "./saml.constant";

export class SamlAuthGuard extends AuthGuard(SAML_STRATEGY_NAME) {}
