import { AuthGuard } from "@nestjs/passport";

export class KeycloakAuthGuard extends AuthGuard("keycloak") {}
