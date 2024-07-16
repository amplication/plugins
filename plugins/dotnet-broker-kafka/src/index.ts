import {
  dotnetPluginEventsTypes,
  dotnetPluginEventsParams as dotnet,
  dotnetTypes,
  EnumResourceType,
  FileMap,
} from "@amplication/code-gen-types";
import {
  DOCKER_SERVICE_KAFKA_NAME,
  DOCKER_SERVICE_KAFKA_PORT,
  updateDockerComposeDevProperties,
} from "./constants";
import {
  Class,
  ClassReference,
  CodeBlock,
  CsharpSupport,
} from "@amplication/csharp-ast";
import { pascalCase } from "pascal-case";
import { resolve } from "path";
import { createMessageBroker, createStaticFileFileMap } from "./core";
class DotnetKafkaPlugin implements dotnetTypes.AmplicationPlugin {
  register(): dotnetPluginEventsTypes.DotnetEvents {
    return {
      CreateProgramFile: {
        before: this.beforeCreateProgramFile,
      },
      LoadStaticFiles: {
        after: this.afterLoadStaticFiles,
      },
      CreateServerCsproj: {
        before: this.beforeCreateServerCsproj,
      },
      CreateServerDockerCompose: {
        before: this.beforeCreateDockerComposeFile,
      },

      CreateMessageBrokerService: {
        after: this.afterCreateMessageBrokerService,
      },

      CreateServerAppsettings: {
        before: this.beforeCreateServerAppsettings,
      },
    };
  }
  //add kafka settungs to appsettings.json
  beforeCreateServerAppsettings(
    context: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateServerAppsettingsParams
  ) {
    eventParams.updateProperties = {
      ...eventParams.updateProperties,
      kafka: {
        //haim: should we get this from plugin settings?
        BootstrapServers: "localhost:9092",
      },
    };
    return eventParams;
  }

  //add confluent kafka package reference
  beforeCreateServerCsproj(
    _: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateServerCsprojParams
  ) {
    eventParams.packageReferences.push({
      include: "Confluent.Kafka",
      version: "2.5.0",
    });

    return eventParams;
  }
  // set the program.cs code
  beforeCreateProgramFile(
    context: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateProgramFileParams
  ) {
    const { logger, otherResources, resourceInfo } = context;
    const serviceNamespace = pascalCase(resourceInfo?.name ?? "");

    let messageBrokerName =
      otherResources?.find(
        (resource) => resource.resourceType === EnumResourceType.MessageBroker
      )?.resourceInfo?.name ?? null;

    if (!messageBrokerName) {
      logger.warn(
        "Message broker name not found. Did you forget to add a message broker resource?"
      );
      messageBrokerName = "kafka";
    }
    eventParams.builderServicesBlocks.push(
      new CodeBlock({
        code: `builder.Add${messageBrokerName}();`,
        references: [
          new ClassReference({
            name: messageBrokerName,
            namespace: `${serviceNamespace}.Brokers.${messageBrokerName}`,
          }),
        ],
      })
    );
    //mandatory
    return eventParams;
  }
  //add infrastructure files
  async afterLoadStaticFiles(
    context: dotnetTypes.DsgContext,
    eventParams: dotnet.LoadStaticFilesParams,
    files: FileMap<CodeBlock>
  ): Promise<FileMap<CodeBlock>> {
    const { resourceInfo } = context;
    if (!resourceInfo) return files;

    const resourceName = pascalCase(resourceInfo.name);

    const destPathBase = `${eventParams.basePath}/src/Brokers/Infrastructure`;
    const staticFiles = [
      {
        src: "./static/common/Infrastructure/InternalConsumer.cs",
        des: `${destPathBase}/InternalConsumer.cs`,
      },
      {
        src: "./static/common/Infrastructure/InternalProducer.cs",
        des: `${destPathBase}/InternalProducer.cs`,
      },
      {
        src: "./static/common/Infrastructure/KafkaConsumerService.cs",
        des: `${destPathBase}/KafkaConsumerService.cs`,
      },
      {
        src: "./static/common/Infrastructure/KafkaOptions.cs",
        des: `${destPathBase}/KafkaOptions.cs`,
      },
      {
        src: "./static/common/Infrastructure/TopicAttribute.cs",
        des: `${destPathBase}/TopicAttribute.cs`,
      },
    ];

    for (let index = 0; index < staticFiles.length; index++) {
      const fileRelativePath = staticFiles[index];
      const filePath = resolve(__dirname, fileRelativePath.src);

      const fileMap = await createStaticFileFileMap(
        fileRelativePath.des,
        filePath,
        context,
        [
          CsharpSupport.classReference({
            name: `${resourceName}DbContext`,
            namespace: `${resourceName}.Infrastructure`,
          }),
        ]
      );
      files.merge(fileMap);
    }

    return files;
  }

  async afterCreateMessageBrokerService(
    dsgContext: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateMessageBrokerServiceParams
  ): Promise<FileMap<Class>> {
    return createMessageBroker(dsgContext);
  }

  beforeCreateDockerComposeFile(
    dsgContext: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateServerDockerComposeParams
  ): dotnet.CreateServerDockerComposeParams {
    const updateDockerComposeProperties = {
      services: {
        server: {
          environment: {
            KAFKA_BROKERS: `${DOCKER_SERVICE_KAFKA_NAME}:${DOCKER_SERVICE_KAFKA_PORT}`,
            KAFKA_ENABLE_SSL: "${KAFKA_ENABLE_SSL}",
            KAFKA_CLIENT_ID: "${KAFKA_CLIENT_ID}",
            KAFKA_GROUP_ID: "${KAFKA_GROUP_ID}",
          },
        },
      },
    };
    eventParams.updateProperties.push(updateDockerComposeProperties);
    eventParams.updateProperties.push(updateDockerComposeDevProperties);
    eventParams.updateProperties.push({
      services: {
        [DOCKER_SERVICE_KAFKA_NAME]: {
          environment: {
            KAFKA_ADVERTISED_LISTENERS: `PLAINTEXT://${DOCKER_SERVICE_KAFKA_NAME}:29092,PLAINTEXT_HOST://${DOCKER_SERVICE_KAFKA_NAME}:${DOCKER_SERVICE_KAFKA_PORT}`,
          },
        },
      },
    });
    return eventParams;
  }
}

export default DotnetKafkaPlugin;
