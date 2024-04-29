import {
  CreateEntityServiceBaseParams,
  DsgContext,
  EnumDataType,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { builders } from "ast-types";
import { beforeCreateEntityServiceBase } from "../events";
import { print, readFile } from "@amplication/code-gen-utils";
import { resolve, join } from "path";

describe("Test createEntityServiceBase hook", () => {
  let context: DsgContext;
  let eventParams: CreateEntityServiceBaseParams;

  beforeEach(() => {
    context = mock<DsgContext>();
    eventParams = mock<CreateEntityServiceBaseParams>({
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
      serviceBaseId: builders.identifier("UserServiceBase"),
    });
  });

  it("should add all the necessary imports", async () => {
    eventParams.template = await readFile(
      resolve(join(__dirname, "./fixtures/service.base.template.ts")),
    );
    eventParams.templateMapping = {
      SERVICE_BASE: builders.identifier("UserServiceBase"),
    };

    const { template } = await beforeCreateEntityServiceBase(
      context,
      eventParams,
    );
    expect(print(template).code).toMatchSnapshot();
  });
});
