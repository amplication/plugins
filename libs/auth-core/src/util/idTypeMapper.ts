import { types } from "@amplication/code-gen-types";
import { builders, namedTypes } from "ast-types";

const number = {
  class: "Number",
  type: "number",
};

const string = {
  class: "String",
  type: "string",
};

export const idTypeClassOptions: {
  [key in types.Id["idType"]]: namedTypes.Identifier;
} = {
  AUTO_INCREMENT: builders.identifier(number.class),
  AUTO_INCREMENT_BIG_INT: builders.identifier(number.class),
  UUID: builders.identifier(string.class),
  CUID: builders.identifier(string.class),
};

export const idTypeTSOptions: {
  [key in types.Id["idType"]]: namedTypes.Identifier;
} = {
  AUTO_INCREMENT: builders.identifier(number.type),
  AUTO_INCREMENT_BIG_INT: builders.identifier(number.type),
  UUID: builders.identifier(string.type),
  CUID: builders.identifier(string.type),
};
