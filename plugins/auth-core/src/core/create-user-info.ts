import { types, Module, DsgContext } from "@amplication/code-gen-types";
import { readFile } from "@amplication/code-gen-utils";
import { interpolate, removeTSClassDeclares } from "../util/ast";
import { builders, namedTypes } from "ast-types";
import { print } from "@amplication/code-gen-utils";
import { getUserIdType } from "../util/get-user-id-type";
import { join } from "path";
import { templatesPath } from "../constants";
import { OperationCanceledException } from "typescript";
import { Entity } from "@amplication/code-gen-types/src/models";

const userInfoPath = join(templatesPath, "user-info.template.ts");

export async function createUserInfo(dsgContext: DsgContext): Promise<Module> {
  const { serverDirectories, resourceInfo } = dsgContext;

  const authEntity = resourceInfo?.settings.authEntity;
  if (!authEntity) {
    throw new OperationCanceledException(); //todo: replace with right exception
  }

  const authDir = `${serverDirectories.authDirectory}`;
  const template = await readFile(userInfoPath);
  const idType = getUserIdType(dsgContext);
  const templateMapping = prepareTemplateMapping(idType, authEntity);
  const filePath = `${authDir}/${authEntity.name}Info.ts`;
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
  };
}
