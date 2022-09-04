import * as recast from "recast";
import { ParserOptions } from "@babel/parser";
import { ASTNode, namedTypes } from "ast-types";
import * as K from "ast-types/gen/kinds";
import { NodePath } from "ast-types/lib/node-path";
import { NamedClassProperty } from "@amplication/code-gen-types";
declare type ParseOptions = Omit<recast.Options, "parser">;
declare type PartialParseOptions = Omit<ParserOptions, "tolerant">;
export declare class ParseError extends SyntaxError {
    constructor(message: string, source: string);
}
export declare function parse(source: string, options?: ParseOptions): namedTypes.File;
export declare function partialParse(source: string, options?: PartialParseOptions): namedTypes.File;
export declare function extractImportDeclarations(file: namedTypes.File): namedTypes.ImportDeclaration[];
export declare function getExportedNames(code: string): Array<namedTypes.Identifier | namedTypes.JSXIdentifier | namedTypes.TSTypeParameter>;
export declare function interpolate(ast: ASTNode, mapping: {
    [key: string]: ASTNode | undefined;
}): void;
export declare function evaluateJSX(path: NodePath, mapping: {
    [key: string]: ASTNode | undefined;
}): void;
export declare function transformTemplateLiteralToStringLiteral(templateLiteral: namedTypes.TemplateLiteral): namedTypes.StringLiteral;
export declare function removeTSIgnoreComments(ast: ASTNode): void;
export declare function removeImportsTSIgnoreComments(file: namedTypes.File): void;
export declare function removeTSVariableDeclares(ast: ASTNode): void;
export declare function removeTSClassDeclares(ast: ASTNode): void;
export declare function removeTSInterfaceDeclares(ast: ASTNode): void;
export declare function removeESLintComments(ast: ASTNode): void;
export declare function addAutoGenerationComment(file: namedTypes.File): void;
export declare function importNames(names: namedTypes.Identifier[], source: string): namedTypes.ImportDeclaration;
export declare function addImports(file: namedTypes.File, imports: namedTypes.ImportDeclaration[]): void;
export declare function exportNames(names: namedTypes.Identifier[]): namedTypes.ExportNamedDeclaration;
export declare function classDeclaration(id: K.IdentifierKind | null, body: K.ClassBodyKind, superClass?: K.ExpressionKind | null, decorators?: namedTypes.Decorator[]): namedTypes.ClassDeclaration;
export declare function classProperty(key: namedTypes.Identifier, typeAnnotation: namedTypes.TSTypeAnnotation, definitive?: boolean, optional?: boolean, defaultValue?: namedTypes.Expression | null, decorators?: namedTypes.Decorator[]): namedTypes.ClassProperty;
export declare function findContainedIdentifiers(node: ASTNode, identifiers: Iterable<namedTypes.Identifier>): namedTypes.Identifier[];
export declare function getClassDeclarationById(node: ASTNode, id: namedTypes.Identifier): namedTypes.ClassDeclaration;
export declare function deleteClassMemberByKey(declaration: namedTypes.ClassDeclaration, id: namedTypes.Identifier): void;
export declare function importContainedIdentifiers(node: ASTNode, moduleToIdentifiers: Record<string, namedTypes.Identifier[]>): namedTypes.ImportDeclaration[];
export declare function isConstructor(method: namedTypes.ClassMethod): boolean;
export declare function findConstructor(classDeclaration: namedTypes.ClassDeclaration): namedTypes.ClassMethod | undefined;
export declare function addIdentifierToConstructorSuperCall(ast: ASTNode, identifier: namedTypes.Identifier): void;
export declare function getMethods(classDeclaration: namedTypes.ClassDeclaration): namedTypes.ClassMethod[];
export declare function getClassMethodById(classDeclaration: namedTypes.ClassDeclaration, methodId: namedTypes.Identifier): namedTypes.ClassMethod | null;
export declare function getNamedProperties(declaration: namedTypes.ClassDeclaration): NamedClassProperty[];
export declare const importDeclaration: (strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>) => recast.types.namedTypes.ImportDeclaration;
export declare const callExpression: (strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>) => recast.types.namedTypes.CallExpression;
export declare const memberExpression: (strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>) => recast.types.namedTypes.MemberExpression;
export declare const awaitExpression: (strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>) => recast.types.namedTypes.AwaitExpression;
export declare const logicalExpression: (strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>) => recast.types.namedTypes.LogicalExpression;
export declare const expressionStatement: (strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>) => recast.types.namedTypes.ExpressionStatement;
export declare function typedExpression<T>(type: {
    check(v: any): v is T;
}): (strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>) => T;
export declare function typedStatement<T>(type: {
    check(v: any): v is T;
}): (strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>) => T;
export declare function expression(strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>): namedTypes.Expression;
export declare function statement(strings: TemplateStringsArray, ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>): namedTypes.Statement;
export declare function createGenericArray(itemType: K.TSTypeKind): namedTypes.TSTypeReference;
export declare function removeDecoratorByName(node: ASTNode, decoratorName: string): boolean;
export declare function findFirstDecoratorByName(node: ASTNode, decoratorName: string): namedTypes.Decorator;
export {};
