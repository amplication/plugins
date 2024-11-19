export interface Settings {
  cluster: {
    name: string;
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
    name: string;
    container_definitions: {
      image: string;
      port: number;
    };
  };
}
