import { JsonValue } from "type-fest";

export type Credentials = {
  otp: string
};

export type InputJsonValue = Omit<JsonValue, "null">;
