import { builders, namedTypes } from "ast-types";
import {
  EnumEntityAction,
  EnumEntityPermissionType,
} from "@amplication/code-gen-types";
import { getClassMethodById, removeDecoratorByName } from "./ast";
import {
  buildNessJsInterceptorDecorator,
  buildNestAccessControlDecorator,
  buildSwaggerForbiddenResponse,
} from "./nestjs-code-generation";
import { EnumTemplateType } from "../core/create-method-id-action-entity-map";

export const PUBLIC_DECORATOR_NAME = "Public";

export const ACL_FILTER_RESPONSE_INTERCEPTOR_NAME =
  "AclFilterResponseInterceptor";
export const ACL_VALIDATE_REQUEST_INTERCEPTOR_NAME =
  "AclValidateRequestInterceptor";

export function setAuthPermissions(
  classDeclaration: namedTypes.ClassDeclaration,
  methodId: namedTypes.Identifier,
  action: EnumEntityAction,
  entityName: string,
  createSwaggerDecorator: boolean,
  templateType: EnumTemplateType,
  permissionType?: EnumEntityPermissionType,
  methodName?: string,
): void {
  const classMethod = getClassMethodById(classDeclaration, methodId);
  if (!classMethod) {
    return;
  }

  if (permissionType === EnumEntityPermissionType.Public) {
    return;
  }

  const isActionSearchOrView =
    action === EnumEntityAction.Search || action === EnumEntityAction.View;

  if (isActionSearchOrView) {
    const filterResponseInterceptor = buildNessJsInterceptorDecorator(
      builders.identifier(ACL_FILTER_RESPONSE_INTERCEPTOR_NAME),
    );
    classMethod.decorators?.unshift(filterResponseInterceptor);
  }

  if (
    (action === EnumEntityAction.Create ||
      action === EnumEntityAction.Update) &&
    templateType !== EnumTemplateType.controllerToManyMethods
  ) {
    const AclValidateRequestInterceptor = buildNessJsInterceptorDecorator(
      builders.identifier(ACL_VALIDATE_REQUEST_INTERCEPTOR_NAME),
    );
    classMethod.decorators?.unshift(AclValidateRequestInterceptor);
  }

  let possessionType = "any";
  if (
    methodName === "FIND_ONE_ENTITY_FUNCTION" ||
    methodName === "ENTITY_QUERY"
  ) {
    possessionType = "own";
  }
  classMethod.decorators?.push(
    buildNestAccessControlDecorator(
      entityName,
      isActionSearchOrView ? "read" : action.toLocaleLowerCase(),
      possessionType,
    ),
  );

  if (
    createSwaggerDecorator &&
    templateType !== EnumTemplateType.controllerToManyMethods
  ) {
    classMethod.decorators?.push(buildSwaggerForbiddenResponse());
  }

  removeDecoratorByName(classMethod, PUBLIC_DECORATOR_NAME);
}
