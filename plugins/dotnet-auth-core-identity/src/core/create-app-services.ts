import { CodeBlock, ProgramClass } from "@amplication/csharp-ast";

export function createAppServices(programClass: ProgramClass): void {
  programClass.appBlocks.push(
    new CodeBlock({
      code: `app.UseApiAuthentication();`,
    })
  );

  programClass.appBlocks.push(
    new CodeBlock({
      code: `using (var scope = app.Services.CreateScope())
  {
      var services = scope.ServiceProvider;
      await RolesManager.SyncRoles(services, app.Configuration);
  }`,
    })
  );

  programClass.appBlocks.push(
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
