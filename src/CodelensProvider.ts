import * as vscode from 'vscode';
import { WorkspaceIndex } from '.';
import { normalizePath } from './utils';

/**
 * CodelensProvider
 */
export class CodelensProvider implements vscode.CodeLensProvider {

    private codeLenses: vscode.CodeLens[] = [];
    private regex: RegExp;
	private indexer: WorkspaceIndex;

    constructor(indexer: WorkspaceIndex) {
        this.regex = /\[\[([^[\]]*)\]\]/g;
		this.indexer = indexer
    }


	/**
	 * Scans 
	 * @param document 
	 * @param token 
	 * @returns 
	 */
    public async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.CodeLens[]> {

		const docs = await this.indexer.getIndex();
		
		const findInDoc = (document: vscode.TextDocument, thing: string) => {
			let n = 0;
			for (let i = 0; i < document.lineCount; ++i ) {
				const line = document.lineAt(i).text;
				if (line.includes(thing)) n++;
			};
			return n;
		}

		const file = document.uri;
        const mySymbols: vscode.SymbolInformation[] = await vscode.commands.executeCommand("vscode.executeDocumentSymbolProvider", file);
		const relativePath = normalizePath(document.uri.path);

		this.codeLenses = [];
		await Promise.all(mySymbols?.map(async el => {
			const repr = `[[${relativePath}#${el.name}]]`
			let hasBacklinks = docs.map(el => findInDoc(el, repr)).reduce((prev, curr) => prev + curr, 0);
			if (hasBacklinks) this.codeLenses.push(new vscode.CodeLens(el.location.range, {
				title: `${hasBacklinks} backlinks`,
				tooltip: "Reveal backlinks",
				command: "workbench.action.findInFiles",
				arguments: [{
					query: repr,
					isRegex: false,
					triggerSearch: true,
				}] as any,
			}));
		}) || []);

		const hasDocBacklinks = docs.map(el => findInDoc(el, `[[${relativePath}]]`)).reduce((prev, curr) => prev + curr, 0)
			+ docs.map(el => findInDoc(el, `[[${relativePath}#`)).reduce((prev, curr) => prev + curr, 0);
		if (hasDocBacklinks) this.codeLenses.push(new vscode.CodeLens(new vscode.Range(0, 0, 0, 0), {
			title: `File ${relativePath} - ${hasDocBacklinks} backlinks`,
			tooltip: "Reveal backlinks",
			command: "workbench.action.findInFiles",
			arguments: [{
				query: `\\[\\[${relativePath.replace('/', '\\/').replace('.', '\\.')}.*\\]\\]`,
				isRegex: true,
				triggerSearch: true,
			}] as any,
		}));

		return this.codeLenses;

    }

}

