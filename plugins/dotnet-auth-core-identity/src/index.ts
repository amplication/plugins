import {
  dotnetPluginEventsTypes,
  dotnetPluginEventsParams as dotnet,
  dotnetTypes,
  EnumEntityAction,
  EnumModuleActionType,
  FileMap,
  IFile,
} from "@amplication/code-gen-types";
import { Class, CodeBlock, CsharpSupport } from "@amplication/csharp-ast";
import { pascalCase } from "pascal-case";
import {
  createMethodAuthorizeAnnotation,
  createRelatedMethodAuthorizeAnnotation,
  getEntityRoleMap,
} from "./core";
//import pluralize from "pluralize";
import { readFile } from "fs/promises";
import { resolve } from "path";

class AuthCorePlugin implements dotnetTypes.AmplicationPlugin {
  register(): dotnetPluginEventsTypes.DotnetEvents {
    return {
      CreateEntityControllerBase: {
        after: this.afterCreateControllerBase,
      },
      CreateEntityModel: {
        after: this.afterCreateEntityModel,
      },
      CreateResourceDbContextFile: {
        after: this.afterCreateResourceDbContextFile,
      },
      LoadStaticFiles: {
        after: this.afterLoadStaticFiles,
      },
    };
  }

  async afterLoadStaticFiles(
    context: dotnetTypes.DsgContext,
    eventParams: dotnet.LoadStaticFilesParams,
    files: FileMap<CodeBlock>
  ): Promise<FileMap<CodeBlock>> {
    const filePath = resolve(
      __dirname,
      "./static/common/auth/ProgramAuthExtensions.cs"
    );

    const fileContent = await readFile(filePath, "utf-8");
    const destPath = `${eventParams.basePath}/src/APIs/Common/Auth/ProgramAuthExtensions.cs`;
    const fileMap = new FileMap<CodeBlock>(context.logger);

    const file: IFile<CodeBlock> = {
      path: destPath,
      code: new CodeBlock({ code: fileContent }),
    };
    fileMap.set(file);

    files.merge(fileMap);

    return files;
  }
  afterCreateEntityModel(
    context: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateEntityModelParams,
    files: FileMap<Class>
  ): FileMap<Class> {
    const { apisDir, entity } = eventParams;
    const { resourceInfo } = context;
    const authEntityName = resourceInfo?.settings.authEntityName;

    if (entity.name !== authEntityName) return files;

    const modelFile = files.get(`${apisDir}${authEntityName}.cs`);

    if (!modelFile) return files;

    modelFile.code.parentClassReference = CsharpSupport.classReference({
      name: "IdentityUser",
      namespace: "",
    });

    return files;
  }

  afterCreateResourceDbContextFile(
    context: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateResourceDbContextFileParams,
    files: FileMap<Class>
  ): FileMap<Class> {
    const { resourceDbContextPath, entities, resourceName } = eventParams;
    const { resourceInfo } = context;
    const authEntityName = resourceInfo?.settings.authEntityName;

    const authEntityCheck = entities.find((e) => e.name === authEntityName);

    if (!authEntityCheck) return files;

    const modelFile = files.get(
      `${resourceDbContextPath}${resourceName}DbContext.cs`
    );

    if (!modelFile) return files;

    modelFile.code.parentClassReference = CsharpSupport.classReference({
      name: `IdentityDbContext<${authEntityName}>`,
      namespace: "",
    });

    return files;
  }

  afterCreateControllerBase(
    context: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateEntityControllerBaseParams,
    files: FileMap<Class>
  ): FileMap<Class> {
    const { entity, apisDir, moduleActions, entities } = eventParams;
    const { roles } = context;

    const pascalPluralName = pascalCase(entity.pluralName);
    const roleNames = roles?.map((role) => role.name).join(",");

    const controllerBaseFile = files.get(
      `${apisDir}/${entity.name}/base/${pascalPluralName}ControllerBase.cs`
    );

    const methods = controllerBaseFile?.code.getMethods();

    const entityRolesMap = getEntityRoleMap(entity, roleNames);

    for (const moduleAction of moduleActions) {
      switch (moduleAction.actionType) {
        case EnumModuleActionType.Create: {
          const createMethod = methods?.find(
            (m) => m.name === `Create${entity.name}`
          );
          createMethod &&
            createMethodAuthorizeAnnotation(
              createMethod,
              entityRolesMap[EnumEntityAction.Create].roles
            );
          break;
        }
        case EnumModuleActionType.Delete: {
          const createMethod = methods?.find(
            (m) => m.name === `Delete${entity.name}`
          );
          createMethod &&
            createMethodAuthorizeAnnotation(
              createMethod,
              entityRolesMap[EnumEntityAction.Delete].roles
            );
          break;
        }
        case EnumModuleActionType.Read: {
          const createMethod = methods?.find((m) => m.name === entity.name);
          createMethod &&
            createMethodAuthorizeAnnotation(
              createMethod,
              entityRolesMap[EnumEntityAction.View].roles //check if this is the correct type
            );
          break;
        }
        case EnumModuleActionType.Find: {
          const createMethod = methods?.find(
            // (m) => m.name === pluralize(entity.name)
            (m) => m.name === entity.name
          );
          createMethod &&
            createMethodAuthorizeAnnotation(
              createMethod,
              entityRolesMap[EnumEntityAction.Search].roles //check if this is the correct type
            );
          break;
        }
        case EnumModuleActionType.Update: {
          const createMethod = methods?.find(
            (m) => m.name === `Update${entity.name}`
          );
          createMethod &&
            createMethodAuthorizeAnnotation(
              createMethod,
              entityRolesMap[EnumEntityAction.Update].roles
            );
          break;
        }
        case EnumModuleActionType.ChildrenConnect: {
          if (!moduleAction.fieldPermanentId) break;

          const createMethod = methods?.find(
            (m) => m.name.toLowerCase() === moduleAction.name.toLowerCase()
          );

          createMethod &&
            createRelatedMethodAuthorizeAnnotation(
              entity,
              entities,
              moduleAction.fieldPermanentId,
              createMethod,
              EnumEntityAction.Create,
              roleNames
            );
          break;
        }
        case EnumModuleActionType.ChildrenDisconnect: {
          if (!moduleAction.fieldPermanentId) break;

          const createMethod = methods?.find(
            (m) => m.name.toLowerCase() === moduleAction.name.toLowerCase()
          );

          createMethod &&
            createMethod &&
            createRelatedMethodAuthorizeAnnotation(
              entity,
              entities,
              moduleAction.fieldPermanentId,
              createMethod,
              EnumEntityAction.Delete,
              roleNames
            );
          break;
        }
        case EnumModuleActionType.ChildrenFind: {
          if (!moduleAction.fieldPermanentId) break;

          const createMethod = methods?.find(
            (m) => m.name.toLowerCase() === moduleAction.name.toLowerCase()
          );

          createMethod &&
            createMethod &&
            createRelatedMethodAuthorizeAnnotation(
              entity,
              entities,
              moduleAction.fieldPermanentId,
              createMethod,
              EnumEntityAction.Search,
              roleNames
            );
          break;
        }
        case EnumModuleActionType.ChildrenUpdate: {
          if (!moduleAction.fieldPermanentId) break;

          const createMethod = methods?.find(
            (m) => m.name.toLowerCase() === moduleAction.name.toLowerCase()
          );

          createMethod &&
            createMethod &&
            createRelatedMethodAuthorizeAnnotation(
              entity,
              entities,
              moduleAction.fieldPermanentId,
              createMethod,
              EnumEntityAction.Update,
              roleNames
            );
          break;
        }
      }
    }

    return files;
  }
}

export default AuthCorePlugin;
