import {
  dotnetPluginEventsTypes,
  dotnetPluginEventsParams as dotnet,
  dotnetTypes,
} from "@amplication/code-gen-types";
import { ClassReference, CodeBlock } from "@amplication/csharp-ast";
import {
  updateDockerComposeDevProperties,
  updateDockerComposeProperties,
} from "./constants";
import { getPluginSettings } from "./utils";
import { pascalCase } from "pascal-case";

const CONNECTION_STRING = "DefaultConnection";

class MSSQLServerPlugin implements dotnetTypes.AmplicationPlugin {
  register(): dotnetPluginEventsTypes.DotnetEvents {
    return {
      CreateServerDockerCompose: {
        before: this.beforeCreateServerDockerCompose,
      },
      CreateServerDockerComposeDev: {
        before: this.beforeCreateServerDockerComposeDev,
      },
      CreateServerCsproj: {
        before: this.beforeCreateServerCsproj,
      },
      CreateServerAppsettings: {
        before: this.beforeCreateServerAppsettings,
      },
      CreateProgramFile: {
        before: this.beforeCreateProgramFile,
      },
    };
  }

  beforeCreateServerDockerCompose(
    _: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateServerDockerComposeParams
  ) {
    eventParams.updateProperties.push(...updateDockerComposeProperties);
    return eventParams;
  }

  beforeCreateServerDockerComposeDev(
    _: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateServerDockerComposeDevParams
  ) {
    eventParams.updateProperties.push(...updateDockerComposeDevProperties);
    return eventParams;
  }

  beforeCreateServerCsproj(
    _: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateServerCsprojParams
  ) {
    eventParams.packageReferences.push({
      include: "Microsoft.EntityFrameworkCore.SqlServer",
      version: "8.0.5",
    });

    return eventParams;
  }

  beforeCreateServerAppsettings(
    context: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateServerAppsettingsParams
  ) {
    const { port, password, user, host, dbName } = getPluginSettings(
      context.pluginInstallations
    );

    eventParams.updateProperties = {
      ...eventParams.updateProperties,
      ConnectionStrings: {
        [CONNECTION_STRING]: `sqlserver://${host}:${port};database=${dbName};user=${user};password=${password};TrustServerCertificate=true`,
      },
    };
    return eventParams;
  }

  beforeCreateProgramFile(
    { resourceInfo }: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateProgramFileParams
  ) {
    const serviceNamespace = pascalCase(resourceInfo?.name ?? "");

    eventParams.builderServicesBlocks.push(
      new CodeBlock({
        code: `builder.services.AddDbContext<DbContext>(opt => opt.UseSqlServer(builder.Configuration.GetConnectionString("${CONNECTION_STRING}")));`,
        references: [
          new ClassReference({
            name: "AddDbContext",
            namespace: "Microsoft.EntityFrameworkCore",
          }),
          new ClassReference({
            name: "DbContext",
            namespace: `${serviceNamespace}.Infrastructure`,
          }),
        ],
      })
    );

    return eventParams;
  }
}

export default MSSQLServerPlugin;
