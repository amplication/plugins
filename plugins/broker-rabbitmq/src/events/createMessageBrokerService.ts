import {
  CreateMessageBrokerServiceParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { join, resolve } from "path";
import { templatesPath } from "../constants";
import {
  addImports,
  importNames,
  interpolate,
  print,
  readFile,
} from "../util/ast";
import { isMessageBrokerConnected } from "../util/topicsChecker";
import { builders } from "ast-types";

export async function afterCreateMessageBrokerService(
  context: DsgContext,
  eventParams: CreateMessageBrokerServiceParams
): Promise<ModuleMap> {
  const { serverDirectories, serviceTopics } = context;
  const { messageBrokerDirectory } = serverDirectories;

  const staticPath = resolve(__dirname, "./static/");

  const modules = await context.utils.importStaticModules(
    staticPath,
    messageBrokerDirectory
  );

  const producerTemplatePath = join(
    templatesPath,
    "rabbitmq.producer.service.template.ts"
  );
  const producerTemplate = await readFile(producerTemplatePath);

  let topicsTypeId;

  if (isMessageBrokerConnected(context)) {
    topicsTypeId = builders.identifier("AllMessageBrokerTopics");

    const topicsEnumImport = importNames([topicsTypeId], `./topics`);

    addImports(
      producerTemplate,
      [topicsEnumImport].filter(
        (x) => x //remove nulls and undefined
      )
    );
  } else {
    topicsTypeId = builders.stringTypeAnnotation();
  }

  const producerTemplateMapping = {
    TOPICS_TYPE: topicsTypeId,
  };

  interpolate(producerTemplate, producerTemplateMapping);

  producerTemplate;

  const producerFile = {
    code: print(producerTemplate).code,
    path: join(
      context.serverDirectories.messageBrokerDirectory,
      "rabbitmq.producer.service.ts"
    ),
  };
  await modules.set(producerFile);

  return modules;
}
