import {
  DsgContext,
  CreateEntityControllerBaseParams,
  EnumEntityPermissionType,
} from "@amplication/code-gen-types";
import { builders, namedTypes } from "ast-types";
import {
  controllerMethodsIdsActionPairs,
  EnumTemplateType,
} from "../core/create-method-id-action-entity-map";
import {
  interpolate,
  getClassDeclarationById,
  addImports,
  getClassMethodById,
} from "../util/ast";
import {
  addInjectableDependency,
  buildSwaggerForbiddenResponse,
} from "../util/nestjs-code-generation";
import { setAuthPermissions } from "../util/set-endpoint-permissions";

export function beforeCreateControllerBaseModule(
  context: DsgContext,
  eventParams: CreateEntityControllerBaseParams
) {
  const { templateMapping, entity, template, controllerBaseId } = eventParams;

  interpolate(template, templateMapping);

  const classDeclaration = getClassDeclarationById(template, controllerBaseId);

  addInjectableDependency(
    classDeclaration,
    builders.identifier("rolesBuilder").name,
    builders.identifier("nestAccessControl.RolesBuilder"),
    "protected"
  );

  const nestAccessControlImport = builders.importDeclaration(
    [
      builders.importNamespaceSpecifier(
        builders.identifier("nestAccessControl")
      ),
    ],
    builders.stringLiteral("nest-access-control")
  );

  const defaultAuthGuardImport = builders.importDeclaration(
    [
      builders.importNamespaceSpecifier(
        builders.identifier("defaultAuthGuard")
      ),
    ],
    builders.stringLiteral("../../auth/defaultAuth.guard")
  );

  addImports(
    eventParams.template,
    [nestAccessControlImport, defaultAuthGuardImport].filter(
      (x) => x //remove nulls and undefined
    ) as namedTypes.ImportDeclaration[]
  );

  const swaggerDecorator = builders.decorator(
    builders.callExpression(
      builders.memberExpression(
        builders.identifier("swagger"),
        builders.identifier("SWAGGER_API_AUTH_FUNCTION")
      ),
      []
    )
  );

  const guardDecorator = builders.decorator(
    builders.callExpression(
      builders.memberExpression(
        builders.identifier("common"),
        builders.identifier("UseGuards")
      ),
      [
        builders.memberExpression(
          builders.identifier("defaultAuthGuard"),
          builders.identifier("DefaultAuthGuard")
        ),
        builders.memberExpression(
          builders.identifier("nestAccessControl"),
          builders.identifier("ACGuard")
        ),
      ]
    )
  );

  //@ts-expect-error - decorators is not defined in type
  classDeclaration.decorators = [swaggerDecorator, guardDecorator];

  if (classDeclaration) {
    controllerMethodsIdsActionPairs(templateMapping, entity).forEach(
      ({ methodId, action, entity, permissionType, methodName }) => {
        setAuthPermissions(
          classDeclaration,
          methodId,
          action,
          entity.name,
          true,
          EnumTemplateType.ControllerBase,
          permissionType,
          methodName
        );
        if (permissionType === EnumEntityPermissionType.Public) {
          const classMethod = getClassMethodById(classDeclaration, methodId);
          classMethod?.decorators?.push(buildSwaggerForbiddenResponse());
        }
      }
    );
  }

  return eventParams;
}
