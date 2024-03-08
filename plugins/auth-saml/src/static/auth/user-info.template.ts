import { Field, ObjectType } from "@nestjs/graphql";

declare class USER_ID_TYPE_ANNOTATION {}
declare class USER_ID_CLASS {}
declare class ENTITY_NAME {}

@ObjectType()
export class ENTITY_NAME_INFO implements Partial<ENTITY_NAME> {
  @Field(() => USER_ID_CLASS)
  id!: USER_ID_TYPE_ANNOTATION;
  @Field(() => String)
  username!: string;
  @Field(() => [String])
  roles!: string[];
  @Field(() => String)
  sessionId!: string;
  @Field(() => String, { nullable: true })
  accessToken?: string;
}
