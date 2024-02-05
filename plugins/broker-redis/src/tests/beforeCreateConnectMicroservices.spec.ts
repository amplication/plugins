import {
  CreateConnectMicroservicesParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import * as utils from "../utils";
import RedisBrokerPlugin from "../index";

describe("Testing beforeCreateConnectMicroservices hook", () => {
  let plugin: RedisBrokerPlugin;
  let context: DsgContext;
  let params: CreateConnectMicroservicesParams;

  beforeEach(() => {
    plugin = new RedisBrokerPlugin();
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
  it("should add the necessary code to connect the redis microservice", () => {
    const { template } = plugin.beforeCreateConnectMicroservices(
      context,
      params
    );
    const expectedCode = utils.prettyCode(`
        import { INestApplication } from "@nestjs/common";
        import { ConfigService } from "@nestjs/config";
        import { MicroserviceOptions } from "@nestjs/microservices"
        import { generateRedisClientOptions } from "./redis/generateRedisClientOptions";

        export async function connectMicroservices(app: INestApplication) {
            const configService = app.get(ConfigService);
            app.connectMicroservice<MicroserviceOptions>(generateRedisClientOptions(configService));
        }
        `);
    const templateCode = utils.prettyPrint(template).code;
    expect(templateCode).toBe(expectedCode);
  });
});
