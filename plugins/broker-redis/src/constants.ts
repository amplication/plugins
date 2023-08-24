import { CreateServerDockerComposeDevParams, CreateServerDockerComposeParams } from "@amplication/code-gen-types";
import { join } from "path";

export const staticsPath = join(__dirname, "static");

export const dependencies = {
    dependencies: {
        "redis": "3.1.2",
        "@nestjs/microservices": "8.2.3"
    }
}

export const updateDockerComposeProperties: CreateServerDockerComposeParams["updateProperties"] = [{
    services: {
        server: {
            depends_on: ["redis"]
        },
        redis: {
            container_name: "${REDIS_HOST}",
            image: "redis:6",
            ports: ["${REDIS_PORT}:6379"],
            volumes: ["redis:/data"]
        }
    },
    volumes: {
        redis: {
            driver: "local"
        }
    }
}]

export const updateDockerComposeDevProperties: CreateServerDockerComposeDevParams["updateProperties"] = [{
    services: {
        redis: {
            container_name: "${REDIS_HOST}",
            image: "redis:6",
            ports: ["${REDIS_PORT}:6379"],
            volumes: ["redis:/data"]
        }
    },
    volumes: {
        redis: {
            driver: "local"
        }
    }
}]
