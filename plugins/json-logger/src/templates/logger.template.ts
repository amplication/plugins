

import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class LoggerService {
  constructor(private readonly logger: PinoLogger) {}

  log(logObject: Record<string, any>): void {
    try {
      if (typeof logObject !== 'object' || Array.isArray(logObject)) {
        throw new Error('logObject must be a valid JSON object');
      }
      this.logger.debug(logObject);
    } catch (error) {
      this.logger.error(error.message);
    }
  }
}
