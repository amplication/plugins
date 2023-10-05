export interface Settings {
  root_level: boolean;
  directory_name: string;
  global: {
    region: string;
  }
  vpc: {
    cidr_block: string;

  };
  ecs: {

  };
}
