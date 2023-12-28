/**
 * @Amplication example types file.
 * Add here all your typescript types/enum/interfaces
 */
export interface Settings {
  [key: string]: unknown;
}

export type Example = "Example";

export interface ExampleInterface {
  [key: string]: unknown;
}

export enum ExampleEnum {
  FOO = "foo",
  BOO = "boo",
}
