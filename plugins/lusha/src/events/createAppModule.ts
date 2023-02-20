import { join, resolve } from "path";
import * as recast from "recast";
import { CreateServerAppModuleParams, DsgContext, Module } from "@amplication/code-gen-types";
import { builders } from "ast-types";

const appModuleTemplatePath = join(
  resolve(__dirname, "./templates"),
  "appModule.template.ts"
);

export const afterCreateAppModule = (
  context: DsgContext,
  eventParams: CreateServerAppModuleParams,
  modules: Module[]
) => {
  return modules;
}

const createObjectExpression = () => {
  builders.createObjectExpression([
    builders.objectProperty(builders.identifier("path"), builders.stringLiteral("/lusha-pet")),
    builders.objectProperty(builders.identifier("method"), builders.memberExpression(builders.identifier("RequestMethod"), builders.identifier("ALL"))),
  ])
}

const createEntitiesRoutes = () => {
  recast.visit(ast, {
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
                  callExpressionNode.arguments.push(identifier)
                }
              })
            }
          })
        }
      }
    }
})
}