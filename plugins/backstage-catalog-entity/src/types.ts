export interface Settings {
  prefix_name?: string;
  labels?: Map<string, any>;
  annotations?: Map<string, any>;
  tags?: Array<string>;
  spec?: {
    type: string;
    life_cycle: string;
    owner: string;
  };
}
