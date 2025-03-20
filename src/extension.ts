import * as vscode from 'vscode';
import { startVerification } from './commands';
import { checkPrerequisites, setContext  } from './verification';
import { changeConfiguration, openDocument, saveDocument } from './events';
import { broadcast, notify } from './logs';
import * as statusBar from './statusBar';

export async function activate(ctx: vscode.ExtensionContext) {
	// check prerequisites
	checkPrerequisites();

	// set context
	setContext(ctx);

	// register commands
	vscode.commands.registerCommand("hypra-support.verifyFile", startVerification);

	// register all event handlers
	vscode.workspace.onDidSaveTextDocument(saveDocument);
	vscode.workspace.onDidOpenTextDocument(openDocument);
	vscode.workspace.onDidChangeConfiguration(changeConfiguration);

	statusBar.create();
}

// This method is called when your extension is deactivated
export function deactivate() {
	broadcast("Hypra Support (plugin) is now deactivated.");
}
