import { builders, namedTypes } from "ast-types";
import { EntityWithMeta } from "types";
import { camelCase } from "lodash";

const {
  identifier,
  tsTypeReference,
  tsTypeAnnotation,
  privateName,
  classProperty,
  functionExpression,
  methodDefinition,
  returnStatement,
  memberExpression,
  blockStatement,
  thisExpression,
} = builders;

export function createGettersFunction(
  clientClass: namedTypes.ClassDeclaration,
  entitiesModules: EntityWithMeta[]
) {
  entitiesModules.forEach((moduleWithMeta) => {
    clientClass.body.body.push(
      methodDefinition(
        "get",
        identifier(camelCase(moduleWithMeta.entity.displayName)),
        functionExpression(
          null,
          [],
          blockStatement([
            returnStatement(
              memberExpression(
                thisExpression(),
                privateName(
                  identifier(camelCase(moduleWithMeta.entity.displayName))
                )
              )
            ),
          ]),
          false,
          false
        ),
        false
      )
    );
  });
}
