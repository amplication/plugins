import {
  CreateEntityControllerBaseParams,
  DsgContext,
  EnumDataType,
} from "@amplication/code-gen-types";
import { print, readFile } from "@amplication/code-gen-utils";
import { mock } from "jest-mock-extended";
import { beforeCreateEntityControllerBase } from "../events";
import { join } from "path";
import { builders } from "ast-types";

describe("Test createEntityControllerBase", () => {
  let context: DsgContext;
  let eventParams: CreateEntityControllerBaseParams;

  beforeEach(() => {
    context = mock<DsgContext>();
    eventParams = mock<CreateEntityControllerBaseParams>({
      entity: {
        id: "user",
        name: "User",
        displayName: "User",
        pluralDisplayName: "Users",
        fields: [
          {
            id: "profilePicture",
            name: "profilePicture",
            displayName: "Profile Picture",
            dataType: EnumDataType.File,
            properties: {
              allowedFileTypes: ["image/jpeg", "image/png"],
              containerPath: "profile-pictures",
              maxFileSize: 10485760,
            },
            required: false,
            searchable: false,
          },
        ],
      },
      controllerBaseId: builders.identifier("UserControllerBase"),
    });
  });

  it("should add all the necessary methods", async () => {
    eventParams.template = await readFile(
      join(__dirname, "./fixtures/controller.base.template.ts"),
    );
    eventParams.templateMapping = {
      CONTROLLER_BASE: builders.identifier("UserControllerBase"),
    };

    const { template } = await beforeCreateEntityControllerBase(
      context,
      eventParams,
    );
    expect(print(template).code).toMatchSnapshot();
  });
});
