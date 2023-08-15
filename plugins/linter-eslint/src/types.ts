export interface Settings {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rules: any;
  formatter: "prettier" | null | undefined;
}

export interface PackageJsonValues {
  scripts: {
    [key: string]: string;
  };
  devDependencies: {
    [key: string]: string;
  };
}