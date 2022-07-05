"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePath = void 0;
const vscode = require("vscode");
const normalizePath = (path) => path.replace(vscode.workspace.workspaceFolders?.[0].uri.path + '/', '');
exports.normalizePath = normalizePath;
//# sourceMappingURL=utils.js.map