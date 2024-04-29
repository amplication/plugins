import { StorageFileBase } from "src/storage/base/storage.types";

export interface LocalStorageFile extends StorageFileBase {
  metadata?: {
    size?: number;
    directory?: string;
  }
}