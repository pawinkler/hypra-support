import { window, Range, TextDocument, Position, ExtensionContext } from "vscode";
import { ChildProcessWithoutNullStreams, exec, spawn } from "child_process";
import { join } from "path";
import { broadcast, clearLog, log, notify } from "./logs";

type CodeError = { 
    name: string; 
    code: number; 
    offsetLeft: number; 
    offsetRight: number;
    descr: string 
}

const redLineDecorationType = window.createTextEditorDecorationType({
    textDecoration: 'underline wavy red',
});

let ctx: ExtensionContext | undefined = undefined;
let hypraProdPath: string | undefined = undefined;

let verificationProcess: ChildProcessWithoutNullStreams | undefined = undefined;

export function setContext(_ctx: ExtensionContext) {
    ctx = _ctx;
    hypraProdPath = join(ctx.extensionPath, 'hypra', 'hhl.jar');
}

export async function checkPrerequisites(): Promise<boolean> {
    const cmds = ["java", "z3", "boogie"];
	for (let i in cmds) {
		if (!await commandExists(cmds[i])) {
			broadcast(`Failed to activate Hypra Helper. "${cmds[i]}" was not found, but it needed for this application`, "ERROR");
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

    verificationProcess.stdout.on('data', (data: Buffer) => {
		const str = data.toString().trim();

		if (str.startsWith("JSON")) {
            const raw =	 str.slice(9);

			try {
				const obj = JSON.parse(raw) as { descr: string };
				log(obj.descr);
			} catch (e) {
                log("Failed to parse stdout json for:\n" + str.replace("\n", "\\n"), "WARN");
			}
		} else {
			log("UNPARSED: " + str);
		}
	});

    verificationProcess.stderr.on('data', (data: string) => {
        const str = data.toString().trim();

        if (str.startsWith("JSON")) {
            const type = str.slice(5, 8);
            const raw =	 str.slice(9);

            try {
                if (type === "ERC") {
                    const obj = JSON.parse(raw) as CodeError;
                    handleCodeError(obj);
                } else if (type === "ERS") {
                    const err = JSON.parse(raw) as { name: string; descr: string };
                    const errStr = `${err.name}: ${err.descr}`;
                    broadcast(errStr, "ERROR");
                } else {
                    const warn = JSON.parse(raw) as { name: string; descr: string };
                    const warnStr = `${warn.name}: ${warn.descr}`;
                    broadcast(warnStr, "WARN");
                }
            } catch (e) {
                log("Failed to parse stderr json for:\n" + str.replace("\n", "\\n"), "WARN");
            }
        } else {
            log("UNPARSED: " + str, "ERROR");
        }
    });

    verificationProcess.on('close', (code) => {
		broadcast(`Verification finished with code ${code}`);
        
        verificationProcess = undefined;
	});
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


function handleCodeError(err: CodeError) {
	let errStr = `${err.name} at pos ${err.offsetLeft}: ${err.descr}`;

	const editor = window.activeTextEditor;
	const doc = editor?.document;
	if (doc) {
        const start = getPositionFromOffset(doc, err.offsetLeft);
        const end = getPositionFromOffset(doc, err.offsetRight);
        const range = new Range(start, end);
        editor.setDecorations(redLineDecorationType, [range]);

        errStr = `File ${doc.fileName}:${start.line + 1}:${start.character + 1}: ${errStr}`;
    } 
    log(errStr, "ERROR");
}