import { ModuleMap } from "@amplication/code-gen-types"
import { parse, print } from "@amplication/code-gen-utils";
import { namedTypes, NodePath, visit, builders } from "ast-types";
import { SUPERTOKENS_ID_FIELD_NAME } from "../constants";


export const alterSeedCode = (
    scriptsDirectory: string,
    modules: ModuleMap
) => {
    const seedModule = modules.get(`${scriptsDirectory}/seed.ts`);
    if(!seedModule) {
        throw new Error("Failed to find the seed.ts script");
    }
    let foundUpsertCall = false;
    let completedChange = false;
    const module = parse(seedModule.code);
    visit(module, {
        visitCallExpression: function(path) {
            if(path.node.callee.type !== "MemberExpression"
                || path.node.callee.property.type !== "Identifier"
                || path.node.callee.property.name !== "upsert") {
                    return false;
                }
            foundUpsertCall = true;
            const args = path.node.arguments;
            if(args.length !== 1 || args[0].type !== "ObjectExpression") {
                return false;
            }
            let whereProp = args[0].properties.find((prop) => (
                prop.type === "ObjectProperty"
                && prop.key.type === "Identifier"
                && prop.key.name === "where"
            ));
            if(!whereProp) {
                return false;
            }
            whereProp = whereProp as namedTypes.ObjectProperty;
            if(whereProp.value.type !== "ObjectExpression") {
                return false;
            }
            whereProp.value.properties.forEach((prop) => {
                if(prop.type !== "ObjectProperty" || prop.key.type !== "Identifier"
                    || prop.key.name !== "username") {
                        return;
                }
                prop.key.name = SUPERTOKENS_ID_FIELD_NAME;
                prop.value = builders.memberExpression(
                    builders.identifier("data"),
                    builders.identifier(SUPERTOKENS_ID_FIELD_NAME)
                );
                completedChange = true;
            });
            return false;
        },
    });
    if(!foundUpsertCall) {
        throw new Error("Failed to find the upsert call in the seed.ts script");
    }
    if(!completedChange) {
        throw new Error("Failed to alter the seed code");
    }
    modules.replace(seedModule, {
        path: seedModule.path,
        code: print(module).code
    });
}
