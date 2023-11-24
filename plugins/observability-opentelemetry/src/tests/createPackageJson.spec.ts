import {
  CreateServerPackageJsonParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { beforeCreateServerPackageJson } from "@/events/createPackageJson";
import { mock } from "jest-mock-extended";

describe("Testing beforeServerPackageJson hook", () => {
  let context: DsgContext;
  let eventParams: CreateServerPackageJsonParams;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [
        { npm: "@amplication/plugin-observability-opentelemetry" },
      ],
    });
    eventParams = {
      fileContent: "",
      updateProperties: [],
    };
  });

  it("should add required dependencies to package.json", () => {
    const { updateProperties } = beforeCreateServerPackageJson(
      context,
      eventParams,
    );

    expect(updateProperties).toStrictEqual([
      {
        dependencies: {
          "@amplication/opentelemetry-nestjs": "^4.4.0",
        },
      },
    ]);
  });
});
