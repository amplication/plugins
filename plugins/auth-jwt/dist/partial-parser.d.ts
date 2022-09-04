import type { File } from "@babel/types";
import { Overrides } from "recast/parsers/_babel_options";
import * as parser from "./parser";
export declare function parse(source: string, options?: Overrides): File;
export declare function getOptions(options?: Overrides): parser.Options;
