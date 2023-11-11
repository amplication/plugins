import * as ts from "typescript";

const secretsEnumIdentifier = ts.factory.createIdentifier("Secrets");

function genEnumMember(key: string, value: string): ts.EnumMember {
  return ts.factory.createEnumMember(
    key,
    ts.factory.createStringLiteral(value),
  );
}

function genEnumMembersFromRecord(
  secretsName: Record<string, string>,
): ts.EnumMember[] {
  return Object.entries(secretsName).map(([key, value]) => {
    return genEnumMember(key, value);
  });
}

export function genSecretsEnum(secretsName: Record<string, string>): string {
  const secretsEnum = ts.factory.createEnumDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    secretsEnumIdentifier,
    genEnumMembersFromRecord(secretsName),
  );

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  //@ts-ignore
  return printer.printList(ts.ListFormat.MultiLine, [secretsEnum]);
}
