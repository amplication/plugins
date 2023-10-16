export interface Settings {
  region: string;
  account_id: number;
  ecr_repository_name: string;
  ecs_cluster_name: string;
  ecr_role_name: string;
  ecs_role_name: string;
  resources: {
    cpu: number;
    memory: number;
  },
  runtime_platform: {
    cpu_architecture: string;
    os_family: string;
  }
}
