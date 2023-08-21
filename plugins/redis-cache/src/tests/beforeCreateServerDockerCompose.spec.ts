import { CreateServerDockerComposeParams, DsgContext } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import RedisCachePlugin from "../index";


describe("Testing beforeCreateServerDockerCompose hook", () => {
    let plugin: RedisCachePlugin;
    let context: DsgContext;
    let params: CreateServerDockerComposeParams;

    beforeEach(() => {
        plugin = new RedisCachePlugin();
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
                    depends_on: ["redis"]
                },
                redis: {
                    container_name: "${REDIS_HOST}",
                    image: "redis:6",
                    ports: ["${REDIS_PORT}:6379"],
                    volumes: ["redis:/data"]
                }
            },
            volumes: {
                redis: {
                    driver: "local"
                }
            }
        }])
    });
});