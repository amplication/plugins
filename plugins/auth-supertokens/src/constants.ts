import { join } from "path";
import { Settings } from "./types";

export const staticsPath = join(__dirname, "static");

export const templatesPath = join(__dirname, "templates");

export const dependencies = {
    dependencies: {
        "supertokens-node": "^16.2.0"
    }
}

export const adminUIDependencies = (recipeName: Settings["recipe"]["name"]) => {
    switch(recipeName) {
        case "emailpassword":
            return {
                dependencies: {
                    "supertokens-web-js": "^0.8.0"
                }
            }
        case "passwordless":
            return {
                dependencies: {
                    "supertokens-web-js": "^0.8.0",
                    "libphonenumber-js": "^1.10.47"
                },
                devDependencies: {
                    "@types/react-router-dom": "^5.3.3"
                }
            }
    }
}

export const SUPERTOKENS_ID_FIELD_NAME = "supertokensId";
