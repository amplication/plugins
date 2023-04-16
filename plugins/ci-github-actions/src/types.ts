export interface Settings {
  include_containerization_steps: boolean;
  registry_configuration?: {
    registry?: string;
    registry_path?: string;
    image_name?: string;
  };
} //TODO: create a json schema for this settings interface
