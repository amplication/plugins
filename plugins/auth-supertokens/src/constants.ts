import { join } from "path";

export const staticsPath = join(__dirname, "static");

export const templatesPath = join(__dirname, "templates");

export const dependencies = {
    dependencies: {
        "supertokens-node": "^16.2.0"
    }
}

export const adminUIDependencies = {
    dependencies: {
        "supertokens-web-js": "^0.8.0"
    }
}

export const SUPERTOKENS_ID_FIELD_NAME = "supertokensId";
