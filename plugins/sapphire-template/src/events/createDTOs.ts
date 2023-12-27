import {
  CreateDTOsParams,
  DsgContext,
  Module,
} from "@amplication/code-gen-types";
import { parse, print } from "@amplication/code-gen-utils";
import { namedTypes, visit } from "ast-types";

export const afterCreateDTOs = (
  context: DsgContext,
  eventParams: CreateDTOsParams,
  modules: Module[]
): Module[] =>
  modules.map((module: Module) => {
    const file = parse(module.code);
    updateDtoImportPath(file);

    return {
      path: module.path,
      code: print(file).code,
    };
  });

const updateDtoImportPath = (template: namedTypes.File) => {
  visit(template, {
    visitImportDeclaration(path) {
      // find relations path
      if (/(?:\.\.\/\.\.\/+)|(?:\/base\/+)/g.test(path.value.source.value)) {
        const splitPath = path.value.source.value.split("/");
        const manipulatedPath = splitPath.reduce(
          (finalPath: string, stringPath: string) => {
            const addedStr = stringPath.includes("base")
              ? "model/dtos"
              : stringPath;
            finalPath += `${addedStr}/`;

            return finalPath;
          },
          "../"
        );

        path.value.source.value = manipulatedPath.slice(0, -1);
      }
      // find util path
      if (/(?:\/util\/+)/.test(path.value.source.value)) {
        const removeAll = path.value.source.value.replaceAll("../", "");
        path.value.source.value = `../../../../${removeAll}`;
      }

      this.traverse(path);
    },
  });
};
