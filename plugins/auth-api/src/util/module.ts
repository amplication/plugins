import { memoize } from "lodash";
import * as fs from "fs";
import { namedTypes } from "ast-types";

export const readCode = memoize((path: string): Promise<string> => {
  return fs.promises.readFile(path, "utf-8");
});

export const readFile = async (path: string): Promise<namedTypes.File> => {
  const code = await readCode(path);
  return parse(code) as namedTypes.File;
};
