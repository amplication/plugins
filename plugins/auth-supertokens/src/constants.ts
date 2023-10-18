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
    const base = {
        dependencies: {
            "supertokens-web-js": "^0.8.0"
        }
    }
    switch(recipeName) {
        case "passwordless":
            return {
                dependencies: {
                    ...base.dependencies,
                    "libphonenumber-js": "^1.10.47"
                },
                devDependencies: {
                    "@types/react-router-dom": "^5.3.3"
                }
            }
        case "thirdparty":
        case "thirdpartyemailpassword":
            return {
                dependencies: {
                    ...base.dependencies,
                    "react-social-login-buttons": "^3.9.1",
                },
                devDependencies: {
                    "@types/react-router-dom": "^5.3.3"
                }
            }
        case "thirdpartypasswordless":
            return {
                dependencies: {
                    ...base.dependencies,
                    "react-social-login-buttons": "^3.9.1",
                    "libphonenumber-js": "^1.10.47"
                },
                devDependencies: {
                    "@types/react-router-dom": "^5.3.3"
                }
            }
        default:
            return base;
    }
}

export const SUPERTOKENS_ID_FIELD_NAME = "supertokensId";
