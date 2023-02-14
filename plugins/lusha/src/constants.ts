/**
 * @Amplication example constants file.
 * Add all your constants here.
 */
import { join } from "path";
import { namedTypes } from "ast-types";
import { Entity, EnumEntityAction } from "@amplication/code-gen-types";

export const staticsPath = join(__dirname, "static");
export const templatesPath = join(__dirname, "templates");

export type MethodsIdsActionEntityTriplet = {
  methodId: namedTypes.Identifier;
  action: EnumEntityAction;
  entity: Entity;
};