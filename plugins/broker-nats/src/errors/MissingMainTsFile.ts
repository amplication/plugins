export class MissingMainTsFileError extends Error {
  constructor() {
    super("Missing main.ts file");
    this.name = "MissingMainTsFileError";
  }
}
