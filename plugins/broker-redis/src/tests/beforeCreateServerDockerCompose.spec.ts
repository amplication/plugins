import { CreateServerDockerComposeParams, DsgContext } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import RedisBrokerPlugin from "../index";


describe("Testing beforeCreateServerDockerCompose hook", () => {
    let plugin: RedisBrokerPlugin;
    let context: DsgContext;
    let params: CreateServerDockerComposeParams;

    beforeEach(() => {
        plugin = new RedisBrokerPlugin();
        context = mock<DsgContext>({
            pluginInstallations: [{ npm: name }]
        });
        params = { fileContent: 'version: "3"', updateProperties: [], outputFileName: "docker-compose.yml" }
    });
    it("should correctly modify the updateProperties", () => {
        const { updateProperties } = plugin.beforeCreateServerDockerCompose(context, params)
        expect(updateProperties).toStrictEqual([{
            services: {
                server: {
                    depends_on: ["redis_broker"]
                },
                redis_broker: {
                    container_name: "${REDIS_BROKER_HOST}",
                    image: "redis:6",
                    ports: ["${REDIS_BROKER_PORT}:6379"],
                    volumes: ["redis_broker:/redis-broker-data"]
                }
            },
            volumes: {
                redis_broker: {
                    driver: "local"
                }
            }
        }])
    });
});
