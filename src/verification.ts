import { window, Range, TextDocument, Position, ExtensionContext } from "vscode";
import { ChildProcessWithoutNullStreams, exec, spawn } from "child_process";
import { join } from "path";
import { broadcast, clearLog, log, LogEntry, notify, parseLog } from "./logs";


const redLineDecorationType = window.createTextEditorDecorationType({
    textDecoration: 'underline wavy red',
});

let ctx: ExtensionContext | null = null;
let hypraProdPath: string | null = null;

let verificationProcess: ChildProcessWithoutNullStreams | null = null;

export function setContext(_ctx: ExtensionContext) {
    ctx = _ctx;
    hypraProdPath = join(ctx.extensionPath, 'hypra', 'hhl.jar');
}

export async function checkPrerequisites(): Promise<boolean> {
    const cmds = ["java", "z3", "boogie"];
	for (let i in cmds) {
		if (!await commandExists(cmds[i])) {
			broadcast(`Failed to activate Hypra Helper. "${cmds[i]}" was not found, but it needed for this application`, "ERR");
			log("This application relies on:\n- Java 17.*\n- Boogie 2.15.8.0\n- z3 4.8.14. \nUsing other versions is possible, but not recommended and happens at the risk of the user.");
			return false;
		}
	}

    return true;
}

export function verify(filePath: string, args: string[] | undefined = undefined) {
    if (verificationProcess) { verificationProcess.kill(); }

    const editor = window.activeTextEditor;
    const doc = editor?.document;

    // reset
    if (editor && doc) {
        const range = new Range(getPositionFromOffset(doc, 0), getPositionFromOffset(doc, 0));
        editor.setDecorations(redLineDecorationType, [range]);
    }
    clearLog();

    // prepare arguments
    if (args) { args = ["-Xss32m", '-jar', hypraProdPath!, filePath, "--ext"].concat(args); }
	else { args = ["-Xss32m", '-jar', hypraProdPath!, filePath, "--ext", "--auto"]; }

    // start verification
    verificationProcess = spawn('java', args); 
    verificationProcess.stdout.on('data', handleSTDOUT);
    verificationProcess.stderr.on('data', handleSTDERR);
    verificationProcess.on('exit', handleTermination);
}

function handleSTDOUT(data: Buffer) {
    const hanldeJSON = (jsonStr: string) => { 
        try {
            const obj = JSON.parse(jsonStr);
            if (obj.level === "ERR") {
                handleCodeError(obj);
            } else {
                log(parseLog(obj));
            }
        } catch (e) {
            console.log("Parsing failed due to the following error:", e, jsonStr);
            log("Failed to parse JSON object provided via STDOUT!", "ERR");
            log(jsonStr, "ERR");
        }
    };

    data.toString().trimEnd().split("\n").forEach(hanldeJSON);
}

function handleSTDERR(data: Buffer) {
    const str = data.toString().trim();
    notify("An unexpected error occured during verification. More information can be found in the extension's output.", "ERR");
    log(str, "ERR");
}

function handleTermination(code: number) {
    verificationProcess = null;

    if (code === 0) {
        broadcast("Verification finished successfully", "INF");
    } else {
        broadcast(`Verification finished with code ${code}`, "ERR");
    }
}

function handleCodeError(err: LogEntry) {
	let errStr = parseLog(err);

	const editor = window.activeTextEditor;
	const doc = editor?.document;

    console.log(err.extra);

	if (doc && "offsetLeft" in err.extra && "offsetRight" in err.extra) {
        console.log("Setting red line decoration");
        const start = getPositionFromOffset(doc, err.extra["offsetLeft"]);
        const end = getPositionFromOffset(doc, err.extra["offsetRight"]);
        const range = new Range(start, end);
        editor.setDecorations(redLineDecorationType, [range]);
    }

    log(errStr, "ERR");
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

function getPositionFromOffset(document: TextDocument, offset: number): Position {
    return document.positionAt(offset);
}
