import * as common from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import * as gqlACGuard from "../auth/gqlAC.guard";
import { AuthService } from "./auth.service";
import { GqlDefaultAuthGuard } from "./gqlDefaultAuth.guard";
import { UserData } from "./userData.decorator";
import { LoginArgs } from "./LoginArgs";

declare class ENTITY_NAME_INFO {}
declare type ENTITY_NAME


@Resolver(ENTITY_NAME_INFO)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}
  @Mutation(() => ENTITY_NAME_INFO)
  async login(@Args() args: LoginArgs): Promise<ENTITY_NAME_INFO> {
    return this.authService.login(args.credentials);
  }

  @Query(() => ENTITY_NAME_INFO)
  @common.UseGuards(GqlDefaultAuthGuard, gqlACGuard.GqlACGuard)
  async userInfo(
    @UserData() ENTITY_NAME: ENTITY_NAME_INFO
  ): Promise<ENTITY_NAME_INFO> {
    return ENTITY_NAME;
  }
}
