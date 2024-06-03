import { Entity, EnumEntityAction } from "@amplication/code-gen-types";
import { CsharpSupport, Method } from "@amplication/csharp-ast/src";
import { getEntityRoleMap } from "./get-entity-roles-map";

export function createMethodAuthorizeAnnotation(
  method: Method,
  roles: string
): void {
  roles &&
    method.annotations?.push(
      CsharpSupport.annotation({
        reference: CsharpSupport.classReference({
          name: "Authorize",
          namespace: "Microsoft.AspNetCore.Authorization",
        }),
        argument: `Roles = "${roles}"`,
      })
    );
}

export function createRelatedMethodAuthorizeAnnotation(
  entity: Entity,
  entities: Entity[],
  fieldPermanentId: string,
  method: Method,
  methodType: EnumEntityAction,
  roles?: string
): void {
  const field = entity.fields.find(
    (field) => field.permanentId === fieldPermanentId
  );

  const relatedEntity = entities.find(
    (entity) => entity.id === field?.properties?.relatedEntityId
  );
  if (relatedEntity) {
    const rolesMapping = getEntityRoleMap(relatedEntity, roles);
    createMethodAuthorizeAnnotation(method, rolesMapping[methodType].roles);
  }
}
