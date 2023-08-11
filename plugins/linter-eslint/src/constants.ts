import { join } from "path";

export const clientStaticPath = join(__dirname, "static/client");
export const serverStaticPath = join(__dirname, "static/server");
export const eventsPath = join(__dirname, "events");

export const rulesPlaceholder = "\"${{ RULES }}\"";

export const serverPackageJsonValues = {
  scripts: {
    "lint": "eslint './src/**/*.{ts, tsx}'",
    "lint:fix": "eslint --fix './src/**/*.{ts, tsx}'",
  },
  devDependencies: {
    "@typescript-eslint/eslint-plugin": "^6.2.1",
    "@typescript-eslint/parser": "^6.2.1",
    "eslint": "^8.46.0",
  }
};

export const adminUIPackageJsonValues = {
  scripts: {
    "lint": "eslint './src/**/*.{ts, tsx}'",
    "lint:fix": "eslint --fix './src/**/*.{ts, tsx}'",
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.2.1",
    "@typescript-eslint/parser": "^6.2.1",
    "eslint": "^8.46.0",
    "eslint-plugin-react": "^7.33.1"
  }
};
