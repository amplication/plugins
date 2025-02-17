import {
  FileMap,
  IFile,
  ModuleActionsAndDtos,
  ModuleDto,
  ModuleDtoProperty,
  blueprintTypes,
} from "@amplication/code-gen-types";
import { AstNode, CsharpSupport, Field } from "@amplication/csharp-ast";
import { pascalCase } from "pascal-case";
import { Annotation } from "@amplication/csharp-ast";
import { getEnumDtoName, getEnumDtoNamespace, getPropertyType } from "./common";
import { Type } from "@amplication/csharp-ast";

export async function createDtoFiles(
  moduleActionsAndDtos: ModuleActionsAndDtos,
  context: blueprintTypes.DsgContext,
  resourceName: string,
): Promise<FileMap<AstNode>> {
  //const apisDir = `${resourceName}.API/Controllers`;
  const coreDir = `${resourceName}.API/Services`;

  const dtoFiles = new FileMap<AstNode>(context.logger);
  const moduleName = moduleActionsAndDtos.moduleContainer.name;

  const enums = moduleActionsAndDtos.dtos.filter(
    (dto) => dto.dtoType === "CustomEnum",
  );

  const dtos = moduleActionsAndDtos.dtos.filter(
    (dto) => dto.dtoType === "Custom",
  );

  for (const enumDto of enums) {
    await dtoFiles.merge(
      await createEnumFile(enumDto, moduleName, coreDir, resourceName, context),
    );
  }

  for (const dto of dtos) {
    await dtoFiles.merge(
      await createDtoFile(moduleName, dto, coreDir, resourceName, context),
    );
  }

  return dtoFiles;
}

async function createDtoFile(
  moduleName: string,
  dto: ModuleDto,
  apisDir: string,
  resourceName: string,
  context: blueprintTypes.DsgContext,
): Promise<FileMap<AstNode>> {
  const filePath = `${apisDir}/${moduleName}/Entities/${dto.name}.cs`;
  const dtoClass = CsharpSupport.class_({
    name: dto.name,
    namespace: getEnumDtoNamespace(resourceName, moduleName, dto),
    access: "public",
  });

  const dtoFields = generateDtoFields(resourceName, moduleName, dto, context);

  dtoFields.forEach((field) => dtoClass.addField(field));

  const file: IFile<AstNode> = {
    path: filePath,
    code: dtoClass,
  };

  const fileMap = new FileMap<AstNode>(context.logger);
  await fileMap.set(file);
  return fileMap;
}

async function createEnumFile(
  enumDto: ModuleDto,
  moduleName: string,
  coreDir: string,
  resourceName: string,
  context: blueprintTypes.DsgContext,
): Promise<FileMap<AstNode>> {
  const filePath = `${coreDir}/Enums/${enumDto.name}Enum.cs`;
  const enumClass = CsharpSupport.enum_({
    name: getEnumDtoName(enumDto),
    namespace: getEnumDtoNamespace(resourceName, moduleName, enumDto),
    access: "public",
    // annotations: [
    //   CsharpSupport.annotation({
    //     reference: CsharpSupport.classReference({
    //       name: "JsonConverter",
    //       namespace: "System.Text.Json.Serialization",
    //     }),
    //     argument: `typeof(JsonStringEnumConverter<${dto.name}>)`,
    //   }),
    // ],
  });

  for (const member of enumDto.members ?? []) {
    enumClass.addMember({
      name: pascalCase(member.name),
      value: member.value,
    });
  }

  const file: IFile<AstNode> = {
    path: filePath,
    code: enumClass,
  };

  const fileMap = new FileMap<AstNode>(context.logger);
  await fileMap.set(file);
  return fileMap;
}

function generateDtoFields(
  resourceName: string,
  moduleName: string,
  dto: ModuleDto,
  context: blueprintTypes.DsgContext,
): Field[] {
  const dtoFields: Field[] = [];

  for (const property of dto.properties ?? []) {
    const dtoField = CsharpSupport.field({
      name: pascalCase(property.name),
      get: true,
      set: true,
      type: property.isOptional
        ? CsharpSupport.Types.optional(
            getDtoFieldType(resourceName, moduleName, property, context),
          )
        : getDtoFieldType(resourceName, moduleName, property, context),
      annotations: preparePropertyAnnotation(property),
      access: "public", // TODO: add access to dto property
    });

    dtoFields.push(dtoField);
  }
  return dtoFields;
}

function getDtoFieldType(
  resourceName: string,
  moduleName: string,
  property: ModuleDtoProperty,
  context: blueprintTypes.DsgContext,
): Type {
  if (property.propertyTypes.length > 1) {
    throw new Error(
      `Multiple property types are not supported for dto properties. Module: ${moduleName}, Property: ${property.name}`,
    );
  }

  if (property.propertyTypes.length === 1) {
    if (property.propertyTypes[0].type === "Dto") {
      const { moduleActionsAndDtoMap } = context;
      for (const moduleActionsAndDtos of Object.values(
        moduleActionsAndDtoMap,
      )) {
        const moduleDto = moduleActionsAndDtos.dtos.find(
          (dto) => dto.id === property.propertyTypes[0].dtoId,
        );
        if (moduleDto) {
          return CsharpSupport.Types.reference(
            CsharpSupport.classReference({
              name: getEnumDtoName(moduleDto),
              namespace: getEnumDtoNamespace(
                resourceName,
                moduleName,
                moduleDto,
              ),
            }),
          );
        }
      }

      throw new Error(
        `Could not find dto with id ${property.propertyTypes[0].dtoId} for property ${property.name} in any module `,
      );
    }

    if (property.propertyTypes[0].type === "Enum") {
      throw new Error(
        "Enum type is not supported. Currently handled as a Dto type.",
      );
    }

    // all other types i.e. Integer, Float, String, Boolean, DateTime...
    return getPropertyType(property.propertyTypes[0]);
  }
  return getPropertyType(property.propertyTypes[0]);
}

function preparePropertyAnnotation(property: ModuleDtoProperty): Annotation[] {
  const annotations: Annotation[] = [];
  if (!property.isOptional) {
    const requiredAnnotation = CsharpSupport.annotation({
      reference: CsharpSupport.classReference({
        name: "Required",
        namespace: "System.ComponentModel.DataAnnotations",
      }),
    });
    annotations.push(requiredAnnotation);
  }

  return annotations;
}
