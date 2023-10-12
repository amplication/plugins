export interface Settings {
  region: string;
  account_id: number;
  ecr_repository_name: string;
  ecs_cluster_name: string;
  ecs_service_name: string;
  iam_role_name: string;
  resources: {
    cpu: number;
    memory: number
  }
}
