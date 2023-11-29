import { JsonValue } from "type-fest";

export type Credentials = {
  phoneNumber: string;
  password: string;
};

export type InputJsonValue = Omit<JsonValue, "null">;
