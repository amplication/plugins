import { ConfigService } from "@nestjs/config";
import Vault from "node-vault";

export const SecretsManagerProvider = {
  provide: "SECRETS_CLIENT",
  useFactory: async (configService: ConfigService) => {
    const vault = Vault({
      apiVersion: configService.get("VAULT_API_VER"),
      endpoint: configService.get("VAULT_ENDPOINT"),
    });
    VAULT_AUTH;

    return vault;
  },
  inject: [ConfigService],
};
