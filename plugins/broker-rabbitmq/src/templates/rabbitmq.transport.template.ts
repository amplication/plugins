import { ServerRMQ, CustomTransportStrategy } from "@nestjs/microservices";

export class RabbitMQ extends ServerRMQ implements CustomTransportStrategy {
  async setupChannel(channel: any, callback: Function): Promise<void> {
    const exchange = this.queue;
    const groupId =
      this.getOptionsProp(this.options?.queueOptions, "consumerGroupId") ||
      SERVICE_NAME;

    await channel.assertExchange(exchange, "fanout", { durable: true });

    await channel.assertQueue(groupId, {
      exclusive: false,
      durable: true,
      ...this.queueOptions,
    });
    await channel.bindQueue(groupId, exchange, "");

    channel.consume(
      groupId,
      async (msg: any) => {
        await this.handleMessage(msg, channel);
        channel.ack(msg);
      },
      {
        noAck: false,
      }
    );
    callback();
  }
}
