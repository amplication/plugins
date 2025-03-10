import { blueprintTypes, FileMap, IFile } from "@amplication/code-gen-types";
import { AstNode, CodeBlock, Writer } from "@amplication/csharp-ast";
import { execFile } from "child_process";
import { mkdir, writeFile } from "fs/promises";
import path, { dirname, join, resolve } from "path";

const execFileAsync = (command: string, args: string[], options: any) => {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      } else {
        resolve(stdout);
      }
    });
  });
};

//the function update the files in the context.files with the formatted files
export async function externalFormatting(
  context: blueprintTypes.DsgContext,
): Promise<void> {
  const { logger } = context;

  const destination = resolve(__dirname, "./temp_formatting");

  await writeFilesToDisk(context.files, destination, context);

  await logger.info(`Formatting the generated code...`);

  try {
    const executionResult: any = await execFileAsync(
      "dotnet",
      ["csharpier", "."],
      {
        cwd: destination,
      },
    );
    const formatting = executionResult.toString().trim().replace(/\n/g, "");

    formatting.startsWith("Warning")
      ? await logger.warn(formatting)
      : await logger.info(formatting);

    //read all files and return it
    const files = await readFiles(destination, context);

    // Upsert all the final modules into the context.modules
    // ModuleMap.merge is not used because it would log a warning for each module
    for (const file of files.getAll()) {
      context.files.replace(file, file);
    }
  } catch (error: any) {
    throw new Error(`Failed to run csharpier: ${JSON.stringify(error)}`);
  }
}

async function readFiles(
  destination: string,
  context: blueprintTypes.DsgContext,
): Promise<FileMap<CodeBlock>> {
  //read all files from the disk from the destination

  const fileMap = new FileMap<CodeBlock>(context.logger);

  const files = await context.utils.importStaticFilesWithReplacements(
    destination,
    "",
    {},
    {},
  );

  for (const file of files.getAll()) {
    const codeBlock: IFile<CodeBlock> = {
      path: file.path,
      code: new CodeBlock({
        code: file.code,
      }),
    };
    fileMap.set(codeBlock);
  }

  return fileMap;
}

async function writeFilesToDisk(
  files: FileMap<AstNode>,
  destination: string,
  context: blueprintTypes.DsgContext,
): Promise<void> {
  const { logger } = context;
  logger.info("Creating temp directory for formatted files...");

  await mkdir(destination, { recursive: true });
  logger.info(`Writing modules to ${destination} ...`);

  for await (const file of files.getAll()) {
    const filePath = join(destination, file.path);
    await mkdir(dirname(filePath), { recursive: true });
    const writer = new Writer({ namespace: "" });
    file.code.write(writer);
    try {
      const encoding = getFileEncoding(filePath);
      await writeFile(filePath, writer.toString(), {
        encoding: encoding,
        flag: "wx",
      });
    } catch (error: any) {
      if (error.code === "EEXIST") {
        logger.warn(`File ${filePath} already exists`);
      } else {
        logger.error(`Failed to write file ${filePath}`, { ...error });
        throw error;
      }
    }
  }

  logger.info(`Successfully wrote modules to ${destination}`);
}

export function getFileEncoding(filePath: string): BufferEncoding {
  const extension = path.extname(filePath);
  switch (extension) {
    case ".png":
    case ".ico":
    case ".jpg":
      return "base64";
    default:
      return "utf-8";
  }
}
