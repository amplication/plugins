import { Field, ObjectType } from "@nestjs/graphql";
import { User } from "../user/base/User";

declare class USER_ID_TYPE_ANNOTATION {}
declare class USER_ID_CLASS {}
declare const ENTITY_NAME;

@ObjectType()
export class ENTITY_NAMEInfo implements Partial<ENTITY_NAME> {
  @Field(() => USER_ID_CLASS)
  id!: USER_ID_TYPE_ANNOTATION;
  @Field(() => String)
  username!: string;
  @Field(() => [String])
  roles!: string[];
  @Field(() => String, { nullable: true })
  accessToken?: string;
}
