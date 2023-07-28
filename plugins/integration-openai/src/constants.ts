import { VariableDictionary } from "@amplication/code-gen-types";

export const envVariables: VariableDictionary = [
  { OPENAI_API_KEY: "[open-ai-key]" },
];

export const dependencies = {
  dependencies: {
    openai: "^3.3.0",
  },
};
