import { ConfigService } from "@nestjs/config";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

import { OnePasswordConnect, FullItem } from "@1password/connect";
import { Logger } from "@nestjs/common";
import { Secrets } from "./secrets";

export const secretsManagerFactory = {
  provide: "ONE_PASSWORD_SECRETS_MANAGER",
  useFactory: async (configService: ConfigService) => {
    const logger = new Logger();

    const client = OnePasswordConnect({
      serverURL: configService.get("serverURL"),
      token: configService.get("OnePasswordToken"),
      keepAlive: true,
    });

    var secrets: Partial<Record<Secrets, unknown>> = {};

    for (const key of Object.values(Secrets)) {
      try {
        const response = (await client.getItemById(key)) as any;
        secrets = {
          ...secrets,
          [key]: response,
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          logger.error(
            `Error while loading from secret id "${key}" - ${err.message}`,
            "SecretsManager",
          );
        }
      }
    }

    return secrets;
  },
  inject: [ConfigService],
};
