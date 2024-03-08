import { types, Module, DsgContext } from "@amplication/code-gen-types";
import { readFile, print } from "@amplication/code-gen-utils";
import {
  addImports,
  importNames,
  interpolate,
  removeTSClassDeclares,
} from "../util/ast";
import { builders, namedTypes } from "ast-types";
import { getUserIdType } from "../util/get-user-id-type";
import { join } from "path";
import { templatesPath } from "../constants";

const templatePath = join(templatesPath, "create-constants.template.ts");

export async function createAuthConstants(
  dsgContext: DsgContext
): Promise<Module> {
  const { serverDirectories, entities, resourceInfo } = dsgContext;
  try {
    const authEntity = entities?.find(
      (x) => x.name === resourceInfo?.settings.authEntityName
    );
    const serverAuthTestDir = `${serverDirectories.srcDirectory}/tests/auth`;
    const template = await readFile(templatePath);

    const entityNameInfo = `${authEntity?.name}Info`;
    const entityNameInfoId = builders.identifier(entityNameInfo);

    const entityNameInfoImport = importNames(
      [entityNameInfoId],
      `../../auth/${authEntity?.name}Info`
    );

    addImports(
      template,
      [entityNameInfoImport].filter(
        (x) => x //remove nulls and undefined
      ) as namedTypes.ImportDeclaration[]
    );

    const idType = getUserIdType(dsgContext);
    const templateMapping = prepareTemplateMapping(idType, entityNameInfo);
    const filePath = `${serverAuthTestDir}/constants.ts`;
    interpolate(template, templateMapping);
    removeTSClassDeclares(template);

    return { code: print(template).code, path: filePath };
  } catch (error) {
    console.log(error);
    return { code: "", path: "" };
  }
}

const idTypeTSOptions: {
  [key in types.Id["idType"]]: namedTypes.Expression;
} = {
  AUTO_INCREMENT: builders.numericLiteral(1),
  AUTO_INCREMENT_BIG_INT: builders.numericLiteral(1),
  UUID: builders.stringLiteral("cl7qmjh4h0000tothyjqapgj5"),
  CUID: builders.stringLiteral("cl7qmjh4h0000tothyjqapgj5"),
};

function prepareTemplateMapping(
  idType: types.Id["idType"],
  entityServiceName: string
) {
  return {
    ID_TYPE: idTypeTSOptions[idType],
    ENTITY_INFO: builders.identifier(entityServiceName),
  };
}
