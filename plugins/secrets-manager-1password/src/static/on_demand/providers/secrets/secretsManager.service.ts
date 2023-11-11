import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SecretsManagerServiceBase } from "./base/secretsManager.service.base";
import { OnePasswordConnect } from "@1password/connect";

@Injectable()
export class SecretsManagerService extends SecretsManagerServiceBase {
  private readonly logger = new Logger();
  private readonly onePasswordClient;

  constructor(protected readonly configService: ConfigService) {
    super(configService);

    this.onePasswordClient = OnePasswordConnect({
      serverURL: configService.get("serverURL"),
      token: configService.get("OnePasswordToken"),
      keepAlive: true,
    });
  }

  async getSecret<T>(key: string): Promise<T | null> {
    try {
      return (await this.onePasswordClient.getItemById(key)) as any;
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error(
          `Error while loading secret id "${key}" - ${err.message}`,
          "SecretsManager",
        );
      }
    }

    return null;
  }
}
