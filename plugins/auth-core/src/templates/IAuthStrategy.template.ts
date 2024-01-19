declare class ENTITY_NAME_INFO {}

export interface IAuthStrategy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate: (...any: any) => Promise<ENTITY_NAME_INFO>;
}
