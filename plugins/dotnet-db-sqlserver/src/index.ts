import {
  dotnetPluginEventsTypes,
  dotnetPluginEventsParams as dotnet,
  dotnetTypes,
  FileMap,
} from "@amplication/code-gen-types";
import { ClassReference, CodeBlock, ProgramClass } from "@amplication/csharp-ast";
import { updateDockerComposeProperties } from "./constants";
import { getPluginSettings } from "./utils";
import { pascalCase } from "pascal-case";

const CONNECTION_STRING = "DefaultConnection";

class MSSQLServerPlugin implements dotnetTypes.AmplicationPlugin {
  register(): dotnetPluginEventsTypes.DotnetEvents {
    return {
      CreateServerDockerCompose: {
        before: this.beforeCreateServerDockerCompose,
      },
      CreateServerCsproj: {
        before: this.beforeCreateServerCsproj,
      },
      CreateServerAppsettings: {
        before: this.beforeCreateServerAppsettings,
      },
      CreateProgramFile: {
        after: this.afterCreateProgramFile,
      },
    };
  }

  beforeCreateServerDockerCompose(
    context: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateServerDockerComposeParams
  ) {
    const settings = getPluginSettings(context.pluginInstallations);

    eventParams.updateProperties.push(
      ...updateDockerComposeProperties(settings)
    );
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
        [CONNECTION_STRING]: `Data Source=${host},${port};Initial Catalog=${dbName};User Id=${user};Password=${password};TrustServerCertificate=true;`,
      },
    };
    return eventParams;
  }

  afterCreateProgramFile(
    { resourceInfo }: dotnetTypes.DsgContext,
    eventParams: dotnet.CreateProgramFileParams,
    programClass: FileMap<ProgramClass>
  ): FileMap<ProgramClass> {
    const serviceNamespace = pascalCase(resourceInfo?.name ?? "");
    const serviceDbContext = `${pascalCase(resourceInfo?.name ?? "")}DbContext`;
    const programCs = programClass.get("Program.cs");
    programCs?.code.builderServicesBlocks.push(
      new CodeBlock({
        code: `builder.Services.AddDbContext<${serviceDbContext}>(opt => opt.UseSqlServer(builder.Configuration.GetConnectionString("${CONNECTION_STRING}")));`,
        references: [
          new ClassReference({
            name: "AddDbContext",
            namespace: "Microsoft.EntityFrameworkCore",
          }),
          new ClassReference({
            name: serviceDbContext,
            namespace: `${serviceNamespace}.Infrastructure`,
          }),
        ],
      })
    );
    return programClass;

  }
}

export default MSSQLServerPlugin;
