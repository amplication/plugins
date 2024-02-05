import {
  CreateServerDockerComposeParams,
  CreateServerDockerComposeDevParams,
} from "@amplication/code-gen-types";

export const dependencies = {
  dependencies: {
    "@nestjs/cache-manager": "^2.1.0",
    "cache-manager": "5.2.4",
    "cache-manager-ioredis-yet": "^1.2.2",
  },
  devDependencies: {
    "@types/cache-manager": "4.0.4",
  },
};

export const updateDockerComposeProperties: CreateServerDockerComposeParams["updateProperties"] =
  [
    {
      services: {
        server: {
          depends_on: ["redis"],
        },
        redis: {
          container_name: "${REDIS_HOST}",
          image: "redis:7",
          ports: ["${REDIS_PORT}:6379"],
          volumes: ["redis:/data"],
        },
      },
      volumes: {
        redis: {
          driver: "local",
        },
      },
    },
  ];

export const updateDockerComposeDevProperties: CreateServerDockerComposeDevParams["updateProperties"] =
  [
    {
      services: {
        redis: {
          container_name: "${REDIS_HOST}",
          image: "redis:7",
          ports: ["${REDIS_PORT}:6379"],
          volumes: ["redis:/data"],
        },
      },
      volumes: {
        redis: {
          driver: "local",
        },
      },
    },
  ];
