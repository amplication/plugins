import { CodeBlock, CsharpSupport } from "@amplication/csharp-ast";

export function createBuildersServices(
  resourceName: string,
  builderServicesBlocks: CodeBlock[]
): void {
  builderServicesBlocks.push(
    new CodeBlock({
      code: `builder.Services.AddApiAuthentication();`,
    })
  );

  const swaggerBuilderIndex = builderServicesBlocks.findIndex((b) =>
    b.toString().includes("AddSwaggerGen")
  );

  if (swaggerBuilderIndex === -1) return;

  builderServicesBlocks[swaggerBuilderIndex] = new CodeBlock({
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
