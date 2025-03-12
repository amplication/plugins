import { pascalCase } from "pascal-case";
import { BASE_NAMESPACE } from "../constants";
/**
 * The function handles the logic of getting the namespace of the controller, based on the module and resource name
 * @param resourceName the service name
 * @param moduleName the current module name
 * @returns a string representing the namespace of the controller
 */
function getControllerNamespace(
  resourceName: string,
  moduleName: string,
): string {
  return `${BASE_NAMESPACE}Components.${resourceName}.Controllers`;
}

function getControllerName(resourceName: string, moduleName: string): string {
  const pascalModuleName = pascalCase(moduleName);
  return `${pascalModuleName}Controller`;
}

function getServiceNamespace(resourceName: string, moduleName: string): string {
  return `${BASE_NAMESPACE}Components.${resourceName}.Services.${pascalCase(
    moduleName,
  )}`;
}

function getServiceName(resourceName: string, moduleName: string): string {
  const pascalModuleName = pascalCase(moduleName);
  return `${pascalModuleName}Service`;
}

function getServiceInterfaceNamespace(
  resourceName: string,
  moduleName: string,
): string {
  return getServiceNamespace(resourceName, moduleName);
}

function getServiceInterfaceName(
  resourceName: string,
  moduleName: string,
): string {
  return `I${getServiceName(resourceName, moduleName)}`;
}

export {
  getControllerNamespace,
  getControllerName,
  getServiceNamespace,
  getServiceName,
  getServiceInterfaceNamespace,
  getServiceInterfaceName,
};
