import { Module } from "@nestjs/common";
import { SecretsManagerService } from "./secretsManager.service";
import { SecretsManagerProvider } from "./secretsManager.provider";

@Module({
  providers: [SecretsManagerService, SecretsManagerProvider],
  exports: [SecretsManagerService],
})
export class SecretsManagerModule {}
