import {
  CreateServerPackageJsonParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { beforeCreateServerPackageJson } from "../events";
import { mock } from "jest-mock-extended";

describe("Testing createPackageJson hook", () => {
  let context: DsgContext;
  let eventParams: CreateServerPackageJsonParams;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [
        {
          npm: "@amplication/plugin-broker-mqtt",
        },
      ],
    });
    eventParams = {
      updateProperties: [],
      fileContent: "",
    };
  });

  it("should add mqtt and microservices to the dependencies", async () => {
    const expectedDependencies = [
      {
        dependencies: {
          "@nestjs/microservices": "^10.3.1",
          mqtt: "^5.3.5",
        },
      },
    ];

    const returnedParams = beforeCreateServerPackageJson(context, eventParams);
    expect(returnedParams.updateProperties).toEqual(expectedDependencies);
  });

  it("should add sparkplug-client to the dependencies", async () => {
    context.pluginInstallations[0].settings = {
      sparkplugConfig: {
        groupIdentifier: "groupIdentifier",
        edgeNodeIdentifier: "edgeNodeIdentifier",
        enabled: true,
      },
    };

    const expectedDependencies = [
      {
        dependencies: {
          "@nestjs/microservices": "^10.3.1",
          mqtt: "^5.3.5",
        },
      },
      {
        dependencies: {
          "sparkplug-client": "^3.2.4",
        },
      },
    ];

    const returnedParams = beforeCreateServerPackageJson(context, eventParams);
    expect(returnedParams.updateProperties).toEqual(expectedDependencies);
  });
});
