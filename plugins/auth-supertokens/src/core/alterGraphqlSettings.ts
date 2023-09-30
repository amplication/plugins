import { Module, ModuleMap } from "@amplication/code-gen-types";
import { parse } from "@amplication/code-gen-utils";
import { builders, namedTypes } from "ast-types";
import { print } from "@amplication/code-gen-utils";

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
  const namedDeclarations = code.program.body.filter((stmt) => (
    stmt.type === "ExportNamedDeclaration"
    && stmt.declaration && stmt.declaration.type
    && stmt.declaration.type === "ClassDeclaration"
  ));
  if(namedDeclarations.length !== 1) {
    throw new Error("Unexpected number of exported classes in the app module");
  }
  const classDeclaration = namedDeclarations[0];
  //@ts-ignore
  const imports = getAppModuleImports(classDeclaration.declaration);
  const graphqlImport = getGraphqlImport(imports);
  if(graphqlImport) {
    const config = getGraphqlImportConfig(graphqlImport);
    alterGraphqlConfig(config);
    modules.replace(appModule, {
      path: appModule.path,
      code: print(code).code
    });
  }
}

const getAppModuleImports = (classDeclaration: namedTypes.ClassDeclaration): namedTypes.ArrayExpression => {
  //@ts-ignore
  const decorators = classDeclaration.decorators;
  if(decorators.length !== 1) {
    throw new Error("Expected only one decorator for the app module class");
  }
  const decorator = decorators[0] as namedTypes.Decorator;
  
  if(
    decorator.expression.type !== "CallExpression" 
    || decorator.expression.arguments.length !== 1
    || decorator.expression.arguments[0].type !== "ObjectExpression"
    ) {
      throw new Error("Expected a decorator call with one object as the argument for the app module class");
    }
  const config = decorator.expression.arguments[0] as namedTypes.ObjectExpression;
  const importsInArray = config.properties.filter((prop) => (
    prop.type === "ObjectProperty"
    //@ts-ignore
    && prop.key.name === "imports"
  ));
  if(importsInArray.length !== 1) {
    throw new Error("Failed to find the imports in the app module");
  }
  const importsProp = importsInArray[0] as namedTypes.ObjectProperty;
  return importsProp.value as namedTypes.ArrayExpression;
}

const getGraphqlImport = (imports: namedTypes.ArrayExpression): namedTypes.CallExpression | null => {
  for(const val of imports.elements) {
    if(!val || val.type !== "CallExpression") {
      continue;
    }
    const callExpr = val as namedTypes.CallExpression;
    if(callExpr.callee.type !== "MemberExpression") {
      continue;
    }
    const memExpr = callExpr.callee as namedTypes.MemberExpression;
    if(memExpr.object.type === "Identifier" && memExpr.object.name === "GraphQLModule") {
      return callExpr;
    }
  }
  return null;
}

const getGraphqlImportConfig = (graphqlImport: namedTypes.CallExpression): namedTypes.ObjectExpression => {
  const containsRootObj = graphqlImport.arguments.filter((arg) => arg.type === "ObjectExpression");
  if(containsRootObj.length !== 1) {
    throw new Error("Expected just 1 object as the argument in the GraphQLModule.forRootAsync invocation");
  }
  const rootObj = containsRootObj[0] as namedTypes.ObjectExpression;
  const containsUseFactoryProp = rootObj.properties.filter((prop) => 
    prop.type === "ObjectProperty" && 
    //@ts-ignore
    prop.key.name === "useFactory"
  );
  if(containsUseFactoryProp.length !== 1) {
    throw new Error("Expected a useFactory property in the GraphQLModule.forRootAsync argument");
  }
  const useFactoryProp = containsUseFactoryProp[0] as namedTypes.ObjectProperty;
  if(useFactoryProp.value.type !== "ArrowFunctionExpression") {
    throw new Error("Expected the useFactory property in the GraphQLModule.forRootAsync argument to be an arrow function call");
  }
  const configFunc = useFactoryProp.value as namedTypes.ArrowFunctionExpression;
  if(configFunc.body.type !== "BlockStatement") {
    throw new Error("Expected the useFactory property in the GraphQLModule.forRootAsync to be a function with a body")
  }
  const funcBody = configFunc.body as namedTypes.BlockStatement;
  const containsReturn = funcBody.body.filter((stmt) => stmt.type === "ReturnStatement");
  if(containsReturn.length !== 1) {
    throw new Error("Expected the useFactory property in the GraphQLModule.forRootAsync to have a return statement");
  }
  const returnStmt = containsReturn[0] as namedTypes.ReturnStatement;
  if(returnStmt.argument?.type !== "ObjectExpression") {
    throw new Error("Expected the useFactory property in the GraphQLModule.forRootAsync to be a function that returns an object expression")
  }
  return returnStmt.argument as namedTypes.ObjectExpression;
}

const alterGraphqlConfig = (config: namedTypes.ObjectExpression) => {

  // Disabling playground

  config.properties = config.properties.filter((prop) => (
    //@ts-ignore
    !(prop.key && prop.key.name === "playground")
  ));
  const playgroundProp = builders.objectProperty(
    builders.identifier("playground"),
    builders.booleanLiteral(false)
  );
  config.properties.push(playgroundProp);

  // Adding cors settings
  // Put the supertokens websiteDomain in the allowed origins
  // and allow credentials

  const corsProps = [
    builders.objectProperty(
      builders.identifier("origin"),
      builders.memberExpression(
        builders.memberExpression(
          builders.callExpression(
            builders.identifier("generateSupertokensOptions"),
            [builders.identifier("configService")]
          ),
          builders.identifier("appInfo")
        ),
        builders.identifier("websiteDomain")
      )
    ),
    builders.objectProperty(builders.identifier("credentials"), builders.booleanLiteral(true))
  ];
  let containsCors = config.properties.filter((prop) => (
    prop.type === "ObjectProperty"
    //@ts-ignore
    && prop.key.name === "cors"
  ));
  let corsProp = builders.objectProperty(
    builders.identifier("cors"),
    builders.objectExpression(corsProps)
  );
  if(containsCors.length) {
    const prop = containsCors[0] as namedTypes.ObjectProperty;
    prop.value = builders.objectExpression(corsProps);
  } else {
    config.properties.push(corsProp);
  }
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
