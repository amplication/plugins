import {
  bootstrapV2,
  SapphireAppModule,
  OptionsServiceBootstrap,
  ServiceType,
} from "@sapphire/core-nestjs";
import config from "config";

import { AppModule } from "./app.module";

bootstrapV2(
  SapphireAppModule.register({
    clientModules: { appModule: AppModule.register() },
  }),
  {
    serviceName: config.get("serviceName"),
    port: config.get("port"),
  } as OptionsServiceBootstrap,
  ServiceType.Restful
);
