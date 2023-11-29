import { Module } from "@nestjs/common";
import { SecretsManagerService } from "./secretsManager.service";
import { SecretsManagerFactory } from "./secretsManagerFactory";

@Module({
    providers: [SecretsManagerFactory, SecretsManagerService],
    exports: [SecretsManagerService],
})
export class SecretsManagerModule {

}