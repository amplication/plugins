import { join } from "path";

export const serverStaticsPath = join(__dirname, "static/server");
export const templatesPath = join(__dirname, "templates");

export const serverPackageJsonValues = {
  dependencies: {
    "graphql-upload": "^13.0.0",
    "mime-types": "^2.1.35",
    minimatch: "^9.0.4",
  },
  devDependencies: {
    "@types/graphql-upload": "^8.0.12",
    "@types/mime-types": "^2.1.4",
    "@types/multer": "^1.4.11",
  },
};
