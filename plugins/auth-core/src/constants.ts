import { VariableDictionary } from "@amplication/code-gen-types";
import { resolve } from "path";

export const envVariables: VariableDictionary = [
  { JWT_SECRET_KEY: "Change_ME!!!" },
  { JWT_EXPIRATION: "2d" },
];

export const templatesPath = resolve(__dirname, "./templates"); 
