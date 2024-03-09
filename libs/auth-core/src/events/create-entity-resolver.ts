import {
  CreateEntityResolverParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { builders, namedTypes } from "ast-types";
import {
  interpolate,
  getClassDeclarationById,
  importNames,
  addImports,
  addIdentifierToConstructorSuperCall,
} from "../util/ast";
import { addInjectableDependency } from "../util/nestjs-code-generation";

export function beforeCreateResolverModule(
  context: DsgContext,
  eventParams: CreateEntityResolverParams
) {
  const { templateMapping, template } = eventParams;
  interpolate(template, templateMapping);

  const classDeclaration = getClassDeclarationById(
    template,
    templateMapping["RESOLVER"]
  );

  const commonImport = builders.importDeclaration(
    [builders.importNamespaceSpecifier(builders.identifier("common"))],
    builders.stringLiteral("@nestjs/common")
  );

  const nestAccessControlImport = builders.importDeclaration(
    [
      builders.importNamespaceSpecifier(
        builders.identifier("nestAccessControl")
      ),
    ],
    builders.stringLiteral("nest-access-control")
  );

  const gqlDefaultAuthGuardImport = importNames(
    [builders.identifier("GqlDefaultAuthGuard")],
    "../auth/gqlDefaultAuth.guard"
  );

  const gqlACGuardImport = builders.importDeclaration(
    [builders.importNamespaceSpecifier(builders.identifier("gqlACGuard"))],
    builders.stringLiteral("../auth/gqlAC.guard")
  );

  addImports(
    eventParams.template,
    [
      nestAccessControlImport,
      gqlACGuardImport,
      gqlDefaultAuthGuardImport,
      commonImport,
    ].filter(
      (x) => x //remove nulls and undefined
    ) as namedTypes.ImportDeclaration[]
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

  const guardDecorator = builders.decorator(
    builders.callExpression(
      builders.memberExpression(
        builders.identifier("common"),
        builders.identifier("UseGuards")
      ),
      [
        builders.identifier("GqlDefaultAuthGuard"),
        builders.memberExpression(
          builders.identifier("gqlACGuard"),
          builders.identifier("GqlACGuard")
        ),
      ]
    )
  );

  const resolverDecorator = builders.decorator(
    builders.callExpression(
      builders.memberExpression(
        builders.identifier("graphql"),
        builders.identifier("Resolver")
      ),
      [
        builders.arrowFunctionExpression(
          [],
          eventParams.templateMapping["ENTITY"]
        ),
      ]
    )
  );

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  classDeclaration.decorators = [guardDecorator, resolverDecorator];

  return eventParams;
}
