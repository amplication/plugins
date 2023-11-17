import {
  CreateServerDockerComposeDevParams,
  DsgContext,
} from "@amplication/code-gen-types";
import RabbitMQPlugin from "../index";
import { mock } from "jest-mock-extended";

describe("Testing beforeCreateDockerComposeFile", () => {
  let plugin: RabbitMQPlugin;
  let context: DsgContext;
  let params: CreateServerDockerComposeDevParams;
  let expectedDockerServiceObj: any;

  beforeEach(async () => {
    plugin = new RabbitMQPlugin();
    context = mock<DsgContext>();
    params = mock<CreateServerDockerComposeDevParams>({
      updateProperties: [],
    });
    expectedDockerServiceObj = expectedDockerService();
  });

  it("should correctly generate rabbitmq docker service", async () => {
    plugin.beforeCreateDockerComposeFile(context, params);
    expect(params.updateProperties[0]).toStrictEqual(expectedDockerServiceObj);
  });
});

const expectedDockerService = () => {
  const RABBITMQ_NAME = "rabbitmq";
  const RABBITMQ_PORT = "5672";
  const RABBITMQ_UI_PORT = "15672";

  return {
    services: {
      [RABBITMQ_NAME]: {
        image: "rabbitmq:3-management",
        environment: {
          RABBITMQ_DEFAULT_USER: "user",
          RABBITMQ_DEFAULT_PASS: "password",
        },
        ports: [
          `${RABBITMQ_PORT}:${RABBITMQ_PORT}`,
          `${RABBITMQ_UI_PORT}:${RABBITMQ_UI_PORT}`,
        ],
      },
    },
  };
};
