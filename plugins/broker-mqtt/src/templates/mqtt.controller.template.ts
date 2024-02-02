import { Controller } from "@nestjs/common";
import { Ctx, EventPattern, MqttContext, Payload } from "@nestjs/microservices";

@Controller("mqtt-controller")
export class MqttController {
  @EventPattern("topic.sample.v1")
  async onTopicSampleV1(
    @Payload()
    value: string | Record<string, unknown> | null,
    @Ctx() 
    context: MqttContext
  ): Promise<void> {
    console.log("Topic " + context.getTopic())
    console.log("Message " + context.getPacket())
  }
}