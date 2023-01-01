import assert from "assert";
import { builders, namedTypes } from "ast-types";
import {
  EnumEntityAction,
} from "@amplication/code-gen-types";
import { getClassMethodById, removeDecoratorByName } from "./ast";
import {
  buildNessJsInterceptorDecorator,
  buildNestAccessControlDecorator,
  buildSwaggerForbiddenResponse,
} from "./nestjs-code-generation";

export const PUBLIC_DECORATOR_NAME = "Public";

export const ACL_FILTER_RESPONSE_INTERCEPTOR_NAME =
  "AclFilterResponseInterceptor";
export const ACL_VALIDATE_REQUEST_INTERCEPTOR_NAME =
  "AclValidateRequestInterceptor";

export function setAuthPermissions(
  classDeclaration: namedTypes.ClassDeclaration,
  methodId: namedTypes.Identifier,
  action: EnumEntityAction,
  entityName: string
): void {
  
  const classMethod = getClassMethodById(classDeclaration, methodId);

  if(!classMethod){
    return;
  }

  if (action === EnumEntityAction.Search || action === EnumEntityAction.View) {
    const filterResponseInterceptor = buildNessJsInterceptorDecorator(
      builders.identifier(ACL_FILTER_RESPONSE_INTERCEPTOR_NAME)
    );
    classMethod.decorators?.unshift(filterResponseInterceptor);
  }

  if (
    action === EnumEntityAction.Create ||
    action === EnumEntityAction.Update
  ) {
    const AclValidateRequestInterceptor = buildNessJsInterceptorDecorator(
      builders.identifier(ACL_VALIDATE_REQUEST_INTERCEPTOR_NAME)
    );
    classMethod.decorators?.unshift(AclValidateRequestInterceptor);
  }
  classMethod.decorators?.push(
    buildNestAccessControlDecorator(
      entityName,
      action.toLocaleLowerCase(),
      "any"
    )
  );
  classMethod.decorators?.push(buildSwaggerForbiddenResponse());
  removeDecoratorByName(classMethod, PUBLIC_DECORATOR_NAME);

}
