import * as ts from "typescript"
import { PluginInstallation } from "@amplication/code-gen-types";
import { name as PackageName } from "../package.json";
import { Settings } from "./types";
import defaultSettings from "../.amplicationrc.json";

export const getPluginSettings = (
  pluginInstallations: PluginInstallation[],
): Settings => {
  const plugin = pluginInstallations.find(
    (plugin) => plugin.npm === PackageName,
  );

  const userSettings = plugin?.settings ?? {};

  const settings: Settings = {
    ...defaultSettings,
    ...userSettings,
  };
  console.log("SETTING: ", settings)

  return settings;
};

function genEnumMembersFromArray(arr:string[]){
  return arr.map((obj:string) => {
    return ts.factory.createEnumMember(
      obj
    )
  })
}

export function genSecretsEnum(secretsName:string[]): string {
  const secretsEnumIdentifier = ts.factory.createIdentifier("Secrets")

  const secretsEnum = ts.factory.createEnumDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      secretsEnumIdentifier,
      genEnumMembersFromArray(secretsName)
  )

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  //@ts-ignore
  return printer.printList(ts.ListFormat.MultiLine, [secretsEnum])
}
