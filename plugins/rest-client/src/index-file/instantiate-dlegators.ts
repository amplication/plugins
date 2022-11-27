import { builders, namedTypes } from "ast-types";
import { EntityWithMeta } from "../types";
import { findConstructor } from "../util/ast";
import { parse } from "../util";
import { getFistClassInFile } from "../util";
import { camelCase } from "lodash";

const {
  identifier,
  privateName,
  memberExpression,
  thisExpression,
  expressionStatement,
  assignmentExpression,
  newExpression,
} = builders;

export async function instantiateDelegators(
  clientClass: namedTypes.ClassDeclaration,
  entitiesModules: EntityWithMeta[]
) {
  const constructor = findConstructor(clientClass);
  if (!constructor) {
    throw new Error("No constructor found");
  }
  await Promise.all(
    entitiesModules.map(async (moduleWithMeta) => {
      const classDelegate = await getFistClassInFile(
        parse(moduleWithMeta.module.code)
      );
      const className = classDelegate.id?.name;
      if (!className) {
        throw new Error("Missing class name");
      }
      console.log(className);

      const instatiationStatment = expressionStatement(
        assignmentExpression(
          "=",
          memberExpression(
            thisExpression(),
            privateName(
              identifier(camelCase(moduleWithMeta.entity.displayName))
            ),
            false
          ),
          newExpression(
            memberExpression(
              identifier("entities"),
              identifier(className),
              false
            ),
            [memberExpression(thisExpression(), identifier("axios"), false)]
          )
        )
      );
      constructor.body.body.push(instatiationStatment);
    })
  );
}
