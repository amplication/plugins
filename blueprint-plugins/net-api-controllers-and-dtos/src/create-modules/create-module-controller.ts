import {
  FileMap,
  IFile,
  ModuleAction,
  ModuleActionsAndDtos,
  dotnetPluginEventsParams,
  blueprintTypes,
} from "@amplication/code-gen-types";
import { Annotation, AstNode, CsharpSupport } from "@amplication/csharp-ast";
import { pascalCase } from "pascal-case";
import { Method } from "@amplication/csharp-ast";
import {
  prepareInputParameters,
  prepareMethodHttpAnnotations,
  prepareOutputType,
} from "./common";
import { camelCase } from "lodash";
import {
  getControllerNamespace,
  getServiceName,
  getServiceNamespace,
} from "./common/namespace-util";

export async function createControllerFiles(
  moduleActionsAndDtos: ModuleActionsAndDtos,
  context: blueprintTypes.DsgContext,
  resourceName: string,
): Promise<FileMap<AstNode>> {
  const apisDir = `${resourceName}.API/Controllers`;

  const controllerFiles = new FileMap<AstNode>(context.logger);

  await controllerFiles.mergeMany([
    await createControllerFile(
      {
        moduleActionsAndDtos,
        controllerModuleBasePath: apisDir,
        resourceName,
      },
      context,
    ),
  ]);

  return controllerFiles;
}

async function createControllerFile(
  {
    moduleActionsAndDtos,
    controllerModuleBasePath,
    resourceName,
  }: dotnetPluginEventsParams.CreateControllerModuleFileParams,
  context: blueprintTypes.DsgContext,
): Promise<FileMap<AstNode>> {
  const moduleName = moduleActionsAndDtos.moduleContainer.name;
  const pascalModuleName = pascalCase(moduleName);
  const filePath = `${controllerModuleBasePath}/${pascalModuleName}Controller.cs`;
  const controllerName = `${pascalModuleName}Controller`;

  const entityClassControllerBase = CsharpSupport.class_({
    name: controllerName,
    namespace: getControllerNamespace(resourceName, moduleName),
    sealed: false,
    partial: false,
    access: "public",
    parentClassReference: CsharpSupport.classReference({
      name: "ControllerAbstract",
      namespace: "Microsoft.AspNetCore.Mvc",
    }),
    interfaceReferences: [
      CsharpSupport.classReference({
        name: "IController",
        namespace: "Microsoft.AspNetCore.Mvc",
      }),
    ],
  });

  const serviceName = getServiceName(resourceName, moduleName);
  const serviceNamespace = getServiceNamespace(resourceName, moduleName);

  // private readonly IExampleService _exampleService;
  entityClassControllerBase.addField(
    CsharpSupport.field({
      access: "private",
      readonly_: true,
      name: "_service",
      type: CsharpSupport.Types.reference(
        CsharpSupport.classReference({
          name: serviceName,
          namespace: serviceNamespace,
        }),
      ),
    }),
  );

  entityClassControllerBase.addConstructor({
    access: "public",
    parameters: [
      CsharpSupport.parameter({
        name: "service",
        type: CsharpSupport.Types.reference(
          CsharpSupport.classReference({
            name: serviceName,
            namespace: serviceNamespace,
          }),
        ),
      }),
    ],
    body: CsharpSupport.codeblock({
      code: `_service = service;
`, //keep line break
    }),
  });

  // const routeAnnotation: Annotation = new Annotation({
  //   reference: CsharpSupport.classReference({
  //     name: "Route",
  //     namespace: "Microsoft.AspNetCore.Mvc",
  //   }),
  //   argument: `"webapi/base"`,
  // });

  const apiAnnotation: Annotation = new Annotation({
    reference: CsharpSupport.classReference({
      name: "ApiController",
      namespace: "Microsoft.AspNetCore.Mvc",
    }),
  });

  // entityClassControllerBase.annotations.push(routeAnnotation);
  entityClassControllerBase.annotations.push(apiAnnotation);

  const controllerMethods = generateControllerMethods(
    moduleActionsAndDtos.actions,
    resourceName,
    moduleName,
  );

  controllerMethods.forEach((method) => {
    entityClassControllerBase.addMethod(method);
  });

  const fileMap = new FileMap<AstNode>(context.logger);

  const file: IFile<AstNode> = {
    path: filePath,
    code: entityClassControllerBase,
  };

  await fileMap.set(file);

  return fileMap;
}

export function generateControllerMethods(
  actions: ModuleAction[],
  resourceName: string,
  moduleName: string,
): Method[] {
  const controllerMethods: Method[] = [];

  actions.forEach((action) => {
    if (!action.outputType) {
      throw new Error(
        `Action ${action.name} has no output type. Please add an output type to the action.`,
      );
    }

    const methodName = action.name;
    const methodParams = prepareInputParameters(
      resourceName,
      moduleName,
      action,
    );
    const returnType = prepareOutputType(
      resourceName,
      moduleName,
      action.outputType!,
    );
    // list of paramName separated by comma ("param1, param2, param3")
    const paramNames = methodParams.map((param) => param.paramName).join(", ");

    const parameters = methodParams.map((param) => {
      return CsharpSupport.parameter({
        name: param.paramName,
        type: param.parameter.type,
        annotations: param.parameter.annotations.restAnnotations, // because we are in the controller, we only need the rest annotations
      });
    });

    const method = CsharpSupport.method({
      name: methodName,
      access: "public", // TODO: Add access to the action
      isAsync: true, // TODO: Add isAsync to the action
      return_: returnType,
      body: CsharpSupport.codeblock({
        code: `return await _service.${methodName}(${camelCase(paramNames)});`,
      }),
      annotations: [prepareMethodHttpAnnotations(action)],
      parameters,
    });
    controllerMethods.push(method);
  });

  return controllerMethods;
}
