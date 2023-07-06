import { Module, DsgContext } from "@amplication/code-gen-types";
import { join } from "path";
import { OperationCanceledException } from "typescript";
import { templatesPath } from "../constants";
import { readFile } from "@amplication/code-gen-utils";
import {
  addImports,
  importNames,
  interpolate,
  removeTSClassDeclares,
} from "../util/ast";
import { builders, namedTypes } from "ast-types";
import { print } from "@amplication/code-gen-utils";

const basicStrategyBasePath = join(
  templatesPath,
  "basic.strategy.base.template.ts"
);

export async function createBasicStrategyBase(
  dsgContext: DsgContext
): Promise<Module> {
  return await mapBasicStrategyTemplate(
    dsgContext,
    basicStrategyBasePath,
    "basic.strategy.base.ts"
  );
}

async function mapBasicStrategyTemplate(
  context: DsgContext,
  templatePath: string,
  fileName: string
): Promise<Module> {
  const { entities, resourceInfo, serverDirectories } = context;
  const authEntity = entities?.find(
    (x) => x.name === resourceInfo?.settings.authEntityName
  );
  if (!authEntity) throw OperationCanceledException; //todo: handle the exception

  const entityInfoName = `${authEntity?.name}Info`;

  const template = await readFile(templatePath);
  const authEntityNameId = builders.identifier(entityInfoName);

  const entityNameImport = importNames(
    [authEntityNameId],
    `../../${entityInfoName}`
  );

  addImports(
    template,
    [entityNameImport].filter(
      (x) => x //remove nulls and undefined
    ) as namedTypes.ImportDeclaration[]
  );

  const templateMapping = {
    ENTITY_NAME_INFO: builders.identifier(`${authEntity.name}Info`),
  };

  const filePath = `${serverDirectories.authDirectory}/basic/base/${fileName}`;

  interpolate(template, templateMapping);

  removeTSClassDeclares(template);

  return {
    code: print(template).code,
    path: filePath,
  };
}
