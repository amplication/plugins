import {
  CreateConnectMicroservicesParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import * as utils from "../util/ast";
import RabbitMQPlugin from "../index";

describe("Testing beforeCreateConnectMicroservices", () => {
  let plugin: RabbitMQPlugin;
  let context: DsgContext;
  let params: CreateConnectMicroservicesParams;

  beforeEach(() => {
    plugin = new RabbitMQPlugin();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
    params = {
      ...mock<CreateConnectMicroservicesParams>(),
      template: utils.parse(`
            import { INestApplication } from "@nestjs/common";
            import { ConfigService } from "@nestjs/config";

            export async function connectMicroservices(app: INestApplication) {
                const configService = app.get(ConfigService);
            }
            `),
    };
  });
  it("should add the necessary code to connect the rabbitmq microservice", () => {
    const { template } = plugin.beforeCreateConnectMicroservices(
      context,
      params,
    );
    const expectedCode = utils.prettyCode(`
        import { INestApplication } from "@nestjs/common";
        import { ConfigService } from "@nestjs/config";
        import { generateRabbitMQClientOptions } from "./rabbitmq/generateRabbitMQClientOptions";
        import { MicroserviceOptions } from "@nestjs/microservices";

        export async function connectMicroservices(app: INestApplication) {
        const configService = app.get(ConfigService);
        app.connectMicroservice<MicroserviceOptions>(generateRabbitMQClientOptions(configService));
        }
        `);
    const templateCode = utils.prettyPrint(template).code;
    expect(templateCode).toBe(expectedCode);
  });
});
