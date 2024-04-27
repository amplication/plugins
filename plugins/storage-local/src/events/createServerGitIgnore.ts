import {
  CreateServerGitIgnoreParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { getPluginSettings } from "../utils";

export const beforeCreateServerGitIgnore = async (
  context: DsgContext,
  eventParams: CreateServerGitIgnoreParams,
) => {
  const { gitignorePaths } = eventParams;
  const { fileBasePath } = getPluginSettings(context.pluginInstallations);

  gitignorePaths.push(`/${fileBasePath || "uploads"}`);

  return eventParams;
};
