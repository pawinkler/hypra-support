import * as vsc from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';

const published = false;

export function activate(ctx: vsc.ExtensionContext) {
	// elements
	const outputChannel = vsc.window.createOutputChannel("Hypra Logs");

	// register all commands
	vsc.commands.registerCommand("hypra-support.startVerificationWithArgs", async () => {
		const argsChained = await vsc.window.showInputBox({ prompt: 'Please specify enter arguments for execution (except for file, separated by ",").' });
		if (!argsChained) {
			sendNotification("ERROR", 'No arguments were provided. Use "Hypra: Start Verification" for default execution.');
			return;
		}

		const args = argsChained.split(",").map(el => el.trim());
		if (commandIsAppropriate()) { startVerification(ctx, outputChannel, vsc.window.activeTextEditor!.document!, args); }
	});
	vsc.commands.registerCommand("hypra-support.startVerification", async () => {
		if (commandIsAppropriate()) { startVerification(ctx, outputChannel, vsc.window.activeTextEditor!.document!); }
	});

	// register all event handlers
	vsc.workspace.onDidSaveTextDocument(doc => {
		if (!fileIsHypraCode(doc)) { return; }
		startVerification(ctx, outputChannel, doc);
	});

	vsc.workspace.onDidOpenTextDocument(doc => {
		if (!fileIsHypraCode(doc)) {
			return;
		}

		outputChannel.show();
		log(outputChannel, "Hypra Support is now active. Sytnax Highlighting, static code completion and automatic verification is available.");
		log(outputChannel, "To start verification process on a Hypra (.hhl) file: Save the current file or use the command Hypra: Start Verification.");
	});


	let editor = vsc.window.activeTextEditor;
	if (editor) {
		// handle editor activation
		const doc = editor.document;

		// activate for hypra file
		if (fileIsHypraCode(doc)) {
			sendNotification("INFO", "Welcome to Hypra, a automatic verifier for Hyper Hoare Logic!");

			outputChannel.show();
			log(outputChannel, "Hypra Support is now active. Sytnax Highlighting, static code completion and automatic verification is available.");
			log(outputChannel, "To start verification process on a Hypra (.hhl) file: Save the current file or use the command Hypra: Start Verification.");
		}
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	vsc.window.showInformationMessage("Hypra Support (plugin) is now deactivated.");
}

function startVerification(ctx: vsc.ExtensionContext, channel: vsc.OutputChannel, doc: vsc.TextDocument, args: string[] | undefined = undefined) {
	channel.clear();
	channel.show();
	log(channel, `Starting verification process for file "${doc.fileName}".`);
	log(channel, `Running jar verifier.`);

	let file = doc.fileName;
	let hhlPathProd = path.join(ctx.extensionPath, 'dist', 'hypra', 'hhl.jar');
	let hhlPathDebug = path.join(ctx.extensionPath, 'hypra', 'hhl.jar');

	if (args) { args = ['-jar', published ? hhlPathProd : hhlPathDebug, file].concat(args); }
	else { args = ['-jar', published ? hhlPathProd : hhlPathDebug, file, "--auto"]; }

	// log(channel, "args provided: " + args.toString()); 

	const process = spawn('java', args); 

	process.stdout.on('data', (data) => {
		let dataStr = data as string;
		log(channel, dataStr.slice(0, dataStr.length - 1));
	});

	process.stderr.on('data', (data) => {
		let dataStr = data as string;
		log(channel, dataStr.substring(0, dataStr.length-1), "ERROR");
	});

	process.on('close', (code) => {
		sendNotification("WARN", `Process exited with code ${code}`);
	});

}

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

function getTimestamp(): string {
  return new Date().toISOString();
}

function log(channel: vsc.OutputChannel, message: string, level: LogLevel = "INFO") {
  channel.appendLine(`[${getTimestamp()}] [${level}] ${message}`);
}

function clearLog(channel: vsc.OutputChannel) {
	channel.clear();
}

function sendNotification(level: LogLevel, text: string) {
	switch (level) {
		case "INFO": 
			vsc.window.showInformationMessage(text);
			break;
		case "WARN": 
			vsc.window.showWarningMessage(text);
			break;
		case "ERROR": 
			vsc.window.showErrorMessage(text);
			break;
		case "DEBUG": 
			vsc.window.showInformationMessage(`[DEBUG] ${text}`);
			break;
	}
}

function fileIsHypraCode(doc: vsc.TextDocument) {
	return doc.languageId === 'hypra' && doc.fileName.endsWith('.hhl');
}

function commandIsAppropriate(): boolean {
	let editor = vsc.window.activeTextEditor;
	if (!editor) {
		sendNotification("ERROR", "This command can only when a workspace is open.");
		return false;
	}
	let doc = editor?.document;
	if (!fileIsHypraCode(doc)) {
		sendNotification("ERROR", "This command can only be executed on Hypra (.hhl) files.");
		return false;
	}
	return true;
}