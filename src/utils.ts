import * as vscode from 'vscode';

export const normalizePath = (path: string) => path.replace(vscode.workspace.workspaceFolders?.[0].uri.path + '/', '');