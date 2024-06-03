import {
  Entity,
  EnumEntityAction,
  EnumEntityPermissionType,
} from "@amplication/code-gen-types";

export function getRelatedFieldRolesMap(
  entity: Entity,
  entities: Entity[],
  fieldPermanentId: string,
  roleNames?: string
): Record<
  EnumEntityAction,
  {
    roles: string;
  }
> | null {
  const field = entity.fields.find(
    (field) => field.permanentId === fieldPermanentId
  );

  const relatedEntity = entities.find(
    (entity) => entity.id === field?.properties?.relatedEntityId
  );
  if (relatedEntity) {
    return getEntityRoleMap(relatedEntity, roleNames);
  }
  return null;
}

export function getEntityRoleMap(
  entity: Entity,
  roleNames?: string
): Record<
  EnumEntityAction,
  {
    roles: string;
  }
> {
  return Object.fromEntries(
    entity.permissions.map((permission) => {
      return [
        permission.action,
        {
          roles:
            permission.type === EnumEntityPermissionType.AllRoles
              ? roleNames
              : permission.type === EnumEntityPermissionType.Granular
              ? permission.permissionRoles
                  .map((role) => role.resourceRole.name)
                  .join(",")
              : null,
        },
      ];
    })
  ) as unknown as Record<EnumEntityAction, { roles: string }>;
}
