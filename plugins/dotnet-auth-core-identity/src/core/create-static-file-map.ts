import { ClassReference, CodeBlock } from "@amplication/csharp-ast";
import { FileMap, IFile, dotnetTypes } from "@amplication/code-gen-types";
import { readFile } from "fs/promises";
import { pascalCase } from "pascal-case";

export async function createStaticFileFileMap(
  destPath: string,
  filePath: string,
  context: dotnetTypes.DsgContext,
  classReferences?: ClassReference[]
): Promise<FileMap<CodeBlock>> {
  const fileMap = new FileMap<CodeBlock>(context.logger);

  if (!context.resourceInfo) return fileMap;
  const resourceName = pascalCase(context.resourceInfo.name);
  let fileContent = await readFile(filePath, "utf-8");
  fileContent = fileContent.replaceAll("ServiceName", resourceName);

  const file: IFile<CodeBlock> = {
    path: destPath,
    code: new CodeBlock({
      code: fileContent,
      references: classReferences && classReferences,
    }),
  };

  fileMap.set(file);
  return fileMap;
}
