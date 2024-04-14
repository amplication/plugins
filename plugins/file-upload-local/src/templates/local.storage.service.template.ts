import { FileDownload, FileUpload } from "../../base/storage.types";
import { LocalStorageFile } from "./local.storage.types";
import {
  BadRequestException,
  Injectable,
  StreamableFile,
} from "@nestjs/common";
import {
  createReadStream,
  mkdirSync,
  createWriteStream,
  writeFile,
  unlink,
} from "fs";
import { join } from "path";
import { StorageServiceBase } from "src/storage/base/storage.service.base";

@Injectable()
export class LocalStorageService extends StorageServiceBase {
  private readonly basePath: string;

  constructor() {
    super();
    this.basePath = BASE_PATH;
  }

  async uploadFile<LocalStorageFile>(
    file: FileUpload,
    extensions: string[],
    maxSize?: number,
    containerPath?: string,
  ): Promise<LocalStorageFile> {
    try {
      await this.verifyFile(file, extensions, maxSize);
      const { createReadStream, filename, buffer } = file;
      const path = `./${this.basePath}/${
        containerPath ? `${containerPath}/` : ""
      }${filename}`;

      //if directory does not exist, create it
      mkdirSync(`./${this.basePath}`, { recursive: true });

      const uploadFile = {
        filename,
        uuid: path,
        mimetype: file.mimetype,
        encoding: file.encoding,
        metadata: {
          size: file.size,
          directory: this.basePath,
        },
      } as LocalStorageFile;

      if (createReadStream) {
        await new Promise((resolve, reject) =>
          createReadStream()
            .pipe(createWriteStream(path))
            .on("finish", resolve)
            .on("error", reject),
        );
      } else if (buffer) {
        await new Promise((resolve, reject) =>
          writeFile(path, buffer, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(true);
            }
          }),
        );
      } else {
        throw new Error("Neither createReadStream nor buffer provided");
      }

      return uploadFile;
    } catch (error: unknown) {
      throw new BadRequestException((error as Error).message, { cause: error });
    }
  }

  async downloadFile(file: LocalStorageFile): Promise<FileDownload> {
    const path = file.uuid;
    const stream = createReadStream(join(process.cwd(), path));
    return {
      stream: new StreamableFile(stream),
      mimetype: this.getMimeType(file) || "application/octet-stream",
      filename: file.filename,
    };
  }

  async deleteFile(file: LocalStorageFile): Promise<boolean> {
    const path = file.uuid;
    return new Promise((resolve, reject) =>
      unlink(path, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      }),
    );
  }
}
