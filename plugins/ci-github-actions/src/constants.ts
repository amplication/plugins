import { join } from "path";

export const staticsPath = join(__dirname, "static");

export const serviceNameKey = "${{ SERVICE_NAME }}";
export const imageNameKey = "${{ IMAGE_NAME }}";
export const registryKey = "${{ REGISTRY }}";

export const serverWorkingDirectoryKey = "${{ SERVER_WORKING_DIRECTORY }}";
