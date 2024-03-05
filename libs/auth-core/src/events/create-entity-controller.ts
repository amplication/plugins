import {
  DsgContext,
  CreateEntityControllerParams,
} from "@amplication/code-gen-types";
import { builders, namedTypes } from "ast-types";
import {
  interpolate,
  getClassDeclarationById,
  addIdentifierToConstructorSuperCall,
  addImports,
} from "../util/ast";
import { addInjectableDependency } from "../util/nestjs-code-generation";

export function beforeCreateEntityControllerModule(
  context: DsgContext,
  eventParams: CreateEntityControllerParams
) {
  const { templateMapping, template } = eventParams;

  interpolate(template, templateMapping);

  const classDeclaration = getClassDeclarationById(
    template,
    templateMapping["CONTROLLER"]
  );

  const nestAccessControlImport = builders.importDeclaration(
    [
      builders.importNamespaceSpecifier(
        builders.identifier("nestAccessControl")
      ),
    ],
    builders.stringLiteral("nest-access-control")
  );

  const rolesBuilderIdentifier = builders.identifier("rolesBuilder");

  const injectRolesBuilderDecorator = builders.decorator(
    builders.callExpression(
      builders.memberExpression(
        builders.identifier("nestAccessControl"),
        builders.identifier("InjectRolesBuilder")
      ),
      []
    )
  );

  addInjectableDependency(
    classDeclaration,
    rolesBuilderIdentifier.name,
    builders.identifier("nestAccessControl.RolesBuilder"),
    "protected",
    [injectRolesBuilderDecorator]
  );

  addIdentifierToConstructorSuperCall(template, rolesBuilderIdentifier);

  addImports(
    eventParams.template,
    [nestAccessControlImport].filter(
      (x) => x //remove nulls and undefined
    ) as namedTypes.ImportDeclaration[]
  );

  return eventParams;
}
