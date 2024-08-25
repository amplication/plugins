import { CodeBlock, CsharpSupport,ProgramClass } from "@amplication/csharp-ast";

export function createBuildersServices(
  resourceName: string,
  programClass: ProgramClass
): void {
  programClass.builderServicesBlocks.push(
    new CodeBlock({
      code: `builder.Services.AddApiAuthentication();`,
    })
  );

  const swaggerBuilderIndex = programClass.builderServicesBlocks.findIndex((b) =>
    b.toString().includes("AddSwaggerGen")
  );

  if (swaggerBuilderIndex === -1) return;

  programClass.builderServicesBlocks[swaggerBuilderIndex] = new CodeBlock({
    references: [
      CsharpSupport.classReference({
        namespace: `${resourceName}.APIs`,
        name: resourceName,
      }),
    ],
    code: `builder.Services.AddSwaggerGen(options =>
  {
      options.UseOpenApiAuthentication();
      var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
      options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFilename));
  });`,
  });
}
