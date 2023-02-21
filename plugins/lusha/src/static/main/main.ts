import {
  bootstrapV2,
  LushaAppModule,
  OptionsServiceBootstrap,
  ServiceType,
} from "@lusha/core-nestjs";
import config from "config";

import { AppModule } from "./app.module";

bootstrapV2(
  LushaAppModule.register({
    clientModules: { appModule: AppModule.register() },
  }),
  {
    serviceName: config.get("serviceName"),
    port: config.get("port"),
  } as OptionsServiceBootstrap,
  ServiceType.Restful
);
