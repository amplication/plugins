import { StreamableFile } from "@nestjs/common";

export interface StorageFileBase {
  uuid: string;                   // UUID for the file (can be used to retrieve the file eg. URL or file path)
  filename: string;
  mimetype: string;
  encoding: string;
  size?: number;                  // File size in bytes
  metadata?: Record<string, any>; // Provider specific metadata

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface FileUpload {
  filename: string;
  mimetype: string;
  encoding: string;
  size?: number;
  createReadStream?: () => NodeJS.ReadStream;
  buffer?: Buffer;
}

export interface FileDownload { 
  stream: StreamableFile; 
  mimetype: string; 
  filename: string;
}

export enum FileExtensionEnum {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FONT = 'font',
  MODEL = 'model',
  PLAINTXT = 'text/plain',
  CSV = 'text/csv',
  CSS = 'text/css',
  HTML = 'text/html',
  PDF = 'application/pdf',
  ZIP = 'application/zip',
  JSON = 'application/json',
  XML = 'application/xml',
  DOC = 'application/msword',
}