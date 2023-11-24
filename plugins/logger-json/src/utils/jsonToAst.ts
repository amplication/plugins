import { AdditionalProperties } from "src/types"
import { ASTNode, builders as b, namedTypes as n } from "ast-types"

export const propertiesToAST = (items: AdditionalProperties): ASTNode => {
    return b.variableDeclaration("const", [
        b.variableDeclarator(
            b.identifier("ADDITIONAL_LOG_PROPERTIES"),
            b.objectExpression(jsonToAST(items))
        )
    ])
}

export const jsonToAST = (items: AdditionalProperties): n.ObjectProperty[] => {
    const parsed: n.ObjectProperty[] = []

    for(const [key, value] of Object.entries(items)) {
        parsed.push(b.objectProperty(b.literal(key), b.literal(value)))
    }

    return parsed
}