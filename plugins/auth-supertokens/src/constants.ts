import { join } from "path";

export const staticsPath = join(__dirname, "static");

export const templatesPath = join(__dirname, "templates");

export const dependencies = {
    dependencies: {
        "supertokens-node": "15.1.0"
    }
}

export const SUPERTOKENS_ID_FIELD_NAME = "supertokensId";
