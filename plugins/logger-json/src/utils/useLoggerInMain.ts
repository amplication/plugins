import { BuildLogger, ModuleMap } from "@amplication/code-gen-types";
import { appendImports, parse, print } from "@amplication/code-gen-utils";
import { builders as b, visit } from "ast-types";
import { join } from "path";
import { importNames } from "./ast";

export const useLoggerInMain = (
  srcDir: string,
  modules: ModuleMap,
  logger: BuildLogger,
) => {
  logger.info("Adding custom logger module in main.ts");

  const mainModule = modules.get(join(srcDir, "main.ts"));
  if (!mainModule) {
    throw new Error("Failed to find main.ts module");
  }

  const mainCode = parse(mainModule.code);

  visit(mainCode, {
    visitVariableDeclaration: function (path) {
      if (
        path.node.declarations.length !== 1 ||
        path.node.declarations[0].type !== "VariableDeclarator" ||
        path.node.declarations[0].id.type !== "Identifier" ||
        path.node.declarations[0].id.name !== "app"
      ) {
        return false;
      }

      const rightSide = path.node.declarations[0].init;

      if (
        !rightSide ||
        rightSide.type !== "AwaitExpression" ||
        !rightSide.argument ||
        rightSide.argument.type !== "CallExpression" ||
        rightSide.argument.callee.type !== "MemberExpression" ||
        rightSide.argument.callee.object.type !== "Identifier" ||
        rightSide.argument.callee.object.name !== "NestFactory" ||
        rightSide.argument.callee.property.type !== "Identifier" ||
        rightSide.argument.callee.property.name !== "create"
      ) {
        return false;
      }

      const args = rightSide.argument.arguments;

      if (
        args[0].type !== "Identifier" ||
        args[0].name !== "AppModule" ||
        args[1].type !== "ObjectExpression"
      ) {
        return false;
      }

      // Add the bufferLogs configuration to NestJS app instance
      args[1].properties.push(
        b.objectProperty(b.identifier("bufferLogs"), b.literal(true)),
      );

      appendImports(mainCode, [
        importNames([b.identifier("Logger")], "nestjs-pino"),
      ]);

      // Add the custom logger
      const useLoggerStatement = b.expressionStatement(
        b.callExpression(
          b.memberExpression(b.identifier("app"), b.identifier("useLogger")),
          [
            b.callExpression(
              b.memberExpression(b.identifier("app"), b.identifier("get")),
              [b.identifier("Logger")],
            ),
          ],
        ),
      );

      path.insertAfter(useLoggerStatement);

      return false;
    },
  });

  modules.replace(mainModule, {
    path: mainModule.path,
    code: print(mainCode).code,
  });
};
