import { Module, ModuleMap } from "@amplication/code-gen-types";
import { parse } from "@amplication/code-gen-utils";
import { builders, namedTypes, NodePath } from "ast-types";
import { print } from "@amplication/code-gen-utils";
import { visit } from "recast";

/**
 * Disable the playground option in the GraphQLModule settings
 * and set the cors to accept requests with credentials
 * from the supertokens websiteDomain.
 */
export const alterGraphqlSettingsInAppModule = (modules: ModuleMap, appModule: Module) => {
  // Removing duplicate auth module imports here because
  // the parse(appModule.code) keeps failing sue to duplicate
  // AuthModule imports
  appModule.code = removeDuplicateAuthModuleImports(appModule.code);
  const code = parse(appModule.code);
  visit(code, {
    visitClassDeclaration: function(path) {
      if(path.node.id?.name !== "AppModule") {
        return false;
      }
      let moduleDecArg;
      //@ts-ignore
      for(const d of path.node.decorators) {
        const dec = d as namedTypes.Decorator;
        if(dec.expression.type !== "CallExpression" 
          || dec.expression.callee.type !== "Identifier"
          || dec.expression.callee.name !== "Module"
          || dec.expression.arguments.length !== 1
          || dec.expression.arguments[0].type !== "ObjectExpression") {
          continue;
        }
        moduleDecArg = dec.expression.arguments[0];
      }
      if(!moduleDecArg) {
        return false;
      }
      this.traverse(new NodePath(moduleDecArg, path, "objectExpression"));
    },
    visitCallExpression: function(path) {
      const callee = path.node.callee;
      if(callee.type !== "MemberExpression" 
        || callee.object.type !== "Identifier"
        || callee.property.type !== "Identifier"
        || callee.object.name !== "GraphQLModule"
        || callee.property.name !== "forRootAsync") {
        return false;
      }
      this.traverse(path, {
        visitReturnStatement: function(path) {
          const stmt = path.node as namedTypes.ReturnStatement;
          if(!stmt.argument || stmt.argument.type !== "ObjectExpression") {
            return false;
          }
          const obj = stmt.argument;
          obj.properties = obj.properties.filter((prop) => (
            !(prop.type === "ObjectProperty"
            && prop.key.type === "Identifier"
            && prop.key.name === "playground")
          ));
          obj.properties.push(playgroundDisabledProp(), corsSettingProp())
          return false;
        }
      })
    },
  })
  appModule.code = print(code).code;
}

const playgroundDisabledProp = (): namedTypes.ObjectProperty => {
  return builders.objectProperty(
    builders.identifier("playground"),
    builders.booleanLiteral(false)
  )
}

const corsSettingProp = (): namedTypes.ObjectProperty => {
  return builders.objectProperty(
    builders.identifier("cors"),
    builders.objectExpression([
      corsOriginProp(),
      corsCredentialsProp()
    ])
  )
}

const corsCredentialsProp = (): namedTypes.ObjectProperty => {
  return builders.objectProperty(
    builders.identifier("credentials"),
    builders.booleanLiteral(true)
  )
}

const corsOriginProp = (): namedTypes.ObjectProperty => {
  return builders.objectProperty(
    builders.identifier("origin"),
    builders.memberExpression(
      builders.memberExpression(
        genSupertokensOptionsCall(),
        builders.identifier("appInfo")
      ),
      builders.identifier("websiteDomain")
    )
  )
}

const genSupertokensOptionsCall = (): namedTypes.CallExpression => {
  return builders.callExpression(
    builders.identifier("generateSupertokensOptions"),
    [builders.identifier("configService")]
  )
}

const removeDuplicateAuthModuleImports = (code: string): string => {
  const lines = code.split("\n");
  const newLines = [];
  let hasSeenAuthModule = false;
  for(const line of lines) {
    if(line.startsWith("import") && line.includes("AuthModule")) {
      if(hasSeenAuthModule) {
        continue;
      }
      hasSeenAuthModule = true
    }
    newLines.push(line);
  }
  return newLines.join("\n");
}
