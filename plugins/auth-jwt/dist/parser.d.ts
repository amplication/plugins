import type { File } from "@babel/types";
import getBabelOptions, { Overrides } from "recast/parsers/_babel_options";
export declare type Options = ReturnType<typeof getBabelOptions>;
export declare function parse(source: string, options?: Overrides): File;
export declare function getOptions(options?: Overrides): Options;
