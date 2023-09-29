import { NamedClassDeclaration } from "@amplication/code-gen-types";
import { builders, namedTypes } from "ast-types";
import { SUPERTOKENS_ID_FIELD_NAME } from "../constants";

export const makeSTIdFieldOptionalInCreation = (createInput: NamedClassDeclaration) => {
    for(const stmt of createInput.body.body) {
        if(stmt.type !== "ClassProperty") {
            continue;
        }
        const prop = stmt as namedTypes.ClassProperty;
        if(prop.key.type !== "Identifier" || prop.key.name !== SUPERTOKENS_ID_FIELD_NAME) {
            continue;
        }
        //@ts-ignore
        prop.optional = true;
        //@ts-ignore
        for(const d of prop.decorators) {
            const decorator = d as namedTypes.Decorator;
            if(decorator.expression.type !== "CallExpression") {
                continue;
            }
            const callExpr = decorator.expression as namedTypes.CallExpression;
            if(callExpr.callee.type !== "Identifier" || callExpr.callee.name !== "ApiProperty") {
                continue;
            }
            for(const argument of callExpr.arguments) {
                if(argument.type !== "ObjectExpression") {
                    continue;
                }
                const apiPropObj = argument as namedTypes.ObjectExpression;
                const containsRequiredKey = apiPropObj.properties.filter((prop) => (
                    prop.type === "ObjectProperty"
                    && prop.key.type === "Identifier"
                    && prop.key.name === "required"
                ));
                if(containsRequiredKey.length !== 1) {
                    continue;
                }
                const requiredProp = containsRequiredKey[0] as namedTypes.ObjectProperty;
                requiredProp.value = builders.booleanLiteral(false);
                return;
            }
        }
    }
    throw new Error(`Failed to find the ${SUPERTOKENS_ID_FIELD_NAME} field in the auth entity's createInput DTO`);

}
