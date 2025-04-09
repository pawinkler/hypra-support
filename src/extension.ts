import * as vscode from 'vscode';
import { startVerification } from './commands';
import { checkPrerequisites, setContext } from './verification';
import { changeConfiguration, openDocument, saveDocument } from './events';
import { broadcast } from './logs';
import * as statusBar from './statusBar';

/** Activates the Hypra Support extension
 * 
 * @param ctx The extension context provided by VS Code
 */
export async function activate(ctx: vscode.ExtensionContext) {
    // Check prerequisites
    checkPrerequisites();

    // Set context
    setContext(ctx);

    // Register commands
    vscode.commands.registerCommand("hypra-support.verifyFile", startVerification);

    // Register all event handlers
    vscode.workspace.onDidSaveTextDocument(saveDocument);
    vscode.workspace.onDidOpenTextDocument(openDocument);
    vscode.workspace.onDidChangeConfiguration(changeConfiguration);

    // Create the status bar
    statusBar.create();
}

/** Deactivates the Hypra Support extension */
export function deactivate() {
    broadcast("Hypra Support (plugin) is now deactivated.");
}