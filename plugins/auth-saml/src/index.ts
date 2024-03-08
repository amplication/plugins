import {
  AmplicationPlugin,
  EventNames,
  Events,
} from "@amplication/code-gen-types";
import { merge } from "lodash";
import { AuthCorePlugin } from "@amplication/auth-core";
import {
  afterCreateAdminApp,
  afterCreateServerAuth,
  beforeCreateAdminAppModule,
  beforeCreateDockerComposeFile,
  beforeCreateSecretsManager,
  beforeCreateServer,
  beforeCreateServerAuth,
  beforeCreateServerDotEnv,
  beforeCreateServerPackageJson,
} from "./events";

class SamlAuthPlugin extends AuthCorePlugin implements AmplicationPlugin {
  constructor() {
    super(new Set([EventNames.CreateSeed]));
  }

  register(): Events {
    return merge(super.register(), {
      CreateServer: {
        before: beforeCreateServer,
      },
      CreateAdminUI: {
        after: afterCreateAdminApp,
      },
      CreateServerAuth: {
        before: beforeCreateServerAuth,
        after: afterCreateServerAuth,
      },
      CreateServerDockerCompose: {
        before: beforeCreateDockerComposeFile,
      },
      CreateServerSecretsManager: {
        before: beforeCreateSecretsManager,
      },
      CreateServerPackageJson: {
        before: beforeCreateServerPackageJson,
      },
      CreateServerDotEnv: {
        before: beforeCreateServerDotEnv,
      },
      CreateAdminAppModule: {
        before: beforeCreateAdminAppModule,
      },
    });
  }
}

export default SamlAuthPlugin;
