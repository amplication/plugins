import * as common from "@nestjs/common";
 //@ts-ignore
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import * as gqlACGuard from "../auth/gqlAC.guard";
import { AuthService } from "./auth.service";
import { GqlDefaultAuthGuard } from "./gqlDefaultAuth.guard";
import { UserData } from "./userData.decorator";
import { LoginArgs } from "./LoginArgs";
 //@ts-ignore
import { UserInfo } from "./UserInfo";

@Resolver(UserInfo)
 //@ts-ignore
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}
  @Mutation(() => UserInfo)
   //@ts-ignore
  async login(@Args() args: LoginArgs): Promise<UserInfo> {
    return this.authService.login(args.credentials);
  }

  @Query(() => UserInfo)
  @common.UseGuards(GqlDefaultAuthGuard, gqlACGuard.GqlACGuard)
   //@ts-ignore
  async userInfo(@UserData() userInfo: UserInfo): Promise<UserInfo> {
    return userInfo;
  }
}
