import {
  dotnetPluginEventsTypes,
  dotnetPluginEventsParams as dotnet,
  dotnetTypes,
  FileMap,
  EnumEntityAction,
  EnumModuleActionType,
} from "@amplication/code-gen-types";
import { Class } from "@amplication/csharp-ast";
import { pascalCase } from "pascal-case";
import {
  createMethodAuthorizeAnnotation,
  createRelatedMethodAuthorizeAnnotation,
  getEntityRoleMap,
} from "./core";
import pluralize from "pluralize";

class AuthCorePlugin implements dotnetTypes.AmplicationPlugin {
  register(): dotnetPluginEventsTypes.DotnetEvents {
    return {
      CreateEntityControllerBase: {
        after: this.afterCreateControllerBase,
      },
    };
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
            (m) => m.name === pluralize(entity.name)
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
