"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceIndex = void 0;
const vscode = require("vscode");
const utils_1 = require("./utils");
class WorkspaceIndex {
    constructor(callback) {
        this.indexedDocs = [];
        this.indexedSymbols = {};
        this.indexing = false;
        this.onFsChangeCallback = false;
        this.onFsChangeCallback = callback;
        vscode.workspace.onDidCreateFiles(this.fsChangeHandler.bind(this));
        vscode.workspace.onDidRenameFiles(this.fsChangeHandler.bind(this));
        vscode.workspace.onDidDeleteFiles(this.fsChangeHandler.bind(this));
        vscode.workspace.onDidChangeWorkspaceFolders(this.fsChangeHandler.bind(this));
        vscode.workspace.onDidChangeTextDocument(this.fsChangeHandler.bind(this));
        this.fsChangeHandler();
    }
    async fsChangeHandler() {
        this.indexing = this.index();
        if (this.onFsChangeCallback)
            this.onFsChangeCallback(this);
    }
    async index() {
        const files = await vscode.workspace.findFiles('**/*.*', '**/node_modules/**');
        this.indexedDocs = (await Promise.all(files.map(async (file) => {
            try {
                return await vscode.workspace.openTextDocument(file);
            }
            catch (e) {
                return undefined;
            }
        }))).filter(Boolean);
        this.indexedSymbols = Object.fromEntries((await Promise.all(files.map(async (file) => {
            try {
                const mySymbols = await vscode.commands.executeCommand("vscode.executeDocumentSymbolProvider", file);
                if (Array.isArray(mySymbols)) {
                    return [(0, utils_1.normalizePath)(file.path), mySymbols];
                }
                ;
            }
            catch (e) {
                return false;
            }
            return false;
        }))).filter(e => e !== false));
    }
    async getIndex() {
        if (this.indexing)
            await this.indexing;
        return this.indexedDocs;
    }
    async getSymbols() {
        if (this.indexing)
            await this.indexing;
        return this.indexedSymbols;
    }
}
exports.WorkspaceIndex = WorkspaceIndex;
//# sourceMappingURL=index.js.map