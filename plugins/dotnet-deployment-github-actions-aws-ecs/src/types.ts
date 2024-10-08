export interface Settings {
  region_identifier: string;
  account_identifier: string;
  ecr_repository_name: string;
  ecr_image_tag: string;
  ecs_cluster_name: string;
  ecs_role_name: string;
  sm_secret_name: string;
  resources: {
    cpu: string;
    memory: string;
  };
  runtime: {
    cpu_architecture: string;
    os_family: string;
  };
}
