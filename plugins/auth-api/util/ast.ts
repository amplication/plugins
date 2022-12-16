import { namedTypes, ASTNode } from "ast-types";
import * as recast from "recast";
import * as parser from "./parser";

const TS_IGNORE_TEXT = "@ts-ignore";

export type ParseOptions = Omit<recast.Options, "parser">;
declare var SyntaxError: SyntaxErrorConstructor;

export class ParseError extends SyntaxError {
    constructor(message: string, source: string) {
      super(`${message}\nSource:\n${source}`);
    }
  }
  

 export function parse(source: string, options?: ParseOptions): namedTypes.File {
    try {
      return recast.parse(source, {
        ...options,
        parser,
      });
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ParseError(error.message, source);
      }
      throw error;
    }
  };

  export function removeTSIgnoreComments(ast: ASTNode): void {
    recast.visit(ast, {
      visitComment(path) {
        if (path.value.value.includes(TS_IGNORE_TEXT)) {
          path.prune();
        }
        this.traverse(path);
      },
    });
  }