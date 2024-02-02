import { Controller } from "@nestjs/common";
import { Ctx, EventPattern, MqttContext, Payload } from "@nestjs/microservices";

@Controller("mqtt-controller")
export class MqttController {}
