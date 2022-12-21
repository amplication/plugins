import { builders, namedTypes } from "ast-types";

export function buildNessJsInterceptorDecorator(
  identifier: namedTypes.Identifier
): namedTypes.Decorator {
  return builders.decorator(
    builders.callExpression(
      builders.memberExpression(
        builders.identifier("common"),
        builders.identifier("UseInterceptors")
      ),
      [builders.identifier(identifier.name)]
    )
  );
}

export function buildSwaggerForbiddenResponse(): namedTypes.Decorator {
  return builders.decorator(
    builders.callExpression(
      builders.memberExpression(
        builders.identifier("swagger"),
        builders.identifier("ApiForbiddenResponse")
      ),
      [
        builders.objectExpression([
          builders.objectProperty(
            builders.identifier("type"),
            builders.identifier("errors.ForbiddenException")
          ),
        ]),
      ]
    )
  );
}

export function buildNestAccessControlDecorator(
  resource: string,
  action: string,
  possession: string
): namedTypes.Decorator {
  return builders.decorator(
    builders.callExpression(
      builders.memberExpression(
        builders.identifier("nestAccessControl"),
        builders.identifier("UseRoles")
      ),
      [
        builders.objectExpression([
          builders.objectProperty(
            builders.identifier("resource"),
            builders.stringLiteral(resource)
          ),
          builders.objectProperty(
            builders.identifier("action"),
            builders.stringLiteral(action)
          ),
          builders.objectProperty(
            builders.identifier("possession"),
            builders.stringLiteral(possession)
          ),
        ]),
      ]
    )
  );
}
