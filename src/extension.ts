/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import { CodelensProvider } from './CodelensProvider';


/**
 * 
 * @param context 
 */
export function activate(context: vscode.ExtensionContext) {

	let files: vscode.Uri[] = [];
	let symbols: Record<string, vscode.SymbolInformation[]> = {};

	const normalizePath = (path: string) => path.replace(vscode.workspace.workspaceFolders?.[0].uri.path + '/', '');	

	const provider = vscode.languages.registerCompletionItemProvider(
		'*',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {

				const linePrefix = document.lineAt(position).text.substr(0, position.character);
				if (!linePrefix.endsWith('[[')) {
					return undefined;
				}

				const completions = [
					...files.map(el => [normalizePath(el.path), new vscode.CompletionItem(normalizePath(el.path), vscode.CompletionItemKind.File)]),
					...Object.entries(symbols).map(([path, symbols]) => symbols.map(el => [path + '#' + el.name, new vscode.CompletionItem(path + '#' + el.name, el.kind as unknown as vscode.CompletionItemKind)])).flat(),
				];

				return completions.sort((a, b) => a[0] > b[0] ? 1 : -1).map(el => el[1]) as vscode.CompletionItem[];

			}
		},
		'[' // triggered whenever a '.' is being typed
	);

	const getLinkProvider = () => {
		return vscode.languages.registerDocumentLinkProvider(
			'*',
			{
				provideDocumentLinks(document: vscode.TextDocument, token: vscode.CancellationToken) {
					
					const linkMatcher = /\[\[([^[\]]*)\]\]/g;
					const links: vscode.DocumentLink[] = [];

					for (let i = 0; i < document.lineCount; ++i ) {
						const line = document.lineAt(i).text;
						for (let match: any; (match = linkMatcher.exec(line)) !== null; ) {
							const beginning = match.index + 2;
							const ending = linkMatcher.lastIndex - 2;

							let target = vscode.Uri.parse('vscode://file/' + vscode.workspace.workspaceFolders?.[0].uri.path + '/' + match[1]);
							if (match[1].includes('#')) {
								const [file, symbol] = match[1].split('#');
								const symbolInfo = symbols[file]?.find(el => el.name === symbol);
								if (!symbolInfo) {
									target = vscode.Uri.parse('vscode://file/' + vscode.workspace.workspaceFolders?.[0].uri.path + '/' + file);
								} else {
									target = vscode.Uri.parse('vscode://file/' + vscode.workspace.workspaceFolders?.[0].uri.path + '/' + file + ':' + (symbolInfo.location.range.start.line + 1));
								}
							}

							links.push({
								range: new vscode.Range(i, beginning, i, ending),
								target,
							})
						}
					}

					return links;

				}
			}
		)
	}

	let provider2 = getLinkProvider();

	const fsChangeHandler = async () => {
		files = await vscode.workspace.findFiles('**/*.*', '**/node_modules/**');
		await Promise.all(files.map(async file => {
			try {
				const mySymbols = await vscode.commands.executeCommand("vscode.executeDocumentSymbolProvider", file);
				if (Array.isArray(mySymbols)) {
					symbols[normalizePath(file.path)] = mySymbols;
				};
			} catch (e) {
				return ;
			}
		}));
		console.log(symbols);
		provider2.dispose();
		provider2 = getLinkProvider();
		context.subscriptions.push(provider2);
	}

	vscode.workspace.onDidCreateFiles(fsChangeHandler);
	vscode.workspace.onDidRenameFiles(fsChangeHandler);
	vscode.workspace.onDidDeleteFiles(fsChangeHandler);
	vscode.workspace.onDidChangeWorkspaceFolders(fsChangeHandler);
	vscode.workspace.onDidChangeTextDocument(fsChangeHandler);
	fsChangeHandler();

	context.subscriptions.push(provider, provider2);

	const codelensProvider = new CodelensProvider();

    vscode.languages.registerCodeLensProvider('*', codelensProvider);
}
