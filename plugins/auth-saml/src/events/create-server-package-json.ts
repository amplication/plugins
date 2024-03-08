import {
  DsgContext,
  CreateServerPackageJsonParams,
} from "@amplication/code-gen-types";
import { beforeCreateServerPackageJson as authCoreBeforeCreateServerPackageJson } from "@amplication/auth-core";
import { merge } from "lodash";

export function beforeCreateServerPackageJson(
  context: DsgContext,
  eventParams: CreateServerPackageJsonParams,
) {
  // add default auth-core dependencies
  eventParams = authCoreBeforeCreateServerPackageJson(context, eventParams);

  const myValues = {
    dependencies: {
      "@node-saml/passport-saml": "^4.0.4",
    },
  };

  eventParams.updateProperties.forEach((updateProperty) =>
    merge(updateProperty, myValues),
  );

  return eventParams;
}
