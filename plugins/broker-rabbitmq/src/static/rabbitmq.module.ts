import { Global, Module } from "@nestjs/common";
import { ClientProxyFactory } from "@nestjs/microservices";
import { generateRabbitMQClientOptions } from "./generateRabbitMQClientOptions";
import { RabbitMQProducerService } from "./rabbitmq.producer.service";
import { RabbitMQController } from "./rabbitmq.controller";
import { ConfigService } from "@nestjs/config";

@Global()
@Module({
  imports: [],
  providers: [
    {
      provide: "RABBITMQ_CLIENT",
      useFactory: (configService: ConfigService) => {
        return ClientProxyFactory.create(
          generateRabbitMQClientOptions(configService)
        );
      },
      inject: [ConfigService],
    },
    RabbitMQProducerService,
  ],
  controllers: [RabbitMQController],
  exports: [RabbitMQProducerService],
})
export class RabbitMQModule { }
