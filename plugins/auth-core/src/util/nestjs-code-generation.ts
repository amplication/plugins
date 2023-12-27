import { builders, namedTypes } from "ast-types";
import { findConstructor } from "./ast";

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

export function addInjectableDependency(
  classDeclaration: namedTypes.ClassDeclaration,
  name: string,
  typeId: namedTypes.Identifier,
  accessibility: "public" | "private" | "protected",
  decorators?: namedTypes.Decorator[]
): void {
  const constructor = findConstructor(classDeclaration);

  if (!constructor) {
    throw new Error("Could not find given class declaration constructor");
  }

  const propToInject = builders.tsParameterProperty.from({
    accessibility: accessibility,
    readonly: true,
    parameter: builders.identifier.from({
      name: name,
      typeAnnotation: builders.tsTypeAnnotation(
        builders.tsTypeReference(typeId)
      ),
    }),
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  propToInject.decorators = decorators;

  constructor.params.push(propToInject);
}
