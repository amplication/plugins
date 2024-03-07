import { DsgContext } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import { beforeCreateServerPackageJson } from "../index";

describe("Testing beforeServerPackageJson hook", () => {
  let context: DsgContext;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
  });
  it("should add the necessary dependencies the server package.json file", () => {
    const { updateProperties } = beforeCreateServerPackageJson(context, {
      fileContent: "",
      updateProperties: [
        {
          dependencies: {
            aDependency: "^1.0.0",
          },
          devDependencies: {
            aDevDependency: "2.3.4",
          },
        },
      ],
    });
    expect(updateProperties).toStrictEqual([
      {
        dependencies: {
          "@nestjs/jwt": "^10.1.1",
          "@nestjs/passport": "^10.0.2",
          "nest-access-control": "^3.1.0",
          aDependency: "^1.0.0",
          passport: "0.6.0",
          "passport-http": "0.3.0",
          "passport-jwt": "4.0.1",
        },
        devDependencies: {
          "@types/passport-http": "0.3.9",
          "@types/passport-jwt": "3.0.10",
          aDevDependency: "2.3.4",
        },
      },
    ]);
  });
});
