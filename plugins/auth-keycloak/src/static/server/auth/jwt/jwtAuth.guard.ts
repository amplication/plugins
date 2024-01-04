import { ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";

export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const promiseOrBoolean = super.canActivate(context);
    if (promiseOrBoolean instanceof Promise) {
      return promiseOrBoolean.then((result) => {
        return result;
      });
    } else {
      return promiseOrBoolean;
    }
  }
}
