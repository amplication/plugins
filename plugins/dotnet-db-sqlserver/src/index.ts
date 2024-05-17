import {
  dotnetPluginEventsTypes,
  dotnetPluginEventsParams as dotnet,
  dotnetTypes,
} from "@amplication/code-gen-types";
import {
  updateDockerComposeDevProperties,
  updateDockerComposeProperties,
} from "./constants";

class MSSQLServerPlugin implements dotnetTypes.AmplicationPlugin {
  register(): dotnetPluginEventsTypes.DotnetEvents {
    return {
      CreateServerDockerCompose: {
        before: this.beforeCreateServerDockerCompose,
      },
      CreateServerDockerComposeDev: {
        before: this.beforeCreateServerDockerComposeDev,
      },
    };
  }

  beforeCreateServerDockerCompose(
    context: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateServerDockerComposeParams
  ) {
    eventParams.updateProperties.push(...updateDockerComposeProperties);
    return eventParams;
  }

  beforeCreateServerDockerComposeDev(
    context: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateServerDockerComposeDevParams
  ) {
    eventParams.updateProperties.push(...updateDockerComposeDevProperties);
    return eventParams;
  }
}

export default MSSQLServerPlugin;
