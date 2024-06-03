import { CodeBlock } from "@amplication/csharp-ast";

export function createAppServices(builderServicesBlocks: CodeBlock[]): void {
  builderServicesBlocks.push(
    new CodeBlock({
      code: `using (var scope = app.Services.CreateScope())
  {
      var services = scope.ServiceProvider;
      await RolesManager.SyncRoles(services, app.Configuration);
  }`,
    })
  );

  builderServicesBlocks.push(
    new CodeBlock({
      code: `
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        await SeedDevelopmentData.SeedDevUser(services, app.Configuration);
    }`,
    })
  );
}
