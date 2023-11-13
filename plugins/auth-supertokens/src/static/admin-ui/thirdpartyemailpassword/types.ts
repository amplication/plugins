import { JsonValue } from "type-fest";

export type Credentials = {
  email: string;
  password: string;
};

export type InputJsonValue = Omit<JsonValue, "null">;
