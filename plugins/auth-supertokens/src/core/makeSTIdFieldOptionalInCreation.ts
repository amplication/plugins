import { NamedClassDeclaration } from "@amplication/code-gen-types";
import { builders, namedTypes, NodePath } from "ast-types";
import { SUPERTOKENS_ID_FIELD_NAME } from "../constants";
import { visit } from "recast";

export const makeSTIdFieldOptionalInCreation = (createInput: NamedClassDeclaration) => {
    let foundSTIdProp = false;
    visit(createInput, {
        visitClassProperty: function(path) {
            if(path.node.key.type !== "Identifier"
                || path.node.key.name !== SUPERTOKENS_ID_FIELD_NAME) {
                    return false;
            }
            foundSTIdProp = true;
            //@ts-ignore
            path.node.optional = true;
            //@ts-ignore
            const decorators = path.node.decorators;
            decorators.push(isOptionalDec());
            let apiPropDecorator;
            for(const d of decorators) {
                const decorator = d as namedTypes.Decorator;
                if(decorator.expression.type !== "CallExpression"
                    || decorator.expression.callee.type !== "Identifier"
                    || decorator.expression.callee.name !== "ApiProperty"
                    || decorator.expression.arguments.length !== 1
                    || decorator.expression.arguments[0].type !== "ObjectExpression") {
                        continue;
                    }
                apiPropDecorator = decorator;
            }
            if(!apiPropDecorator) {
                return false;
            }
            this.traverse(new NodePath(apiPropDecorator, path, "callExpression"));
        },
        visitCallExpression: function(path) {
            const obj = path.node.arguments[0];
            if(obj.type !== "ObjectExpression") {
                return false;
            }
            for(const prop of obj.properties) {
                if(prop.type === "ObjectProperty"
                    && prop.key.type === "Identifier"
                    && prop.key.name === "required") {
                        prop.value = builders.booleanLiteral(false);
                    }
            }
            return false;
        }
    });
    if(!foundSTIdProp) {
        throw new Error(`Failed to find the ${SUPERTOKENS_ID_FIELD_NAME} field in the auth entity's createInput DTO`);
    }
}

const isOptionalDec = (): namedTypes.Decorator => {
    return builders.decorator(builders.callExpression(
        builders.identifier("IsOptional"),
        []
    ))
}
