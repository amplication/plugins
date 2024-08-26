import {
  dotnetPluginEventsTypes,
  dotnetPluginEventsParams as dotnet,
  dotnetTypes,
  EnumEntityAction,
  EnumModuleActionType,
  FileMap,
} from "@amplication/code-gen-types";
import {
  Class,
  CodeBlock,
  CsharpSupport,
  MethodType,
  ProgramClass,
} from "@amplication/csharp-ast";
import { pascalCase } from "pascal-case";
import {
  CreateSeedDevelopmentDataBody,
  createAppServices,
  createBuildersServices,
  createMethodAuthorizeAnnotation,
  createRelatedMethodAuthorizeAnnotation,
  createStaticFileFileMap,
  getEntityRoleMap,
} from "./core";
import { resolve, join } from "path";

class AuthCorePlugin implements dotnetTypes.AmplicationPlugin {
  register(): dotnetPluginEventsTypes.DotnetEvents {
    return {
      CreateEntityControllerBase: {
        after: this.afterCreateControllerBase,
      },
      CreateControllerBaseModuleFile: {
        after: this.afterCreateControllerBaseModule,
      },
      CreateResourceDbContextFile: {
        after: this.afterCreateResourceDbContextFile,
      },
      LoadStaticFiles: {
        after: this.afterLoadStaticFiles,
      },
      CreateProgramFile: {
        after: this.afterCreateProgramFile,
      },
      CreateSeedDevelopmentDataFile: {
        after: this.afterCreateSeedDevelopmentDataFile,
      },
      CreateServerCsproj: {
        before: this.beforeCreateServerCsproj,
      },
    };
  }

  async beforeCreateServerCsproj(
    context: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateServerCsprojParams
  ): Promise<dotnet.CreateServerCsprojParams> {
    const { packageReferences } = eventParams;

    packageReferences.push({
      include: "Microsoft.AspNetCore.Identity.EntityFrameworkCore",
      version: "8.0.4",
    });

    packageReferences.push({
      include: "Swashbuckle.AspNetCore.Filters",
      version: "8.0.1",
    });
    return eventParams;
  }

  afterCreateProgramFile(
    { resourceInfo, serverDirectories }: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateProgramFileParams,
    programClassMap: FileMap<ProgramClass>
  ): FileMap<ProgramClass> {
    if (!resourceInfo) return programClassMap;
    const serviceNamespace = pascalCase(resourceInfo.name);
    const programCsPath = join(serverDirectories.srcDirectory, "Program.cs");
    const programClass = programClassMap.get(programCsPath);
    if (!programClass) 
      return programClassMap;
 
    createBuildersServices(serviceNamespace, programClass.code);
    createAppServices( programClass.code);

    return programClassMap;
  }

  async afterLoadStaticFiles(
    context: dotnetTypes.DsgContext,
    eventParams: dotnet.LoadStaticFilesParams,
    files: FileMap<CodeBlock>
  ): Promise<FileMap<CodeBlock>> {
    const { resourceInfo } = context;
    if (!resourceInfo) return files;

    const resourceName = pascalCase(resourceInfo.name);

    const destPath = `${eventParams.basePath}/src/APIs/Common/Auth/ProgramAuthExtensions.cs`;
    const filePath = resolve(
      __dirname,
      "./static/common/auth/ProgramAuthExtensions.cs"
    );

    const programAuthExtensionsFileMap = await createStaticFileFileMap(
      destPath,
      filePath,
      context,
      [
        CsharpSupport.classReference({
          name: `${resourceName}DbContext`,
          namespace: `${resourceName}.Infrastructure`,
        }),
      ]
    );

    const rolesManagerDestPath = `${eventParams.basePath}/src/Infrastructure/RolesManager.cs`;
    const rolesManagerFilePath = resolve(
      __dirname,
      "./static/infrastructure/RolesManager.cs"
    );

    const rolesManagerFileMap = await createStaticFileFileMap(
      rolesManagerDestPath,
      rolesManagerFilePath,
      context
    );

    files.mergeMany([programAuthExtensionsFileMap, rolesManagerFileMap]);

    return files;
  }

  afterCreateResourceDbContextFile(
    context: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateResourceDbContextFileParams,
    files: FileMap<Class>
  ): FileMap<Class> {
    const { resourceDbContextPath, resourceName } = eventParams;

    const modelFile = files.get(
      `${resourceDbContextPath}${resourceName}DbContext.cs`
    );

    if (!modelFile) return files;

    modelFile.code.parentClassReference = CsharpSupport.genericClassReference({
      reference: CsharpSupport.classReference({
        name: `IdentityDbContext`,
        namespace: "Microsoft.AspNetCore.Identity.EntityFrameworkCore",
      }),
      innerType: CsharpSupport.Types.reference(
        CsharpSupport.classReference({
          name: `IdentityUser`,
          namespace: "Microsoft.AspNetCore.Identity",
        })
      ),
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
      `${apisDir}/${entity.name}/Base/${pascalPluralName}ControllerBase.cs`
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
          const deleteMethod = methods?.find(
            (m) => m.name === `Delete${entity.name}`
          );
          deleteMethod &&
            createMethodAuthorizeAnnotation(
              deleteMethod,
              entityRolesMap[EnumEntityAction.Delete].roles
            );
          break;
        }
        case EnumModuleActionType.Read: {
          const readMethod = methods?.find((m) => m.name === entity.name);
          readMethod &&
            createMethodAuthorizeAnnotation(
              readMethod,
              entityRolesMap[EnumEntityAction.View].roles //check if this is the correct type
            );
          break;
        }
        case EnumModuleActionType.Find: {
          const findMethod = methods?.find(
            (m) => m.name === pascalCase(entity.pluralName)
          );

          findMethod &&
            createMethodAuthorizeAnnotation(
              findMethod,
              entityRolesMap[EnumEntityAction.Search].roles //check if this is the correct type
            );
          break;
        }
        case EnumModuleActionType.Update: {
          const updateMethod = methods?.find(
            (m) => m.name === `Update${entity.name}`
          );
          updateMethod &&
            createMethodAuthorizeAnnotation(
              updateMethod,
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
        case EnumModuleActionType.Custom: {
          const createMethod = methods?.find(
            (m) => m.name.toLowerCase() === moduleAction.name.toLowerCase()
          );
          createMethod &&
            roleNames &&
            createMethodAuthorizeAnnotation(createMethod, roleNames);
          break;
        }
      }
    }

    return files;
  }

  afterCreateControllerBaseModule(
    context: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateControllerBaseModuleFileParams,
    files: FileMap<Class>
  ): FileMap<Class> {
    const { controllerBaseModuleBasePath, moduleActionsAndDtos } = eventParams;
    const { roles } = context;
    const roleNames = roles?.map((role) => role.name).join(",");

    const moduleName = moduleActionsAndDtos.moduleContainer.name;
    const pascalPluralName = pascalCase(moduleName);

    const controllerBaseFile = files.get(
      `${controllerBaseModuleBasePath}/${moduleName}/Base/${pascalPluralName}ControllerBase.cs`
    );

    if (!controllerBaseFile) return files;

    const methods = controllerBaseFile.code.getMethods();
    roleNames &&
      methods?.forEach((method) => {
        createMethodAuthorizeAnnotation(method, roleNames);
      });

    return files;
  }

  afterCreateSeedDevelopmentDataFile(
    context: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateSeedDevelopmentDataFileParams,
    files: FileMap<Class>
  ): FileMap<Class> {
    const { seedFilePath, resourceName } = eventParams;
    const { entities } = context;

    if (!entities) return files;

    const seedFile = files.get(seedFilePath);
    seedFile?.code.addMethod(
      CsharpSupport.method({
        name: "SeedDevUser",
        access: "public",
        isAsync: true,
        body: CreateSeedDevelopmentDataBody(resourceName, context),
        type: MethodType.STATIC,
        parameters: [
          CsharpSupport.parameter({
            name: "serviceProvider",
            type: CsharpSupport.Types.reference(
              CsharpSupport.classReference({
                name: "IServiceProvider",
                namespace: `${resourceName}.Infrastructure.Models`,
              })
            ),
          }),
          CsharpSupport.parameter({
            name: "configuration",
            type: CsharpSupport.Types.reference(
              CsharpSupport.classReference({
                name: "IConfiguration",
                namespace: "",
              })
            ),
          }),
        ],
      })
    );

    return files;
  }
}

export default AuthCorePlugin;
