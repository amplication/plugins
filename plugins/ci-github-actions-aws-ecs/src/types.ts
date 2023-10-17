export interface Settings {
  region_identifier: string;
  account_identifier: string;
  ecr_repository_name: string;
  image_tag: string;
  ecs_cluster_name: string;
  ecs_role_name: string;
  resources: {
    cpu: string;
    memory: string;
  };
  runtime_platform: {
    cpu_architecture: string;
    os_family: string;
  };
}
