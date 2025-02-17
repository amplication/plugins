import { EnumModuleDtoType, ModuleDto } from "@amplication/code-gen-types";
import { BASE_NAMESPACE } from "../constants";

/**
 * The function handles the logic of getting the namespace of the enum or the dto, based on the module dto type (moduleDto.dtoType).
 * This is needed because the type of the input(function parameter type)/output(function returned type)/property(type of a dto field)
 * is always considered as a Dto, although the actual type is an Enum or a CustomEnum.
 * For more context search for the exception "Enum type is not supported. Currently handled as a Dto type."
 * @param resourceName the service name
 * @param moduleDto the current module dto
 * @returns a string representing the namespace of the enum or the dto
 */
function getEnumDtoNamespace(
  resourceName: string,
  moduleName: string,
  moduleDto: ModuleDto,
): string {
  const dtoNamespace = `${BASE_NAMESPACE}Components.${resourceName}.Services.${moduleName}.Entities`;
  const enumNamespace = `${BASE_NAMESPACE}Components.${resourceName}.Services.${moduleName}.Enums`;
  const enumTypes = [EnumModuleDtoType.Enum, EnumModuleDtoType.CustomEnum];

  return enumTypes.includes(EnumModuleDtoType[moduleDto.dtoType])
    ? enumNamespace
    : dtoNamespace;
}

/**
 * The function handles the logic of getting the name of the enum or the dto, based on the module dto type (moduleDto.dtoType).
 * This is needed because:
 * 1) The type of the input(function parameter type)/output(function returned type)/property(type of a dto field) is always considered as
 *    a Dto, although the actual type is an Enum or a CustomEnum.
 *    (For more context search for the exception "Enum type is not supported. Currently handled as a Dto type.")
 * 2) We decided to concatenate the name of the enum with "Enum" to avoid conflicts with a property name that has the same name as the enum
 *    (e.g. the enum "CustomerType" and the property "CustomerType") and to align with the approach we took for entity enums
 * @param moduleDto the current module dto
 * @returns a string representing the name of the enum or the dto
 */
function getEnumDtoName(moduleDto: ModuleDto): string {
  const enumTypes = [EnumModuleDtoType.Enum, EnumModuleDtoType.CustomEnum];
  return enumTypes.includes(EnumModuleDtoType[moduleDto.dtoType])
    ? `${moduleDto.name}Enum`
    : moduleDto.name;
}

export { getEnumDtoNamespace, getEnumDtoName };
