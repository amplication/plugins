"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultGuard = void 0;
const ast_types_1 = require("ast-types");
const recast_1 = require("recast");
const astUtil_1 = require("./astUtil");
const module_1 = require("./module");
async function createDefaultGuard(srcDir) {
    const authDir = `${srcDir}/auth`;
    const defaultAuthGuardPath = require.resolve("../static/guard/defaultAuth.guard.template.ts");
    const modulePath = `${authDir}/defaultAuth.guard.ts`;
    const templateGuardFile = await (0, module_1.readFile)(defaultAuthGuardPath);
    const className = "JwtAuthGuard";
    const path = `${authDir}/jwt/jwtAuth.guard.ts`;
    const baseGuardIdentifier = ast_types_1.builders.identifier(className);
    (0, astUtil_1.interpolate)(templateGuardFile, {
        GUARD: baseGuardIdentifier,
    });
    const baseGuardImport = (0, astUtil_1.importNames)([baseGuardIdentifier], (0, module_1.relativeImportPath)(modulePath, path));
    (0, astUtil_1.addImports)(templateGuardFile, [baseGuardImport]);
    (0, astUtil_1.removeTSClassDeclares)(templateGuardFile);
    return { path: modulePath, code: (0, recast_1.print)(templateGuardFile).code };
}
exports.createDefaultGuard = createDefaultGuard;
//# sourceMappingURL=createDefaultGuard.js.map