import { ServerRMQ, CustomTransportStrategy } from "@nestjs/microservices";

export class RabbitMQ extends ServerRMQ implements CustomTransportStrategy {
  async setupChannel(channel: any, callback: Function): Promise<void> {
    const exchange = this.queue;
    await channel.assertExchange(exchange, "fanout", { durable: true });

    await channel.assertQueue(SERVICE_NAME, {
      exclusive: false,
      durable: true,
      ...this.queueOptions,
    });
    await channel.bindQueue(SERVICE_NAME, exchange, "");

    channel.consume(
      SERVICE_NAME,
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
