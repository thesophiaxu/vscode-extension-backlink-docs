"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodelensProvider = void 0;
const vscode = require("vscode");
const utils_1 = require("./utils");
/**
 * CodelensProvider
 */
class CodelensProvider {
    constructor(indexer) {
        this.codeLenses = [];
        this.regex = /\[\[([^[\]]*)\]\]/g;
        this.indexer = indexer;
    }
    /**
     * Scans
     * @param document
     * @param token
     * @returns
     */
    async provideCodeLenses(document, token) {
        const docs = await this.indexer.getIndex();
        const findInDoc = (document, thing) => {
            let n = 0;
            for (let i = 0; i < document.lineCount; ++i) {
                const line = document.lineAt(i).text;
                if (line.includes(thing))
                    n++;
            }
            ;
            return n;
        };
        const file = document.uri;
        const mySymbols = await vscode.commands.executeCommand("vscode.executeDocumentSymbolProvider", file);
        const relativePath = (0, utils_1.normalizePath)(document.uri.path);
        this.codeLenses = [];
        await Promise.all(mySymbols?.map(async (el) => {
            const repr = `[[${relativePath}#${el.name}]]`;
            let hasBacklinks = docs.map(el => findInDoc(el, repr)).reduce((prev, curr) => prev + curr, 0);
            if (hasBacklinks)
                this.codeLenses.push(new vscode.CodeLens(el.location.range, {
                    title: `${hasBacklinks} backlinks`,
                    tooltip: "Reveal backlinks",
                    command: "workbench.action.findInFiles",
                    arguments: [{
                            query: repr,
                            isRegex: false,
                            triggerSearch: true,
                        }],
                }));
        }) || []);
        const hasDocBacklinks = docs.map(el => findInDoc(el, `[[${relativePath}]]`)).reduce((prev, curr) => prev + curr, 0)
            + docs.map(el => findInDoc(el, `[[${relativePath}#`)).reduce((prev, curr) => prev + curr, 0);
        if (hasDocBacklinks)
            this.codeLenses.push(new vscode.CodeLens(new vscode.Range(0, 0, 0, 0), {
                title: `File ${relativePath} - ${hasDocBacklinks} backlinks`,
                tooltip: "Reveal backlinks",
                command: "workbench.action.findInFiles",
                arguments: [{
                        query: `\\[\\[${relativePath.replace('/', '\\/').replace('.', '\\.')}.*\\]\\]`,
                        isRegex: true,
                        triggerSearch: true,
                    }],
            }));
        return this.codeLenses;
    }
}
exports.CodelensProvider = CodelensProvider;
//# sourceMappingURL=CodelensProvider.js.map