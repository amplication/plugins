import { Entity } from "@amplication/code-gen-types";
import { builders, namedTypes } from "ast-types";
import { readFile } from "fs/promises";
import { pascalCase } from "pascal-case";
import { join, resolve } from "path";
import { print } from "recast";
import { EntityWithMeta } from "../types";
import { parse } from "../util";
import { interpolate, removeTSIgnoreComments } from "../util/ast";

const {
  exportDeclaration,
  program,
  file,
  identifier,
  classBody,
  stringLiteral,
  tsParameterProperty,
  templateLiteral,
  tsTypeReference,
  classDeclaration,
  tsTypeAnnotation,
  classMethod,
  blockStatement,
} = builders;

export async function createEntities(
  entitiesFolder: string,
  entities: Entity[]
): Promise<EntityWithMeta[]> {
  const data = entities.map(async (entity) => ({
    module: {
      path: join(
        entitiesFolder,
        `${pascalCase(entity.displayName)}Delegate.ts`
      ),
      code: print(await createEntity(entity)).code,
    },
    entity,
  }));
  return await Promise.all(data);
}

async function createEntity(entity: Entity): Promise<namedTypes.ASTNode> {
  const classId = identifier(`${pascalCase(entity.displayName)}Delegate`);
  const templatePath = join(__dirname, "./crud.template.ts");
  const file = await readFile(templatePath, {
    encoding: "utf-8",
  });
  const astFile = parse(file);

  //TODO select the url from the server
  interpolate(astFile, {
    DELEGATE_NAME: classId,
    PATH: stringLiteral(`/api/${entity.name}`),
  });

  removeTSIgnoreComments(astFile);

  return astFile;
}
