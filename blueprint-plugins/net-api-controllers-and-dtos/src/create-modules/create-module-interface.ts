import {
  FileMap,
  IFile,
  ModuleAction,
  ModuleActionsAndDtos,
  blueprintTypes,
} from "@amplication/code-gen-types";
import {
  AstNode,
  CsharpSupport,
  Interface,
  Method,
} from "@amplication/csharp-ast";
import { pascalCase } from "pascal-case";
import { prepareInputParameters, prepareOutputType } from "./common";
import {
  getServiceInterfaceName,
  getServiceInterfaceNamespace,
} from "./common/namespace-util";

export async function createInterfaceFiles(
  moduleActionsAndDtos: ModuleActionsAndDtos,
  context: blueprintTypes.DsgContext,
  resourceName: string,
): Promise<FileMap<AstNode>> {
  const apisDir = `${resourceName}.API/Services`;

  const interfaceFiles = new FileMap<AstNode>(context.logger);

  await interfaceFiles.merge(
    await createInterfaceFile(
      apisDir,
      resourceName,
      moduleActionsAndDtos,
      context,
    ),
  );

  return interfaceFiles;
}

async function createInterfaceFile(
  apisDir: string,
  resourceName: string,
  moduleActionsAndDtos: ModuleActionsAndDtos,
  context: blueprintTypes.DsgContext,
): Promise<FileMap<AstNode>> {
  const moduleName = moduleActionsAndDtos.moduleContainer.name;
  const interfaceName = getServiceInterfaceName(resourceName, moduleName);

  const filePath = `${apisDir}/${moduleName}/${interfaceName}.cs`;

  const interfaceClass = CsharpSupport.interface_({
    name: interfaceName,
    namespace: getServiceInterfaceNamespace(resourceName, moduleName),
    access: "public",
  });

  const interfaceMethods = generateActionInterfaceMethods(
    resourceName,
    moduleName,
    moduleActionsAndDtos.actions,
  );

  interfaceMethods.forEach((method) => interfaceClass.addMethod(method));

  const fileMap = new FileMap<Interface>(context.logger);

  const file: IFile<Interface> = {
    path: filePath,
    code: interfaceClass,
  };

  await fileMap.set(file);
  return fileMap;
}

export function generateActionInterfaceMethods(
  resourceName: string,
  moduleName: string,
  actions: ModuleAction[],
): Method[] {
  const interfaceMethods: Method[] = [];
  actions.forEach((action) => {
    if (action.enabled) {
      const methodName = pascalCase(action.name);
      const returnType = prepareOutputType(
        resourceName,
        moduleName,
        action.outputType!,
      );
      const methodParams = prepareInputParameters(
        resourceName,
        moduleName,
        action,
      );
      const parameters = methodParams.map((param) => {
        return CsharpSupport.parameter({
          name: param.paramName,
          type: param.parameter.type,
        });
      });

      const method = CsharpSupport.method({
        access: "public", // TODO: Add access to the action
        isAsync: true, // TODO: Add isAsync to the action
        name: methodName,
        return_: returnType,
        parameters,
      });
      interfaceMethods.push(method);
    }
  });

  return interfaceMethods;
}
