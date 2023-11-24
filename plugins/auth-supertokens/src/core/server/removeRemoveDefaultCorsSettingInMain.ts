import { BuildLogger, ModuleMap } from "@amplication/code-gen-types";
import { parse, print } from "@amplication/code-gen-utils";
import { join } from "path";
import { visit } from "recast";

export const removeRemoveDefaultCorsSettingInMain = (
  srcDir: string,
  modules: ModuleMap,
  logger: BuildLogger
) => {
  logger.info("Removing the default cors setting in main.ts");
  const mainModule = modules.get(join(srcDir, "main.ts"));
  if (!mainModule) {
    throw new Error("Failed to find the main.ts module");
  }
  const mainCode = parse(mainModule.code);
  let foundCorsProp = false;

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
      if (args.length !== 2) {
        return false;
      }
      if (
        args[0].type !== "Identifier" ||
        args[0].name !== "AppModule" ||
        args[1].type !== "ObjectExpression" ||
        args[1].properties.length !== 1 ||
        args[1].properties[0].type !== "ObjectProperty" ||
        args[1].properties[0].key.type !== "Identifier" ||
        args[1].properties[0].key.name !== "cors"
      ) {
        return false;
      }
      foundCorsProp = true;
      args.pop();
      return false;
    },
  });

  if (!foundCorsProp) {
    throw new Error(
      `Failed to find the NestFactory app instantiation in the ${srcDir}/main.ts main function`
    );
  }
  modules.replace(mainModule, {
    path: mainModule.path,
    code: print(mainCode).code,
  });
};
