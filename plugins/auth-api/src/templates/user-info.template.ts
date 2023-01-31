 //@ts-ignore
import { Field, ObjectType } from "@nestjs/graphql";
 //@ts-ignore
import { User } from "../user/base/User";

declare class USER_ID_TYPE_ANNOTATION {}
declare class USER_ID_CLASS {}

@ObjectType()
 //@ts-ignore
export class UserInfo implements Partial<User> {
  @Field(() => USER_ID_CLASS)
   //@ts-ignore
  id!: USER_ID_TYPE_ANNOTATION;
  @Field(() => String)
   //@ts-ignore
  username!: string;
  @Field(() => [String])
   //@ts-ignore
  roles!: string[];
  @Field(() => String, { nullable: true })
   //@ts-ignore
  accessToken?: string;
}
