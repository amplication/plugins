import { Module } from "@amplication/code-gen-types";
import { builders } from "ast-types";
import { join } from "path";
import { print } from "recast";
import { EntityWithMeta } from "../types";
import { relativeImportPath } from "../util";

const { program, file, exportAllDeclaration, stringLiteral } = builders;

export function createIndexFile(
  entitiesFolder: string,
  modules: EntityWithMeta[]
): Module {
  const astFile = file(program([]));
  modules.forEach((module) => {
    const relativePath = relativeImportPath(
      module.module.path,
      module.module.path
    );
    astFile.program.body.push(
      exportAllDeclaration(stringLiteral(relativePath), null)
    );
  });
  return {
    code: print(astFile).code,
    path: join(entitiesFolder, "index.ts"),
  };
}
