import {
  CreateServerDockerComposeParams,
  PrismaDataSource,
  VariableDictionary,
} from "@amplication/code-gen-types";

export const envVariables: VariableDictionary = [
  { DB_USER: "${dbUser}" },
  { DB_PASSWORD: "${dbPassword}" },
  { DB_PORT: "${dbPort}" },
  {
    DB_URL: "mongodb://${dbUser}:${dbPassword}@${dbHost}/${dbName}?authSource=admin",
  },
];

export const updateDockerComposeProperties: CreateServerDockerComposeParams["updateProperties"] =
  [
    {
      services: {
        server: {
          environment: {
            DB_URL: "mongodb://${DB_USER}:${DB_PASSWORD}@db:27017",
          },
        },
        db: {
          image: "mongo",
          ports: ["${DB_PORT}:27017"],
          environment: {
            POSTGRES_USER: "${DB_USER}",
            POSTGRES_PASSWORD: "${DB_PASSWORD}",
          },
          volumes: ["mongodb:/var/lib/postgresql/data"],
          healthcheck: {
            test: [
              "CMD",
              "pg_isready",
              "-q",
              "-d",
              "${DB_DB_NAME}",
              "-U",
              "${DB_USER}",
            ],
            timeout: "45s",
            interval: "10s",
            retries: 10,
          },
        },
      },
      volumes: {
        mongo: null,
      },
    },
  ];

export const dataSource: PrismaDataSource = {
  name: "mongo",
  provider: "MongoDB",
  urlEnv: "DB_URL",
};
