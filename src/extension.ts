import * as vsc from 'vscode';
import { exec, spawn } from 'child_process';
import * as path from 'path';

const published = true;

const redLineDecorationType = vsc.window.createTextEditorDecorationType({
	textDecoration: 'underline wavy red',
});

export async function activate(ctx: vsc.ExtensionContext) {
	// elements
	const outputChannel = vsc.window.createOutputChannel("Hypra Logs");

	// check for correct environment
	const cmds = ["java", "z3", "boogie"];
	for (let i in cmds) {
		if (!await commandExists(cmds[i])) {
			sendNotification("ERROR", `Failed to activate Hypra Helper. "${cmds[i]}" was not found, but it needed for this application`);
			outputChannel.clear();
			outputChannel.show();
			log(outputChannel, "This application relies on:\n- Java 17.*\n- Boogie 2.15.8.0\n- z3 4.8.14. \nUsing other versions is possible, but not recommended and happens at the risk of the user.");
			return;
		}
	}

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

		welcomeUser(outputChannel);
	});


	let editor = vsc.window.activeTextEditor;
	if (editor) {
		// handle editor activation
		const doc = editor.document;

		// activate for hypra file
		if (fileIsHypraCode(doc)) {
			sendNotification("INFO", "Welcome to Hypra, a automatic verifier for Hyper Hoare Logic!");

			welcomeUser(outputChannel);
		}
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	vsc.window.showInformationMessage("Hypra Support (plugin) is now deactivated.");
}

function startVerification(ctx: vsc.ExtensionContext, channel: vsc.OutputChannel, doc: vsc.TextDocument, args: string[] | undefined = undefined) {
	channel.clear();

	const editor = vsc.window.activeTextEditor;
	if (editor) {
		const range = new vsc.Range(getPositionFromOffset(doc, 0), getPositionFromOffset(doc, 0));
    	editor.setDecorations(redLineDecorationType, [range]);
	}

	log(channel, `Starting verification process for file "${doc.fileName}".`);
	log(channel, `Running jar verifier.`);

	let file = doc.fileName;
	let hhlPathProd = path.join(ctx.extensionPath, 'hypra', 'hhl.jar');
	let hhlPathDebug = "/Users/paulwinkler/Desktop/hhl_frontend/target/scala-2.13/hhl.jar";

	if (args) { args = ['-jar', published ? hhlPathProd : hhlPathDebug, file, "--ext"].concat(args); }
	else { args = ['-jar', published ? hhlPathProd : hhlPathDebug, file, "--ext", "--auto"]; }

	const process = spawn('java', args); 

	process.stdout.on('data', (data: Buffer) => {
		const str = data.toString();

		if (str.startsWith("JSON")) {
			const [id, _, raw] = str.split("-");

			try {
				const obj = JSON.parse(raw) as { descr: string};
				log(channel, obj.descr);
			} catch (e) {
				log(channel, "Failed to parse json for:\n" + raw, "WARN");
			}
		} else {
			log(channel, str);
		}
	});

	process.stderr.on('data', (data: string) => {
		const str = data.toString();

		if (str.startsWith("JSON")) {
			const type = str.slice(5, 8);
			const raw =	 str.slice(9);

			try {
				if (type === "ERC") {
					const obj = JSON.parse(raw) as { name: string; code: number; pos:number; descr: string };
					handleCodeError(channel, obj);
				} else if (type === "ERS") {
					const err = JSON.parse(raw) as { name: string; descr: string };
					const errStr = `${err.name}: ${err.descr}`;
					sendNotification("ERROR", errStr);
					log(channel, errStr, "ERROR");
				} else {
					const warn = JSON.parse(raw) as { name: string; descr: string };
					const warnStr = `${warn.name}: ${warn.descr}`;
					sendNotification("WARN", warnStr);
					log(channel, warnStr, "WARN");
				}
			} catch (e) {
				log(channel, "Failed to parse json for:\n" + raw, "WARN");
			}
		} else {
			log(channel, str, "ERROR");
		}
	});

	process.on('close', (code) => {
		sendNotification("INFO", `Verification finishd with code ${code}`);
	});

}

function getPositionFromOffset(document: vsc.TextDocument, offset: number): vsc.Position {
	return document.positionAt(offset);
  }

function handleCodeError(channel: vsc.OutputChannel, err: { name: string; code: number; pos:number; descr: string }) {
	const errStr = `${err.name} (CODE: ${err.code}) at pos ${err.pos}: ${err.descr}`;
	sendNotification("ERROR", errStr);
	log(channel, errStr, "ERROR");

	const editor = vsc.window.activeTextEditor;
    if (!editor) { return; }
	const doc = editor.document;
	if (!doc) { return; }

	const start = getPositionFromOffset(doc, err.pos);
	const word = doc.getText(doc.getWordRangeAtPosition(start));
    const range = new vsc.Range(start, getPositionFromOffset(doc, err.pos + word.length));
    editor.setDecorations(redLineDecorationType, [range]);
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

function commandExists(command: string): Promise<boolean> {
	const platform = process.platform;
	const checkCommand = platform === 'win32' ? `where ${command}` : `which ${command}`;
  
	return new Promise((resolve) => {
	  exec(checkCommand, (error, stdout) => {
		resolve(!error && !!stdout.trim());
	  });
	});
  }

  function welcomeUser(ch: vsc.OutputChannel) {
	ch.show();
	ch.clear();
	log(ch, "Hypra Support is now active. Sytnax Highlighting, static code completion and automatic verification is available.");
	log(ch, "This application relies on:\n- Java 17.*\n- Boogie 2.15.8.0\n- z3 4.8.14. \nUsing other versions is possible, but not recommended and happens at the risk of the user.");
	log(ch, "To start verification process on a Hypra (.hhl) file: Save the current file or use the command Hypra: Start Verification.");
  }