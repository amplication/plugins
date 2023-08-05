import { CreateServerDockerComposeParams } from "@amplication/code-gen-types"

export const dependencies = {
    dependencies: {
        "cache-manager": "3.6.3",
        "cache-manager-redis-store": "2.0.0"
    },
    devDependencies: {
        "@types/cache-manager": "3.4.3",
        "@types/cache-manager-redis-store": "2.0.1"
    }
}

export const updateDockerComposeProperties: CreateServerDockerComposeParams["updateProperties"] = [{
    services: {
        server: {
            depends_on: "redis"
        },
        redis: {
            container_name: "${REDIS_HOST}",
            image: "redis:6",
            ports: "${REDIS_PORT}:6379",
            volumes: ["redis:/data"]
        }
    },
    volumes: {
        redis: {
            driver: "local"
        }
    }
}]
