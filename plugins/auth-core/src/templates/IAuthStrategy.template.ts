declare class ENTITY_NAME_INFO {}

export interface IAuthStrategy {
  validate: (...any: any) => Promise<ENTITY_NAME_INFO>;
}
