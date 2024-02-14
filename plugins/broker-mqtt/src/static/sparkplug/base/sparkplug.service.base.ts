import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
var SparkPlug = require('sparkplug-client');

@Injectable()
export class SparkplugServiceBase {
  public client: ReturnType<typeof SparkPlug.newClient>;
  private readonly logger = new Logger(SparkplugServiceBase.name);

  constructor(protected readonly configService: ConfigService) {
    const serverUrl = `mqtt://${this.configService.get('MQTT_BROKER_HOST')}:${this.configService.get('MQTT_PORT')}`;

    const config = {
      clientId : this.configService.get('MQTT_SPARKPLUG_CLIENT_ID')!,
      username : this.configService.get('MQTT_USERNAME')!,
      password : this.configService.get('MQTT_PASSWORD')!,
      groupId : this.configService.get('MQTT_SPARKPLUG_GROUP_ID')!,
      edgeNode: this.configService.get('MQTT_SPARKPLUG_EDGE_NODE')!,
      serverUrl,
    };

    this.client = SparkPlug.newClient(config);

    this.client.on('connect', () => {
      this.logger.log('Connected to MQTT broker');
    });

    this.client.on('error', (err: Error) => {
      this.logger.error(`Error: ${err}`);
    });
  }
}
