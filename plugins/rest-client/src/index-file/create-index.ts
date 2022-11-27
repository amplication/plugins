import { Module } from "@amplication/code-gen-types";
import { builders, namedTypes, visit } from "ast-types";
import { camelCase } from "lodash";
import { join } from "path";
import { print } from "recast";
import { EntityWithMeta } from "types";
import { getFistClassInFile, parse } from "../util";
import { createGettersFunction } from "./create-getters";
import { addLoginFunction } from "./create-login";
import { instantiateDelegators } from "./instantiate-dlegators";

const {
  identifier,
  tsTypeReference,
  tsTypeAnnotation,
  tsQualifiedName,
  privateName,
  classProperty,
} = builders;

export async function createSDKIndexModule(
  srcPath: string,
  entitiesModules: EntityWithMeta[]
): Promise<Module> {
  const fileContent = `
import { Axios } from "axios";
import * as entities from "./entities";

export class SDKClient {
  private readonly axios: Axios;
  constructor(baseURL: string) {
    this.axios = new Axios({ baseURL });
  }
}
`;
  const astFile = parse(fileContent);

  const sdkClass = await getSDKClientClass(astFile);
  await addDelegationsProperty(sdkClass, entitiesModules);
  await createGettersFunction(sdkClass, entitiesModules);
  await addLoginFunction(sdkClass);
  await instantiateDelegators(sdkClass, entitiesModules);

  return {
    path: join(srcPath, "index.ts"),
    code: print(astFile).code,
  };
}

function getSDKClientClass(
  astFile: namedTypes.File
): Promise<namedTypes.ClassDeclaration> {
  return new Promise((res, rej) => {
    visit(astFile, {
      visitClassDeclaration: (path) => {
        if (path.value.id?.name === "SDKClient") {
          res(path.value);
        }
      },
    });
  });
}

async function addDelegationsProperty(
  clientClass: namedTypes.ClassDeclaration,
  entitiesModules: EntityWithMeta[]
) {
  await Promise.all(
    entitiesModules.map(async (moduleWithMeta) => {
      const classDelegate = await getFistClassInFile(
        parse(moduleWithMeta.module.code)
      );
      const className = classDelegate.id?.name;
      if (!className) {
        throw new Error("Missing class name");
      }
      clientClass.body.body.push(
        classProperty(
          privateName(identifier(camelCase(moduleWithMeta.entity.displayName))),
          null,
          tsTypeAnnotation(
            tsTypeReference(
              tsQualifiedName(identifier("entities"), identifier(className))
            )
          ),
          false
        )
      );
    })
  );
}
