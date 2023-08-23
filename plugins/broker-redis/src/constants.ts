/**
 * @Amplication example constants file.
 * Add all your constants here.
 */

import { join } from "path";

export const ExampleConst = "example";

export const staticsPath = join(__dirname, "static");
export const templatesPath = join(__dirname, "templates");

export const dependencies = {
    dependencies: {
        "redis": "3.1.2",
        "@nestjs/microservices": "8.2.3"
    }
}
