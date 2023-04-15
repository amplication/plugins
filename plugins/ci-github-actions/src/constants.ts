import { join } from "path";

export const staticsPath = join(__dirname, "static");
export const templatesPath = join(__dirname, "templates");

export const serviceNameKey = "${{ SERVICE_NAME }}";
export const registryKey = "${{ REGISTRY }}";
export const registryPathKey = "${{ PATH }}";
export const imageNameKey = "${{ IMAGE_NAME }}";
