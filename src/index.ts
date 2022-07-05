import * as vscode from 'vscode';
import { normalizePath } from './utils';

export class WorkspaceIndex {

	private indexedDocs: vscode.TextDocument[] = [];
	private indexedSymbols: Record<string, vscode.SymbolInformation[]> = {};

	private indexing: Promise<any> | false = false;
	private onFsChangeCallback: ((indexer: WorkspaceIndex) => any) | false = false;

	private async fsChangeHandler () {
		this.indexing = this.index();
		if (this.onFsChangeCallback) this.onFsChangeCallback(this);
	}

	constructor(callback: (indexer: WorkspaceIndex) => any) {
		this.onFsChangeCallback = callback;

		vscode.workspace.onDidCreateFiles(this.fsChangeHandler.bind(this));
		vscode.workspace.onDidRenameFiles(this.fsChangeHandler.bind(this));
		vscode.workspace.onDidDeleteFiles(this.fsChangeHandler.bind(this));
		vscode.workspace.onDidChangeWorkspaceFolders(this.fsChangeHandler.bind(this));
		vscode.workspace.onDidChangeTextDocument(this.fsChangeHandler.bind(this));
		this.fsChangeHandler();
	}

	public async index () {
		const files = await vscode.workspace.findFiles('**/*.*', '**/node_modules/**');
		this.indexedDocs = (await Promise.all(files.map(async file => {
			try {
				return await vscode.workspace.openTextDocument(file);
			} catch (e) {
				return undefined;
			}
		}))).filter(Boolean) as any;
		this.indexedSymbols = Object.fromEntries((await Promise.all(files.map(async file => {
			try {
				const mySymbols = await vscode.commands.executeCommand("vscode.executeDocumentSymbolProvider", file);
				if (Array.isArray(mySymbols)) {
					return [normalizePath(file.path), mySymbols];
				};
			} catch (e) {
				return false;
			}
			return false;
		}))).filter(e => e !== false) as any) as Record<string, vscode.SymbolInformation[]>;
	}

	public async getIndex() {
		if (this.indexing) await this.indexing;
		return this.indexedDocs;
	}

	public async getSymbols() {
		if (this.indexing) await this.indexing;
		return this.indexedSymbols;
	}



}