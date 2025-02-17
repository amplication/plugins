import {
  FileMap,
  IFile,
  ModuleAction,
  ModuleActionsAndDtos,
  blueprintTypes,
} from "@amplication/code-gen-types";
import { AstNode, CsharpSupport } from "@amplication/csharp-ast";
import { Method } from "@amplication/csharp-ast";
import { prepareInputParameters, prepareOutputType } from "./common";
import {
  getServiceInterfaceName,
  getServiceInterfaceNamespace,
  getServiceName,
  getServiceNamespace,
} from "./common/namespace-util";

export async function createServiceFiles(
  moduleActionsAndDtos: ModuleActionsAndDtos,
  context: blueprintTypes.DsgContext,
  resourceName: string,
): Promise<FileMap<AstNode>> {
  const coreDir = `${resourceName}.API/Services`;

  const serviceFiles = new FileMap<AstNode>(context.logger);

  await serviceFiles.mergeMany([
    await createServiceFile(
      moduleActionsAndDtos,
      coreDir,
      resourceName,
      context,
    ),
  ]);
  return serviceFiles;
}

async function createServiceFile(
  moduleActionsAndDtos: ModuleActionsAndDtos,
  apisDir: string,
  resourceName: string,
  context: blueprintTypes.DsgContext,
): Promise<FileMap<AstNode>> {
  const moduleName = moduleActionsAndDtos.moduleContainer.name;
  const serviceName = getServiceName(resourceName, moduleName);
  const serviceNamespace = getServiceNamespace(resourceName, moduleName);
  const filePath = `${apisDir}/${moduleName}/${serviceName}.cs`;

  const entityClass = CsharpSupport.class_({
    name: `${serviceName}`,
    namespace: serviceNamespace,
    sealed: false,
    partial: false,
    access: "public",
    interfaceReferences: [
      CsharpSupport.classReference({
        name: getServiceInterfaceName(resourceName, moduleName),
        namespace: getServiceInterfaceNamespace(resourceName, moduleName),
      }),
    ],
  });

  entityClass.addField(
    CsharpSupport.field({
      name: "_mapper",
      access: "private",
      readonly_: true,
      type: CsharpSupport.Types.reference(
        CsharpSupport.classReference({
          name: `IMapper`,
          namespace: `AutoMapper`,
        }),
      ),
    }),
  );

  entityClass.addConstructor({
    access: "public",
    parameters: [
      CsharpSupport.parameter({
        name: "mapper",
        type: CsharpSupport.Types.reference(
          CsharpSupport.classReference({
            name: `IMapper`,
            namespace: `AutoMapper`,
          }),
        ),
      }),
    ],
    body: CsharpSupport.codeblock({
      code: `_mapper = mapper;
`,
    }),
  });

  const serviceMethods = generateServiceMethods(
    resourceName,
    moduleName,
    moduleActionsAndDtos.actions,
  );

  serviceMethods.forEach((method) => entityClass.addMethod(method));

  const file: IFile<AstNode> = {
    path: filePath,
    code: entityClass,
  };
  const fileMap = new FileMap<AstNode>(context.logger);
  await fileMap.set(file);
  return fileMap;
}

export function generateServiceMethods(
  resourceName: string,
  moduleName: string,
  actions: ModuleAction[],
): Method[] {
  const serviceMethods: Method[] = [];
  actions.forEach((action) => {
    const methodName = action.name;
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
    const returnType = prepareOutputType(
      resourceName,
      moduleName,
      action.outputType!,
    );

    const method = CsharpSupport.method({
      access: "public", // TODO: Add access to the action
      isAsync: true, // TODO: Add isAsync to the action
      name: methodName,
      return_: returnType,
      parameters,
      body: CsharpSupport.codeblock({
        code: `throw new NotImplementedException();`,
      }),
    });
    serviceMethods.push(method);
  });

  return serviceMethods;
}
