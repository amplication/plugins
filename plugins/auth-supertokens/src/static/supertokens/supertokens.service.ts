import { Inject, Injectable } from '@nestjs/common';
import supertokens from 'supertokens-node';
import { CONFIG_INJECTION_TOKEN, AuthModuleConfig } from '../config.interface';

@Injectable()
export class SupertokensService {
  constructor(@Inject(CONFIG_INJECTION_TOKEN) private config: AuthModuleConfig) {
    supertokens.init({
      appInfo: config.appInfo,
      supertokens: {
        connectionURI: config.connectionURI,
        apiKey: config.apiKey,
      },
      recipeList: config.recipeList
    });
  }
}
