import { join } from "path";
import { PackageJsonValues } from "./types";

export const clientStaticPath = join(__dirname, "static/client");
export const serverStaticPath = join(__dirname, "static/server");
export const eventsPath = join(__dirname, "events");

export const rulesPlaceholder = '"${{ RULES }}"';
export const extendsPlaceholder = '"${{ EXTENDS }}"';

export const serverPackageJsonValues: PackageJsonValues = {
  scripts: {
    lint: "eslint './src/**/*.{ts, tsx}'",
    "lint:fix": "eslint --fix './src/**/*.{ts, tsx}'",
  },
  devDependencies: {
    "@typescript-eslint/eslint-plugin": "^4.1.0",
    "@typescript-eslint/parser": "^4.1.0",
    eslint: "^7.0.0",
  },
};

export const adminUIPackageJsonValues: PackageJsonValues = {
  scripts: {
    lint: "eslint './src/**/*.{ts, tsx}'",
    "lint:fix": "eslint --fix './src/**/*.{ts, tsx}'",
  },
  devDependencies: {
    "@typescript-eslint/eslint-plugin": "^4.1.0",
    "@typescript-eslint/parser": "^4.1.0",
    eslint: "^7.0.0",
    "eslint-plugin-react": "^7.33.1",
  },
};
