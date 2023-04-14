import { join } from "lodash";

export const staticsPath = join(__dirname, "static");
export const templatesPath = join(__dirname, "templates");

export const chartVersionKey = "${{ CHART_VERSION }}";
export const applicationVersionKey = "${{ APPLICATION_VERSION }}";

export const serviceNameKey = "${{ SERVICE_NAME }}";
export const repositoryKey = "${{ REPOSITORY }}";
export const tagKey = "${{ TAG }}";
export const configurationKey = "${{ CONFIGURATION }}";
export const hostName = "${{ HOSTNAME }}";
