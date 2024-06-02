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

  const swaggerBuilder = builderServicesBlocks.find((builder) =>
    builder.toString().includes("AddSwaggerGen")
  );
  if (!swaggerBuilder) return;

  const swaggerBuilderIndex = builderServicesBlocks.indexOf(swaggerBuilder);

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
