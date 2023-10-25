export interface Settings {
  global: {
    name: string;
  };
  cluster: {
    capacity_provider: {
      type: string;
      fargate?: {
        fargate_weight: number;
        fargate_base: number;
        fargate_spot_weight: number;
      };
    };
  };
  service: {
    container_definitions: {
      image: string;
      port: number;
    };
  };
}
