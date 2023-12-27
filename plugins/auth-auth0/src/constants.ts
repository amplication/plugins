import { join } from "path";

export const clientStaticPath = join(__dirname, "static", "client");
export const serverStaticPath = join(__dirname, "static", "server");
export const templatesPath = join(__dirname, "templates");

export const adminUIPackageJsonValues = {
  dependencies: {
    "@auth0/auth0-spa-js": "^2.1.2",
    "react-router-dom": "^5.3.3",
    history: "4.10.1",
  },
  devDependencies: {
    "@types/react-router-dom": "5.3.2",
    "@types/history": "^4.7.11",
  },
};

export const serverPackageJsonValues = {
  dependencies: {
    "jwks-rsa": "^3.0.1",
  },
};

export const AUTH_ENTITY_ERROR = "Authentication entity does not exist";
export const AUTH_ENTITY_LOG_ERROR =
  "Authentication entity does not exist. Have you configured the authentication entity in the Resource Settings?";
export const EmailError = (
  entityName: string,
  fieldName: string,
  propertyName: string
) =>
  `The entity ${entityName} does not have a field named ${fieldName} specified in the ${propertyName} property or the field is not of type Email. Please add a field named ${fieldName} of type Email to the entity ${entityName} or change the ${propertyName} property in the recipe`;
