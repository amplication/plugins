import { CreateMainFileParams, DsgContext } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { beforCreateMainFile } from "../events";

describe("Testing createMainFile hook", () => {
  let context: DsgContext;
  let eventParams: CreateMainFileParams;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [
        {
          npm: "@amplication/plugin-storage-core",
        },
      ],
    });
    eventParams = mock<CreateMainFileParams>();
  });

  it("should use default values if plugin settings are not defined", async () => {
    eventParams = await beforCreateMainFile(context, eventParams);

    expect(eventParams).toBeDefined();
    expect(eventParams.template).toMatchSnapshot();
  });
});
