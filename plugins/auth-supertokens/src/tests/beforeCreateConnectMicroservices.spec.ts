import {
  BuildLogger,
  CreateConnectMicroservicesParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { parse } from "@amplication/code-gen-utils";
import { prettyPrint } from "recast";
import { name } from "../../package.json";
import RedisBrokerPlugin from "../index";
import { prettyCode } from "../utils";

describe("Testing beforeCreateConnectMicroservices hook", () => {
  let plugin: RedisBrokerPlugin;
  let context: DsgContext;
  let params: CreateConnectMicroservicesParams;

  beforeEach(() => {
    plugin = new RedisBrokerPlugin();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
      logger: mock<BuildLogger>(),
    });
    params = {
      ...mock<CreateConnectMicroservicesParams>(),
      template: parse(`
            import { INestApplication } from "@nestjs/common";
            import { ConfigService } from "@nestjs/config";
            export async function connectMicroservices(app: INestApplication) {
                const configService = app.get(ConfigService);
            }
            `),
    };
  });
  it("should add the code for the supertokens cors and filters settings", () => {
    const { template } = plugin.beforeCreateConnectMicroservices(
      context,
      params
    );
    const expectedCode = prettyCode(`
        import { INestApplication } from "@nestjs/common";
        import { ConfigService } from "@nestjs/config";

        import supertokens from 'supertokens-node';
        import { generateSupertokensOptions } from "./auth/supertokens/generateSupertokensOptions";
        import { STAuthFilter } from './auth/supertokens/auth.filter';
        export async function connectMicroservices(app: INestApplication) {
            const configService = app.get(ConfigService);
            app.enableCors({
                origin: [generateSupertokensOptions(configService).appInfo.websiteDomain],
                allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
                credentials: true,
            });
            app.useGlobalFilters(new STAuthFilter());
        }
        `);
    const templateCode = prettyPrint(template).code;
    expect(templateCode).toBe(expectedCode);
  });
});
