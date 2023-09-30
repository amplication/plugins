import { ModuleMap } from "@amplication/code-gen-types";
import { parse, print } from "@amplication/code-gen-utils";
import { namedTypes } from "ast-types";
import { join } from "path";

export const removeRemoveDefaultCorsSettingInMain = (srcDir: string, modules: ModuleMap) => {
    const mainModule = modules.get(join(srcDir, "main.ts"));
    if(!mainModule) {
        throw new Error("Failed to find the main.ts module")
    }
    const mainCode = parse(mainModule.code);
   const mainFunc = getMainFunc(mainCode, srcDir);
    const variableDeclarations = mainFunc.body.body.filter((stmt) => (
        stmt.type === "VariableDeclaration"
        && stmt.declarations
    ));
    if(!variableDeclarations) {
        throw new Error(`Expected to find variable declarations in the ${srcDir}/main.ts main function`);
    }
    for(const s of variableDeclarations) {
        const stmt = s as namedTypes.VariableDeclaration;
        for(const d of stmt.declarations) {
            const initCall = getNestFactoryCallExpr(d);
            if(!initCall) {
                continue;
            }
            initCall.arguments = initCall.arguments.slice(0, -1);
            modules.replace(mainModule, {
                path: mainModule.path,
                code: print(mainCode).code
            })
            return;
        }
    }
    throw new Error(`Failed to find the NestFactory app instantiation in the ${srcDir}/main.ts main function`);
}

const getMainFunc = (mainCode: namedTypes.File, srcDir: string): namedTypes.FunctionDeclaration => {
    const containsMainFunc = mainCode.program.body.filter((stmt) => (
        stmt.type === "FunctionDeclaration"
        && stmt.id?.name === "main"
    ));
    if(containsMainFunc.length !== 1) {
        throw new Error(`Expected a single main function in the ${srcDir}/main.ts file`);
    }
    return containsMainFunc[0] as namedTypes.FunctionDeclaration;
}

const getNestFactoryCallExpr = (d: any): namedTypes.CallExpression | null => {
    if(!d.type || d.type !== "VariableDeclarator") {
        return null;
    }
    const declarator = d as namedTypes.VariableDeclarator;
    //@ts-ignore
    if(declarator.id.name !== "app" || !declarator.init
        || declarator.init.type !== "AwaitExpression") {
        return null;
    }
    const awaitExpr = declarator.init as namedTypes.AwaitExpression;
    if(awaitExpr.argument?.type !== "CallExpression") {
        return null;
    }
    const initCall = awaitExpr.argument as namedTypes.CallExpression;
    if(initCall.callee.type !== "MemberExpression") {
        return null;
    }
    const memExpr = initCall.callee as namedTypes.MemberExpression;
    if(memExpr.object.type !== "Identifier" 
        || memExpr.object.name !== "NestFactory"
        || memExpr.property.type !== "Identifier"
        || memExpr.property.name !== "create") {
        return null;
    }
    return initCall;
}
