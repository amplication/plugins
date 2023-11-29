import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { AuthService } from "./auth.service";
import { STAuthGuard } from "./supertokens/auth.guard";

@Injectable()
export class DefaultAuthGuard extends STAuthGuard {
  constructor(private readonly reflector: Reflector, authService: AuthService) {
    super(authService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getHandler()
    );

    if (isPublic) {
      return true;
    }

    return await super.canActivate(context);
  }
}
