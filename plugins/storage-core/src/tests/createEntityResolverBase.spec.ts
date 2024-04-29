import {
  CreateEntityResolverBaseParams,
  DsgContext,
  EnumDataType,
} from "@amplication/code-gen-types";
import { print, readFile } from "@amplication/code-gen-utils";
import { mock } from "jest-mock-extended";
import { beforeCreateEntityResolverBase } from "../events";
import { join } from "path";
import { builders } from "ast-types";

describe("Test createEntityResolverBase", () => {
  let context: DsgContext;
  let eventParams: CreateEntityResolverBaseParams;

  beforeEach(() => {
    context = mock<DsgContext>();
    eventParams = mock<CreateEntityResolverBaseParams>({
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
      resolverBaseId: builders.identifier("UserResolverBase"),
    });
  });

  it("should add all the necessary methods", async () => {
    eventParams.template = await readFile(
      join(__dirname, "./fixtures/resolver.base.template.ts"),
    );
    eventParams.templateMapping = {
      RESOLVER_BASE: builders.identifier("UserResolverBase"),
    };

    const { template } = await beforeCreateEntityResolverBase(
      context,
      eventParams,
    );
    expect(print(template).code).toMatchSnapshot();
  });
});
