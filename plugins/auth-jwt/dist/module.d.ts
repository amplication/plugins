/// <reference types="lodash" />
import { namedTypes } from "ast-types";
export declare type Variables = {
    [variable: string]: string | null | undefined;
};
export declare const readCode: ((path: string) => Promise<string>) & import("lodash").MemoizedFunction;
declare const readFile: (path: string) => Promise<namedTypes.File>;
export { readFile };
export declare const formatCode: (code: string) => string;
export declare function relativeImportPath(from: string, to: string): string;
export declare function filePathToModulePath(filePath: string): string;
