import { join } from "path";

export const clientStaticPath = join(__dirname, "static", "client");
export const serverStaticPath = join(__dirname, "static", "server");
export const templatesPath = join(__dirname, "templates");

export const adminUIPackageJsonValues = {
  dependencies: {
    "@auth0/auth0-spa-js": "^2.1.2",
    "@types/react-router-dom": "^5.3.3",
    history: "4.10.1",
  },
};

export const serverPackageJsonValues = {
  dependencies: {
    "jwks-rsa": "^3.0.1",
  },
};
