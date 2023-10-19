import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import Session from "supertokens-node/recipe/session";
import { AuthService } from "../auth.service";
import { AuthError } from "./auth.error";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import { VerifySessionOptions } from "supertokens-node/recipe/session";
import { Error as STError } from "supertokens-node";

@Injectable()
export class STAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private readonly verifyOptions?: VerifySessionOptions
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const [req, resp] = this.getReqResp(context);

    let err = undefined;
    await verifySession(this.verifyOptions)(req, resp, (res) => {
      err = res;
    });
    if (resp.headersSent) {
      throw new STError({
        message: "RESPONSE_SENT",
        type: "RESPONSE_SENT",
      });
    }
    if (err) {
      throw err;
    }

    const session = await Session.getSession(req, resp);
    if (session === undefined) {
      return false;
    }
    const supertokensId = session.getUserId();
    const user = await this.authService.getUserBySupertokensId(supertokensId);
    if (!user) {
      throw new AuthError(
        "SUPERTOKENS_USER_ID_WITH_NO_CORRESPONDING_USER_IN_DB_ERROR"
      );
    }

    if (!user.roles || (Array.isArray(user.roles) && !user.roles.length)) {
      return false;
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
      return [ctx.getRequest(), ctx.getResponse()];
    } else {
      throw new Error("Context type is not yet implemented");
    }
  }
}
