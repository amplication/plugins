import { join } from "path";
import { builders } from "ast-types";

export const staticsPath = join(__dirname, "static");
export const templatesPath = join(__dirname, "templates");

export const STORAGE_SERVICE_ID = builders.identifier("LocalStorageService");
export const STORAGE_SERVICE_MEMBER_ID = builders.identifier(
  "localStorageService",
);
