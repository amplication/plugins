import * as common from "@nestjs/common";
import { Query, Resolver } from "@nestjs/graphql";
import * as gqlACGuard from "../auth/gqlAC.guard";
import { GqlDefaultAuthGuard } from "./gqlDefaultAuth.guard";
import { UserData } from "./userData.decorator";

declare class ENTITY_NAME_INFO {}

@Resolver(ENTITY_NAME_INFO)
export class AuthResolver {
  @Query(() => ENTITY_NAME_INFO)
  @common.UseGuards(GqlDefaultAuthGuard, gqlACGuard.GqlACGuard)
  async ENTITY_NAME(
    @UserData() entityInfo: ENTITY_NAME_INFO
  ): Promise<ENTITY_NAME_INFO> {
    return entityInfo;
  }
}
