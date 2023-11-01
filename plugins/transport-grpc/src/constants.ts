import { VariableDictionary } from "@amplication/code-gen-types";
import { join } from "path";

export const envVariables: VariableDictionary = [
  { GRPC_CLIENT_URL_PATH: "localhost:9090" },
];

export const staticsPath = join(__dirname, "static");
export const templatesPath = join(__dirname, "templates");
