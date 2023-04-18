import { join } from "path";

export const staticsPath = join(__dirname, "static");

export const serviceNameKey = "${{ SERVICE_NAME }}";
export const imageKey = "${{ IMAGE }}";
export const serviceWorkingDirectoryKey = "${{ SERVICE_DIRECTORY }}";

export const authenticationUsernameKey = "${{ AUTHENTICATION_USERNAME }}";
export const authenticationPasswordKey = "${{ AUTHENTICATION_PASSWORD }}";
