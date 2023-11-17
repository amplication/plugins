import { join, resolve } from "path";
import * as recast from "recast";
import {
  CreateServerAppModuleParams,
  DsgContext,
  Module,
} from "@amplication/code-gen-types";
import { readFile, print } from "@amplication/code-gen-utils";
import { builders, namedTypes } from "ast-types";
import { addImports, interpolate } from "../util/ast";

const appModuleTemplatePath = join(
  resolve(__dirname, "./templates"),
  "appModule.template.ts"
);

export const beforeCreateAppModule = (
  context: DsgContext,
  eventParams: CreateServerAppModuleParams
) => {
  context.utils.skipDefaultBehavior = true;

  return eventParams;
};

export const afterCreateAppModule = async (
  context: DsgContext,
  eventParams: CreateServerAppModuleParams,
  modules: Module[]
) => {
  const { DTOs } = context;
  const entitiesDtos = Object.keys(DTOs);
  const template = await readFile(appModuleTemplatePath);

  createEntitiesRoutes(template, entitiesDtos);

  interpolate(template, {
    MODULES: builders.arrayExpression([
      builders.identifier("PrismaModule"),
      ...entitiesDtos.map((entity) =>
        builders.identifier(`Sapphire${entity}Module`)
      ),
      builders.identifier("ConfigModule"),
    ]),
  });
  createClassImport(template, entitiesDtos);

  return [
    {
      path: "server/src/app.module.ts",
      code: print(template).code,
    },
  ];
};

const createClassImport = (
  template: namedTypes.File,
  entitiesDtos: string[]
) => {
  const entitiesImportArr = entitiesDtos.map((entityName: string) =>
    builders.importDeclaration(
      [
        builders.importSpecifier(
          builders.identifier(`Sapphire${entityName}Module`)
        ),
      ],
      builders.stringLiteral(`./app/${entityName}/${entityName}.module`)
    )
  );

  addImports(template, entitiesImportArr);
};

const createObjectExpression = (entityName: string) =>
  builders.objectExpression([
    builders.objectProperty(
      builders.identifier("path"),
      builders.stringLiteral(`/Sapphire-${entityName}`)
    ),
    builders.objectProperty(
      builders.identifier("method"),
      builders.memberExpression(
        builders.identifier("RequestMethod"),
        builders.identifier("ALL")
      )
    ),
  ]);

const createEntitiesRoutes = (
  template: namedTypes.File,
  entityArr: string[]
) => {
  const objectExpressionArr = entityArr.map((entity: string) =>
    createObjectExpression(entity)
  );
  recast.visit(template, {
    visitClassMethod(path) {
      const classMethodNode = path.node;
      recast.visit(classMethodNode, {
        visitBlockStatement(path) {
          const blockStatementNode = path.node;
          recast.visit(blockStatementNode, {
            visitExpressionStatement(path) {
              const expressionStatementNode = path.node;
              recast.visit(expressionStatementNode, {
                visitCallExpression(path) {
                  const callExpressionNode = path.node;
                  /// TODO: fetch `forRoutes` call expression
                  if (!callExpressionNode.arguments.length) {
                    callExpressionNode.arguments.push(...objectExpressionArr);
                  }

                  this.traverse(path);
                },
              });
              this.traverse(path);
            },
          });
          this.traverse(path);
        },
      });
      this.traverse(path);
    },
  });
};
