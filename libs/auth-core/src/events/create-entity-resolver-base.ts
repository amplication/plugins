import {
  DsgContext,
  CreateEntityResolverBaseParams,
} from "@amplication/code-gen-types";
import { builders, namedTypes } from "ast-types";
import {
  resolverMethodsIdsActionPairs,
  EnumTemplateType,
} from "../core/create-method-id-action-entity-map";
import {
  interpolate,
  getClassDeclarationById,
  importNames,
  addImports,
  getClassMethodById,
} from "../util/ast";
import { addInjectableDependency } from "../util/nestjs-code-generation";
import { setAuthPermissions } from "../util/set-endpoint-permissions";

export function beforeCreateResolverBaseModule(
  context: DsgContext,
  eventParams: CreateEntityResolverBaseParams
) {
  const { templateMapping, entity, template, resolverBaseId } = eventParams;

  interpolate(template, templateMapping);

  const classDeclaration = getClassDeclarationById(template, resolverBaseId);

  const nestAccessControlImport = builders.importDeclaration(
    [
      builders.importNamespaceSpecifier(
        builders.identifier("nestAccessControl")
      ),
    ],
    builders.stringLiteral("nest-access-control")
  );

  const gqlACGuardImport = builders.importDeclaration(
    [builders.importNamespaceSpecifier(builders.identifier("gqlACGuard"))],
    builders.stringLiteral("../../auth/gqlAC.guard")
  );

  const gqlDefaultAuthGuardId = builders.identifier("GqlDefaultAuthGuard");
  const gqlDefaultAuthGuardImport = importNames(
    [gqlDefaultAuthGuardId],
    "../../auth/gqlDefaultAuth.guard"
  );

  const commonImport = builders.importDeclaration(
    [builders.importNamespaceSpecifier(builders.identifier("common"))],
    builders.stringLiteral("@nestjs/common")
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
  if (classDeclaration) {
    const metaClassMethod = getClassMethodById(
      classDeclaration,
      eventParams.templateMapping["META_QUERY"] as namedTypes.Identifier
    );
    const graphqlQueryDecorator = builders.decorator(
      builders.callExpression(
        builders.memberExpression(
          builders.identifier("graphql"),
          builders.identifier("Query")
        ),
        [
          builders.arrowFunctionExpression(
            [],
            builders.identifier("MetaQueryPayload")
          ),
        ]
      )
    );

    const useRolesDecorator = builders.decorator(
      builders.callExpression(
        builders.memberExpression(
          builders.identifier("nestAccessControl"),
          builders.identifier("UseRoles")
        ),
        [
          builders.objectExpression([
            builders.objectProperty(
              builders.identifier("resource"),
              eventParams.templateMapping[
                "ENTITY_NAME"
              ] as namedTypes.StringLiteral
            ),
            builders.objectProperty(
              builders.identifier("action"),
              builders.stringLiteral("read")
            ),
            builders.objectProperty(
              builders.identifier("possession"),
              builders.stringLiteral("any")
            ),
          ]),
        ]
      )
    );

    if (metaClassMethod && !metaClassMethod.decorators) {
      metaClassMethod.decorators = [];
    }
    metaClassMethod?.decorators?.unshift(
      graphqlQueryDecorator,
      useRolesDecorator
    );

    resolverMethodsIdsActionPairs(templateMapping, entity).forEach(
      ({ methodId, action, entity, permissionType, methodName }) => {
        setAuthPermissions(
          classDeclaration,
          methodId,
          action,
          entity.name,
          false,
          EnumTemplateType.ResolverBase,
          permissionType,
          methodName
        );
      }
    );
  }

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

  addInjectableDependency(
    classDeclaration,
    builders.identifier("rolesBuilder").name,
    builders.identifier("nestAccessControl.RolesBuilder"),
    "protected"
  );

  return eventParams;
}
