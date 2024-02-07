import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientProxyFactory } from "@nestjs/microservices";
import { generateClientOptions } from "./generateClientOptions";
import { MqttProducerService } from "./mqtt.producer.service";
import { MqttController } from "./mqtt.controller";
import { SparkplugService } from './sparkplug.service';

@Global()
@Module({
  imports: [],
  providers: [
    {
      provide: "MQTT_CLIENT",
      useFactory: (configService: ConfigService) => {
        return ClientProxyFactory.create(
          generateClientOptions(configService),
        );
      },
      inject: [ConfigService],
    },
    MqttProducerService,
    SparkplugService
  ],
  controllers: [MqttController],
  exports: [MqttProducerService, SparkplugService],
})

export class MqttModule {}