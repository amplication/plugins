// src/types.ts

// src/types.ts

import { AmplicationPlugin } from "@amplication/code-gen-types";
import { EventNames, ModuleMap } from "@amplication/code-gen-types";
import { DsgContext, CreateServerParams } from "@amplication/code-gen-types";
import { LoggerModule } from './logger.module';
import { Module } from '@nestjs/common';

class LoggerPlugin implements AmplicationPlugin {
  register() {
    return {
      [EventNames.CreateServer]: {
        after: this.afterCreateServer,
      },
    };
  }

  async afterCreateServer(
    context: DsgContext,
    eventParams: CreateServerParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    // Create a new array with the updated modules
    const updatedModules = [...eventParams.modules];

    // Add the logger service to the generated modules
    const loggerModule = `
      ${Module.toString()}

      import { LoggerService } from './logger.service';

      @Module({
        providers: [LoggerService],
        exports: [LoggerService],
      })
      export class ${LoggerModule} {}
    `;

    updatedModules.push({
      name: `${LoggerModule}.ts`,
      content: loggerModule,
    });

    // Import the logger service in the main application module
    updatedModules.forEach((module) => {
      if (module.name === 'app.module.ts') {
        const loggerImport = `import { ${LoggerModule} } from './${LoggerModule}';`;
        const loggerImportExists = module.content.includes(loggerImport);

        if (!loggerImportExists) {
          module.content = loggerImport + module.content;
        }

        const loggerModuleAdd = `${LoggerModule},`;
        const loggerModuleAddExists = module.content.includes(loggerModuleAdd);

        if (!loggerModuleAddExists) {
          module.content = module.content.replace(
            /(?<=imports:\s*\[)(?=[^]*])/m,
            `${loggerModuleAdd}\n`
          );
        }
      }
    });

    return {
      ...modules,
      ...updatedModules.reduce((acc, module) => {
        acc[module.name] = module.content;
        return acc;
      }, {}),
    };
  }
}