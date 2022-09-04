"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filePathToModulePath = exports.relativeImportPath = exports.formatCode = exports.readFile = exports.readCode = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const lodash_1 = require("lodash");
const prettier = __importStar(require("prettier"));
const normalize_path_1 = __importDefault(require("normalize-path"));
const astUtil_1 = require("./astUtil");
const JSON_EXT = ".json";
exports.readCode = (0, lodash_1.memoize)((path) => {
    return fs.promises.readFile(path, "utf-8");
});
const readFile = async (path) => {
    const code = await (0, exports.readCode)(path);
    return (0, astUtil_1.parse)(code);
};
exports.readFile = readFile;
const formatCode = (code) => {
    return prettier.format(code, { parser: "typescript" });
};
exports.formatCode = formatCode;
function relativeImportPath(from, to) {
    const relativePath = path.relative(path.dirname(from), to);
    return filePathToModulePath(relativePath);
}
exports.relativeImportPath = relativeImportPath;
function filePathToModulePath(filePath) {
    const parsedPath = path.parse(filePath);
    const fixedExtPath = parsedPath.ext === JSON_EXT
        ? filePath
        : path.join(parsedPath.dir, parsedPath.name);
    const normalizedPath = (0, normalize_path_1.default)(fixedExtPath);
    return normalizedPath.startsWith("/") || normalizedPath.startsWith(".")
        ? normalizedPath
        : "./" + normalizedPath;
}
exports.filePathToModulePath = filePathToModulePath;
//# sourceMappingURL=module.js.map