import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import Session from "supertokens-node/recipe/session";
import { AuthService } from "../auth.service";
import { AuthError } from "./auth.error";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";

@Injectable()
export class STAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const [req, resp] = this.getReqResp(context);

    const session = await Session.getSession(req, resp);
    if(session === undefined) {
      return false;
    }
    const supertokensId = session.getUserId();
    const user = await this.authService.getUserBySupertokensId(supertokensId);
    if(!user) {
      throw new AuthError("SUPERTOKENS_USER_ID_WITH_NO_CORRESPONDING_USER_IN_DB_ERROR");
    }

    if(!user.roles || (Array.isArray(user.roles) && !user.roles.length)) {
      return false
    }
    req.user = user;
    req.session = session;

    return true;
  }

  getReqResp(context: ExecutionContext): [any, any] {
    const contextType = context.getType<GqlContextType>();
    if (contextType === "graphql") {
      const ctx = GqlExecutionContext.create(context);
      const req = ctx.getContext().req;
      const resp = req.res;
      return [req, resp];
    } else if (contextType === "http") {
      const ctx = context.switchToHttp();
      return [ctx.getRequest(), ctx.getResponse()]
    } else {
      throw new Error("Context type is not yet implemented");
    }
  }
}
