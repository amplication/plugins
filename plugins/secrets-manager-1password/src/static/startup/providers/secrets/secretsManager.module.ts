import { Module } from "@nestjs/common";
import { SecretsManagerService } from "./secretsManager.service";
import { secretsManagerFactory } from "./secretsManagerFactory";

@Module({
  providers: [SecretsManagerService, secretsManagerFactory],
  exports: [SecretsManagerService],
})
export class SecretsManagerModule {}
