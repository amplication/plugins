// generic constants
export const moduleNameEcsClusterKey = "${{ ECS_CLUSTER_MODULE_NAME }}";
export const moduleNameEcsServiceKey = "${{ ECS_SERVICE_MODULE_NAME }}";
export const moduleNameEcsAlbKey = "${{ ECS_ALB_MODULE_NAME }}";
export const moduleNameEcsSgKey = "${{ ECS_SG_MODULE_NAME }}";

// settings cluster constants
export const clusterHyphenNameKey = "${{ CLUSTER_NAME }}"
export const clusterUnderscoreNameKey = "${{ CLUSTER_NAME_UNDERSCORE }}"
export const clusterCapacityProviderKey = "${{ CLUSTER_CAPACITY_PROVIDER }}";

// settings service constants
export const serviceHyphenNameKey = "${{ SERVICE_NAME }}"
export const serviceUnderscoreNameKey = "${{ SERVICE_NAME_UNDERSCORE }}"
export const serviceContainerImage = "${{ SERVICE_CONTAINER_IMAGE }}";
export const serviceContainerPort = "${{ SERVICE_CONTAINER_PORT }}";
