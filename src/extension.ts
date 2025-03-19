import * as vscode from 'vscode';
import { startVerification } from './commands';
import { checkPrerequisites, createStatusBar, setContext,  } from './verification';
import { openDocument, saveDocument } from './events';
import { broadcast, clearLog, log, notify, showLog } from './logs';

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
	vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('hypra-support')) {
            notify("Hypra: A configuration change was detected. The new settings will be automatically applied.");
        }
    });

	createStatusBar();
}

// This method is called when your extension is deactivated
export function deactivate() {
	broadcast("Hypra Support (plugin) is now deactivated.");
}
