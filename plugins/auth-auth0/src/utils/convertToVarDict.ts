import { VariableDictionary } from "@amplication/code-gen-types";

export const convertToVarDict = (
  obj: Record<string, string>,
): VariableDictionary => {
  return Object.entries(obj).map(([key, value]) => ({
    [key]: value,
  }));
};
