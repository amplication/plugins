import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";

declare class AUTH_ENTITY_NAME {}

/**
 * Access the user data from the request object i.e `req.user`.
 */
function userFactory(ctx: ExecutionContext): AUTH_ENTITY_NAME {
  const contextType = ctx.getType();
  if (contextType === "http") {
    // do something that is only important in the context of regular HTTP requests (REST)
    const { user } = ctx.switchToHttp().getRequest();
    return user;
  } else if (contextType === "rpc") {
    // do something that is only important in the context of Microservice requests
    throw new Error("Rpc context is not implemented yet");
  } else if (contextType === "ws") {
    // do something that is only important in the context of Websockets requests
    throw new Error("Websockets context is not implemented yet");
  } else if (ctx.getType<GqlContextType>() === "graphql") {
    // do something that is only important in the context of GraphQL requests
    const gqlExecutionContext = GqlExecutionContext.create(ctx);
    return gqlExecutionContext.getContext().req.user;
  }
  throw new Error("Invalid context");
}

export const UserData = createParamDecorator<
  undefined,
  ExecutionContext,
  AUTH_ENTITY_NAME
>((data, ctx: ExecutionContext) => userFactory(ctx));
