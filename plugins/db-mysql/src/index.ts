import { resolve } from "path";
import {
  dataSource,
  envVariables,
  updateDockerComposeProperties,
} from "./constants";
import {
  DsgContext,
  AmplicationPlugin,
  CreateServerDockerComposeDBParams,
  CreateServerDockerComposeParams,
  CreateServerDotEnvParams,
  CreatePrismaSchemaParams,
  Events,
  CreateServerModulesParams,
  EnumDataType,
} from "@amplication/code-gen-types";
import { kebabCase } from "lodash";

class MySQLPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      createServerModules: {
        before: this.beforeCreateServer,
      },
      CreateServerDotEnv: {
        before: this.beforeCreateServerDotEnv,
      },
      CreateServerDockerCompose: {
        before: this.beforeCreateServerDockerCompose,
      },
      CreateServerDockerComposeDB: {
        before: this.beforeCreateServerDockerComposeDB,
        after: this.afterCreateServerDockerComposeDB,
      },
      CreatePrismaSchema: {
        before: this.beforeCreatePrismaSchema,
      },
    };
  }

  beforeCreateServer(
    context: DsgContext,
    eventParams: CreateServerModulesParams
  ) {
    const message = `MultiSelectOptionSet (list of primitives type) is not supported by MySQL prisma provider. 
    You can select another data type or change your DB to PostgreSQL`;
    context.entities?.forEach(({ fields }) => {
      const isEntityWithMultiSelectOptionSetField = fields.some(
        ({ dataType }) => dataType === EnumDataType.MultiSelectOptionSet
      );
      if (isEntityWithMultiSelectOptionSetField) {
        context.logger.error(message);
        return;
      }
    });

    return eventParams;
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams
  ) {
    if (context.resourceInfo) {
      context.resourceInfo.settings.dbName = kebabCase(
        context.resourceInfo.name
      );
      context.resourceInfo.settings.dbUser = "root";
      context.resourceInfo.settings.dbPort = 3306;
    }
    eventParams.envVariables = [...eventParams.envVariables, ...envVariables];

    return eventParams;
  }

  beforeCreateServerDockerCompose(
    context: DsgContext,
    eventParams: CreateServerDockerComposeParams
  ) {
    eventParams.updateProperties.push(...updateDockerComposeProperties);
    return eventParams;
  }

  beforeCreateServerDockerComposeDB(
    context: DsgContext,
    eventParams: CreateServerDockerComposeDBParams
  ) {
    context.utils.skipDefaultBehavior = true;
    return eventParams;
  }

  async afterCreateServerDockerComposeDB(context: DsgContext) {
    const staticPath = resolve(__dirname, "../static");
    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.baseDirectory
    );

    return staticsFiles;
  }

  beforeCreatePrismaSchema(
    context: DsgContext,
    eventParams: CreatePrismaSchemaParams
  ) {
    return {
      ...eventParams,
      dataSource: dataSource,
    };
  }
}

export default MySQLPlugin;
