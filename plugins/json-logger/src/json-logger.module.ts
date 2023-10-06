import { Module } from "@nestjs/common";
import { JsonLoggerService } from "./json-logger.service";

@Module({
  providers: [JsonLoggerService],
  exports: [JsonLoggerService],
})
export class JsonLoggerModule {}
