import { Module } from "@amplication/code-gen-types";
import { join } from "path";
import { format } from "prettier";

export function createPackageJson(sdkPath: string): Module {
  const packageJson = {
    name: "client-sdk",
    dependencies: {
      axios: "^1.2.0",
    },
  };
  return {
    path: join(sdkPath, "package.json"),
    code: format(JSON.stringify(packageJson), { parser: "json-stringify" }),
  };
}
