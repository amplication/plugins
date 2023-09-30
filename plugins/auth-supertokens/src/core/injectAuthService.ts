import { appendImports } from "@amplication/code-gen-utils";
import { builders, namedTypes } from "ast-types";
import { visit } from "recast";

export const injectAuthService = (
    template: namedTypes.File,
    directoriesBackToSrc: number
) => {
    appendImports(template, [authServiceImport(directoriesBackToSrc)]);
    visit(template, {
        visitClassMethod: function(path) {
            const method = path.node;
            if(method.key.type !== "Identifier" || method.key.name !== "constructor") {
                return false;
            }
            const authServiceParam = builders.tsParameterProperty(builders.identifier("authService"));
            authServiceParam.readonly = true;
            authServiceParam.accessibility = "protected";
            //@ts-ignore
            authServiceParam.parameter.typeAnnotation = builders.tsTypeAnnotation(
                builders.tsTypeReference(builders.identifier("AuthService"))
            );
            method.params.push(authServiceParam);
            this.traverse(path);
        },
        visitCallExpression: function(path) {
            const call = path.node;
            if(call.callee.type !== "Super") {
                return false;
            }
            call.arguments.push(builders.identifier("authService"));
            return false;
        }
    })
}

const authServiceImport = (
    directoriesBackToSrc: number
): namedTypes.ImportDeclaration => {
    let path = "";
    for(let i=0; i<directoriesBackToSrc; i++) {
        path += "../";
    }
    path += "auth/auth.service";
    return builders.importDeclaration([
        builders.importSpecifier(builders.identifier("AuthService"))
    ], builders.stringLiteral(path));
}
