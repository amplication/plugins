import { Injectable } from '@nestjs/common';
import sparkPlug from 'sparkplug-client';
import { SparkplugServiceBase } from './base/sparkplug.service.base';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SparkplugService extends SparkplugServiceBase {
  constructor(protected readonly configService: ConfigService) {
    super(configService);
  }
}
