import {
  CreateEntityServiceParams,
  DsgContext,
  EnumDataType,
} from "@amplication/code-gen-types";
import {
  addIdentifierToConstructorSuperCall,
  addImports,
  addInjectableDependency,
  getClassDeclarationById,
  importNames,
  interpolate,
} from "../util/ast";
import { camelCase } from "lodash";
import { STORAGE_SERVICE_ID, STORAGE_SERVICE_MEMBER_ID } from "../constants";

export const beforeCreateEntityService = async (
  context: DsgContext,
  eventParams: CreateEntityServiceParams,
) => {
  const { entities } = context;
  const { template, templateMapping, entityName, serviceId } = eventParams;

  const entity = entities?.find(
    (entity) => camelCase(entity.name) === entityName,
  );

  if (!entity?.fields?.some((field) => field.dataType === EnumDataType.File)) {
    return eventParams;
  }

  interpolate(template, templateMapping);

  const classDeclaration = getClassDeclarationById(template, serviceId);

  addInjectableDependency(
    classDeclaration,
    STORAGE_SERVICE_MEMBER_ID.name,
    STORAGE_SERVICE_ID,
    "protected",
  );

  addIdentifierToConstructorSuperCall(template, STORAGE_SERVICE_MEMBER_ID);

  const localStorageServiceImport = importNames(
    [STORAGE_SERVICE_ID],
    "src/storage/providers/local/local.storage.service",
  );

  addImports(template, [localStorageServiceImport]);

  return eventParams;
};
