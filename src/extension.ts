import * as vscode from 'vscode';
import { exec, spawn } from 'child_process';
import * as path from 'path';
import { startVerification, startVerificationWithArgs } from './commands';
import { checkPrerequisites, setContext } from './verification';
import { openDocument, saveDocument } from './events';
import { broadcast, clearLog, log, showLog } from './logs';

export async function activate(ctx: vscode.ExtensionContext) {
	// Check if environment fulfills pre-requisites
	if (!await checkPrerequisites()) { return; }

	// set context
	setContext(ctx);

	// register commands
	vscode.commands.registerCommand("hypra-support.startVerification", startVerification);
	vscode.commands.registerCommand("hypra-support.startVerificationWithArgs", startVerificationWithArgs);
	
	// register events

	// register all event handlers
	vscode.workspace.onDidSaveTextDocument(saveDocument);
	vscode.workspace.onDidOpenTextDocument(openDocument);

	showLog();
	clearLog();
	broadcast("Hypra Support is now active. Sytnax Highlighting, static code completion and automatic verification is available.");
	log("This application relies on:\n- Java 17.*\n- Boogie 2.15.8.0\n- z3 4.8.14. \nUsing other versions is possible, but not recommended and happens at the risk of the user.");
	log("To start verification process on a Hypra (.hhl) file: Save the current file or use the command Hypra: Start Verification.");
}

// This method is called when your extension is deactivated
export function deactivate() {
	broadcast("Hypra Support (plugin) is now deactivated.");
}
