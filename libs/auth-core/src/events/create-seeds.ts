import {
  DsgContext,
  CreateSeedParams,
  ModuleMap,
} from "@amplication/code-gen-types";
import { builders, namedTypes } from "ast-types";
import { interpolate, importNames, addImports } from "../util/ast";
import {
  BlockStatement,
  IfStatement,
  Statement,
  FunctionDeclaration,
  Identifier,
  TSTypeAnnotation,
} from "@babel/types";
import { resolve } from "path";
import { getStaticFiles } from "../util/file";

export async function beforeCreateSeed(
  context: DsgContext,
  eventParams: CreateSeedParams
) {
  interpolate(eventParams.template, eventParams.templateMapping);

  const passwordImport = importNames(
    [builders.identifier("Salt"), builders.identifier("parseSalt")],
    "../src/auth/password.service"
  );

  const hashImport = importNames([builders.identifier("hash")], "bcrypt");

  addImports(
    eventParams.template,
    [passwordImport, hashImport].filter(
      (x) => x //remove nulls and undefined
    ) as namedTypes.ImportDeclaration[]
  );

  const ifStatementFromBody = eventParams.template.program.body.find(
    (x) => x.type === "IfStatement"
  ) as IfStatement;

  const functionDeclarationFromBody = eventParams.template.program.body.find(
    (x) => x.type === "FunctionDeclaration"
  ) as FunctionDeclaration;

  const ifBlock = ifStatementFromBody.consequent as BlockStatement;
  const functionDeclarationBlock =
    functionDeclarationFromBody.body as BlockStatement;

  const saltConstVariable = builders.variableDeclaration("const", [
    builders.variableDeclarator(
      builders.identifier("salt"),
      builders.callExpression(builders.identifier("parseSalt"), [
        builders.identifier("BCRYPT_SALT"),
      ])
    ),
  ]) as Statement;

  const blockCode: namedTypes.BlockStatement = {
    body: [
      builders.expressionStatement(
        builders.callExpression(
          builders.memberExpression(
            builders.identifier("console"),
            builders.identifier("error")
          ),
          [builders.identifier("error")]
        )
      ),
      builders.expressionStatement(
        builders.callExpression(
          builders.memberExpression(
            builders.identifier("process"),
            builders.identifier("exit")
          ),
          [builders.numericLiteral(1)]
        )
      ),
    ],
    directives: [],
    type: "BlockStatement",
  };

  const saltExpression = builders.expressionStatement(
    builders.callExpression(
      builders.memberExpression(
        builders.callExpression(builders.identifier("seed"), [
          builders.identifier("salt"),
        ]),
        builders.identifier("catch")
      ),
      [
        builders.arrowFunctionExpression(
          [builders.identifier("error")],
          blockCode
        ),
      ]
    )
  ) as Statement;

  const bcryptSaltIdentifier = builders.identifier("bcryptSalt") as Identifier;
  bcryptSaltIdentifier.typeAnnotation = builders.tsTypeAnnotation(
    builders.tsTypeReference(builders.identifier("Salt"))
  ) as TSTypeAnnotation;

  const authEntity = context.entities?.find(
    (x) => x.name === context.resourceInfo?.settings.authEntityName
  );

  if (!authEntity) {
    context.logger.error(`Authentication entity does not exist`);
    return eventParams;
  }

  const functionExp = builders.expressionStatement(
    builders.awaitExpression(
      builders.callExpression(
        builders.memberExpression(
          builders.memberExpression(
            builders.identifier("client"),
            builders.identifier(authEntity.name.toLocaleLowerCase())
          ),
          builders.identifier("upsert")
        ),
        [
          builders.objectExpression([
            builders.objectProperty(
              builders.identifier("where"),
              builders.objectExpression([
                builders.objectProperty(
                  builders.identifier("username"),
                  builders.memberExpression(
                    builders.identifier("data"),
                    builders.identifier("username")
                  )
                ),
              ])
            ),
            builders.objectProperty(
              builders.identifier("update"),
              builders.objectExpression([])
            ),
            builders.objectProperty(
              builders.identifier("create"),
              builders.identifier("data")
            ),
          ]),
        ]
      )
    )
  ) as Statement;

  const dataVar = builders.variableDeclaration("const", [
    builders.variableDeclarator(
      builders.identifier("data"),
      builders.identifier("DATA")
    ),
  ]) as Statement;

  functionDeclarationFromBody.params.push(bcryptSaltIdentifier);
  const prevStatement2 = functionDeclarationBlock.body[2];
  const prevStatement3 = functionDeclarationBlock.body[3];
  const prevStatement4 = functionDeclarationBlock.body[4];
  const prevStatement5 = functionDeclarationBlock.body[5];

  functionDeclarationBlock.body[2] = dataVar;
  functionDeclarationBlock.body[3] = functionExp;
  functionDeclarationBlock.body[4] = prevStatement2;
  functionDeclarationBlock.body[5] = prevStatement3;
  functionDeclarationBlock.body[6] = prevStatement4;
  functionDeclarationBlock.body[7] = prevStatement5;

  ifBlock.body.push(saltConstVariable, saltExpression);

  return eventParams;
}

export async function afterCreateSeed(
  context: DsgContext,
  eventParams: CreateSeedParams,
  modules: ModuleMap
): Promise<ModuleMap> {
  const staticPath = resolve(__dirname, "./static/scripts");
  const staticsFiles = await getStaticFiles(
    context,
    context.serverDirectories.scriptsDirectory,
    staticPath
  );
  await modules.merge(staticsFiles);
  return modules;
}
