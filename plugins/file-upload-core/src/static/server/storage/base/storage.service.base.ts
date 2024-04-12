import { FileDownload, FileExtensionEnum, FileUpload, StorageFileBase } from "./storage.types";
import { BadRequestException } from "@nestjs/common";
import { lookup } from 'mime-types'
import { minimatch } from 'minimatch'

export abstract class StorageServiceBase {
  protected async verifyFile(file: FileUpload, mimetypes: string[], maxSize?: number): Promise<void> {
    if (!file) {
      throw new Error('No file provided');
    }

    if (mimetypes.length > 0 && !mimetypes.some((pattern) => minimatch(file.mimetype, pattern))) {
      throw new Error('Invalid file type');
    }

    if (maxSize) {
      const size = await this.checkFileSize(file, maxSize);
      if (size > maxSize) {
        throw new Error('File size too large');
      }

      file.size = size;
    }
  }

  protected async checkFileSize(file: FileUpload, maxSize: number): Promise<number> {
    if (file.size && file.size > maxSize) {
      throw new BadRequestException('File size too large');
    } else if (file.size) {
      return file.size;
    }

    let stream: NodeJS.ReadStream;
    let size = 0;

    if (file.createReadStream) {
      stream = file.createReadStream();
    } else {
      throw new Error('Neither createReadStream nor buffer provided');
    }

    await new Promise((resolve, reject) => {
      stream
        .on('data', (chunk) => {
          size += chunk.length;
          if (size > maxSize) {
            stream.destroy();
            reject(new Error('File size too large'));
          }
        })
        .on('end', () => {
          resolve(size);
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    return size;
  }

  protected getMimeType(file: StorageFileBase) {
    if (file.mimetype) {
      return file.mimetype;
    } else if (file.filename) {
      const extension = file.filename.split('.').pop();
      if (extension) {
        // get mimetype from extension
        return lookup(extension);
      }
    } else {
      throw new Error('No mimetype or filename provided');
    }

    return 'application/octet-stream';
  }

  abstract uploadFile<T extends StorageFileBase>(file: FileUpload, extensions: (FileExtensionEnum | string)[], maxSize?: number): Promise<T>;
  abstract downloadFile<T extends StorageFileBase>(file: T): Promise<FileDownload>;
  abstract deleteFile<T extends StorageFileBase>(file: T): Promise<boolean>;
}