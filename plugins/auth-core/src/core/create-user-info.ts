import { types, Module, DsgContext, Entity } from "@amplication/code-gen-types";
import { readFile } from "@amplication/code-gen-utils";
import {
  addImports,
  importNames,
  interpolate,
  removeTSClassDeclares,
} from "../util/ast";
import { builders, namedTypes } from "ast-types";
import { print } from "@amplication/code-gen-utils";
import { getUserIdType } from "../util/get-user-id-type";
import { join } from "path";
import { templatesPath } from "../constants";

const userInfoPath = join(templatesPath, "user-info.template.ts");

export async function createUserInfo(dsgContext: DsgContext): Promise<Module> {
  const { serverDirectories, resourceInfo, entities } = dsgContext;

  const authEntity = entities?.find(
    (x) => x.name === resourceInfo?.settings.authEntityName
  );
  if (!authEntity) {
    dsgContext.logger.error("Authentication entity does not exist");
    return { code: "", path: "" };
  }

  const authDir = `${serverDirectories.authDirectory}`;
  const template = await readFile(userInfoPath);
  const idType = getUserIdType(dsgContext);
  const templateMapping = prepareTemplateMapping(idType, authEntity);
  const { name } = authEntity;

  const entityNameModuleId = builders.identifier(name);
  const entityNamImport = importNames(
    [entityNameModuleId],
    `../${name.toLowerCase()}/base/${name}`
  );

  addImports(
    template,
    [entityNamImport].filter(
      (x) => x //remove nulls and undefined
    ) as namedTypes.ImportDeclaration[]
  );

  const filePath = `${authDir}/${name}Info.ts`;
  interpolate(template, templateMapping);
  removeTSClassDeclares(template);

  return { code: print(template).code, path: filePath };
}

function prepareTemplateMapping(
  idType: types.Id["idType"],
  authEntity: Entity
) {
  const number = {
    class: "Number",
    type: "number",
  };

  const string = {
    class: "String",
    type: "string",
  };

  const idTypClassOptions: {
    [key in types.Id["idType"]]: namedTypes.Identifier;
  } = {
    AUTO_INCREMENT: builders.identifier(number.class),
    UUID: builders.identifier(string.class),
    CUID: builders.identifier(string.class),
  };

  /* eslint-disable @typescript-eslint/naming-convention */
  const idTypeTSOptions: {
    [key in types.Id["idType"]]: namedTypes.Identifier;
  } = {
    AUTO_INCREMENT: builders.identifier(number.type),
    UUID: builders.identifier(string.type),
    CUID: builders.identifier(string.type),
  };

  return {
    USER_ID_TYPE_ANNOTATION: idTypeTSOptions[idType],
    USER_ID_CLASS: idTypClassOptions[idType],
    ENTITY_NAME: builders.identifier(authEntity.name),
    ENTITY_NAME_INFO: builders.identifier(`${authEntity.name}Info`),
  };
}
