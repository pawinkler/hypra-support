import { window, Range, TextDocument, Position, ExtensionContext, commands, workspace, languages, Hover, Disposable, Uri } from "vscode";
import { ChildProcessWithoutNullStreams, exec, spawn } from "child_process";
import { basename, join, dirname } from "path";
import { broadcast, clearLog, log, LogEntry, notify, parseLog, showLog } from "./logs";
import * as statusBar from "./statusBar";
import { fetchConfiguration, hypraConfig } from "./configuration";

/** Verification Module: Handles all verification-related operations.
 * 
 * Functions:
 * - setContext(): Sets the extension context and creates the Hypra production path.
 * - checkPrerequisites(): Checks if the current configuration satisfies all prerequisites needed for verification.
 * - verify(filePath: string): Attempts to verify the provided document.
 */

// -- variables for verification --
// --- error handling ---
const errorDecoration = window.createTextEditorDecorationType({ textDecoration: 'underline wavy red' }); // style for error decoration
let errorsOccurred = false; // error flag
let hoverProviders: Disposable[] = []; // error hover providers
let errorRanges: Array<{range: Range; msg: string}> = [];

// --- extension variables ---
let ctx: ExtensionContext | undefined = undefined; // extension context
let hypraProdPath: string | undefined = undefined; // Hypra production path, depends on the extension context

// --- verification variables ---
let verificationProcess: ChildProcessWithoutNullStreams | undefined = undefined; // verification process
export let veriDoc: TextDocument | undefined = undefined; // document in verification process

// -- functions --

/** Resets all states for verification */
function reset() {
    statusBar.setInitialState();
    errorsOccurred = false;
    errorRanges = [];
    hoverProviders.forEach(hp => hp.dispose());
    hoverProviders = [];

    if (window.activeTextEditor) {
        window.activeTextEditor.setDecorations(errorDecoration, []);
        veriDoc = undefined;
    }

    if (verificationProcess) { 
        verificationProcess.kill(); 
        verificationProcess = undefined;
    }
}

/** Sets the extension context, creates Hypra path, called in extension.ts */
export function setContext(_ctx: ExtensionContext) {
    ctx = _ctx;
    hypraProdPath = join(ctx.extensionPath, 'hypra', 'hhl.jar');
}

/** Checks if the current configuration satisfies all prerequisites needed for verification */
export async function checkPrerequisites(): Promise<boolean> {
    fetchConfiguration();

    if (hypraConfig.javaPath && hypraConfig.boogiePath && hypraConfig.z3Path && hypraConfig.javaPath !== "" && hypraConfig.boogiePath !== "" && hypraConfig.z3Path !== "") {
        return true;
    }

    function showErrorAndSettingsMsg(msg: string) {
        window.showErrorMessage(msg, "Open Settings").then(selection => {
            if (selection === "Open Settings") {
                commands.executeCommand('workbench.action.openSettings', 'hypra-support');
            }
        });
    }

    try {
        if (!hypraConfig.javaPath || hypraConfig.javaPath === "") {
            hypraConfig.javaPath = await getBinaryPathOfCommand("java");
            console.log("Java path set to: " + hypraConfig.javaPath);
        }
        if (!hypraConfig.boogiePath || hypraConfig.boogiePath === "") {
            hypraConfig.boogiePath = await getBinaryPathOfCommand("boogie");
            console.log("Boogie path set to: " + hypraConfig.boogiePath);
        }
        if (!hypraConfig.z3Path || hypraConfig.z3Path === "") {
            hypraConfig.z3Path = await getBinaryPathOfCommand("z3");
            console.log("Z3 path set to: " + hypraConfig.z3Path);
        }

        return true;
    } catch (e: any) {
        showErrorAndSettingsMsg((e as Error).message);
        return false;
    }
}

/** Attempts to verify the provided document
 * 
 * @param filePath The path to the file to verify
 * @returns void - the results are displayed in the output channel
 * 
 * Behavior:
 * - Resets all previous states
 * 
 */
export async function verify(filePath: string) {
    // reset all previous states
    reset();

    statusBar.setVerificationState();

    if (!await checkPrerequisites()) {
        broadcast("Verification process was not started due to missing prerequisites.", "ERR");
        statusBar.setErrorState();
        return;
    }

    // open provided document
    try {
        const uri = Uri.file(filePath);
        veriDoc = await workspace.openTextDocument(uri);
    } catch (e) {
        console.error(e);
        broadcast("The provided document could not be opened!", "ERR");
        statusBar.setErrorState();
        return;
    }

    // open log and return to document
    showLog();
    clearLog();
    window.showTextDocument(veriDoc);

    // construct the verification command
    const args: string[] = [];

    args.push("-Xss32m"); // additional stack space
    args.push('-jar'); // run jar file

    if (hypraConfig.hypraPath && hypraConfig.hypraPath !== "") {
        args.push(hypraConfig.hypraPath!); 
        console.log("Using custom Hypra path: ", hypraConfig.hypraPath);
    } else { 
        args.push(hypraProdPath!); 
        console.log("Using default Hypra path: ", hypraProdPath);
    }

    args.push(filePath); // file to verify

    if (hypraConfig.forallEncoding) { args.push("--forall"); } // forall encoding
    if (hypraConfig.existsEncoding) { args.push("--exists"); } // exists encoding
    if (hypraConfig.noFrame) { args.push("--noframe"); } // no frame encoding
    if (hypraConfig.existsFrame) { args.push("--existsframe"); } // exists frame encoding
    if (hypraConfig.auto) { args.push("--auto"); } // automatic rule application
    if (hypraConfig.inline) { args.push("--inline"); } // inline verification
    
    if (hypraConfig.saveViperEncoding) { // viper output file
        const vprFileName = basename(filePath, ".hhl") + ".vpr";
        const vprPath = join(dirname(filePath), vprFileName);
        args.push("--output");
        args.push(vprPath);
    }

    args.push("--ext"); // declare as extension

    // set environment variables
    let env = { ...process.env };
    if (hypraConfig.boogiePath && hypraConfig.boogiePath !== "") {
        env["BOOGIE_EXE"] = hypraConfig.boogiePath;
    }
    if (hypraConfig.z3Path && hypraConfig.z3Path !== "") {
        env["Z3_EXE"] = hypraConfig.z3Path;
    }

    // start verification
    try {
        verificationProcess = spawn(hypraConfig.javaPath as string, args, { env: env }); 

        verificationProcess.stdout.on('data', handleSTDOUT);
        verificationProcess.stderr.on('data', handleSTDERR);
        verificationProcess.on('error', handleError);
        verificationProcess.on('exit', handleTermination);
    } catch (e) {
        notify("An unexpected error occurred during the verification process (CLIENT). More information can be found in the extension's output.", "ERR");
        log((e as Error).message, "ERR");
        statusBar.setErrorState();
        console.error(e);
    }
}

/** Handles output from the verification process via the standard output.
 * 
 * @param data The data from the standard output
 * @returns void - the results are displayed in the output channel
 * 
 * Behavior:
 * - Parses the JSON object from the data
 * - Logs the parsed object
 * - Handles errors that occurred during the verification process
 */
function handleSTDOUT(data: Buffer) {
    const handleJSON = (jsonStr: string) => { 
        console.log("Received STDOUT JSON: ", jsonStr);
        
        try {
            const obj = JSON.parse(jsonStr);
            if (obj.level === "ERR") {
                handleCodeError(obj);
            } else {
                log(parseLog(obj));
            }
        } catch (e) {
            // console.log("Parsing failed due to the following error:", e, jsonStr);
            log("Failed to parse JSON object provided via STDOUT!", "ERR");
            log(jsonStr, "ERR");
        }
    };

    data.toString().trimEnd().replaceAll("'", "\"").split("\n").forEach(handleJSON);
}

/** Handles output from the verification process via the standard error.
 * 
 * @param data The data from the standard error
 * @returns void - the results are displayed in the output channel
 * 
 * Behavior:
 * - Logs the error message without parsing
 */
function handleSTDERR(data: Buffer) {
    const str = data.toString().trim();
    notify("An unexpected error occurred during verification. More information can be found in the extension's output.", "ERR");
    log(str, "ERR");
}

/** Handles the termination of the verification process.
 * 
 * @param code The exit code of the verification process
 * @returns void - the results are displayed in the output channel
 */
function handleTermination(code: number) {
    verificationProcess = undefined;

    if (code === 0) {
        if (errorsOccurred) {
            // handle expected errors
            statusBar.setErrorState();
            if (!window.activeTextEditor) { return; }

            window.showTextDocument(veriDoc!);
            // set error decoration
            window.activeTextEditor.setDecorations(errorDecoration, errorRanges.map(e => e.range));
            // set hover messages
            errorRanges.forEach(er => {
                hoverProviders.push(languages.registerHoverProvider('*', {
                    provideHover(doc, position, token) {
                        if (position.isAfter(er.range.start) && position.isBefore(er.range.end)) {
                            return new Hover(er.msg);
                        }
                    }
                }));
            });
        } else {
            statusBar.setSuccessState();
        }
    } else {
        // handle unexpected errors
        broadcast(`Verification failed with code ${code}`, "ERR");
        statusBar.setErrorState();
    }
}

/** Handles expected errors that occur during the verification process 
 * 
 * @param err The error object
 * @returns void - the results are displayed in the output channel
 *
 * Behavior:
 * - Sets the error flag
 * - Sets the error decoration in the editor
 * - Sets the hover message in the editor
 * - Logs the error message
*/
function handleCodeError(err: LogEntry) {
    errorsOccurred = true;
	let errStr = parseLog(err);

	if (veriDoc && "offsetLeft" in err.extra && "offsetRight" in err.extra) {
        console.log("Setting error decoration");

        const start = getPositionFromOffset(veriDoc, err.extra["offsetLeft"]);
        const end = getPositionFromOffset(veriDoc, err.extra["offsetRight"]);
        errorRanges.push({
            range: new Range(start, end),
            msg: errStr
        });
    }

    log(errStr, "ERR");
}

/** Fetches the path to a binary of a command
 * 
 * @param command The command to find the binary path for
 * @returns The path to the binary
 */
function getBinaryPathOfCommand(command: string): Promise<string> {
    const platform = process.platform;
    const checkCommand = platform === 'win32' ? `where ${command}` : `which ${command}`;

    return new Promise((resolve, reject) => {
        exec(checkCommand, (error, stdout) => {
            if (error) { 
                reject(new Error(`Failed to find '${command}' binary. Please provide the path to the Z3 binary in the settings.`));
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

/** Converts offset to document position */
function getPositionFromOffset(document: TextDocument, offset: number): Position {
    return document.positionAt(offset);
}

/** Handles errors that occur when spawn results in an error */
function handleError(err: Error) {
    const str = (err as Error).message;
    if (str.includes("ENOENT")) {
        notify("The provided path to the Java binary is invalid. Please update the path in the settings.", "ERR");
    } else {
        notify("An unexpected error occurred during the verification process. More information can be found in the output.", "ERR");
        log(str, "ERR");
        console.error(err);
    }
    statusBar.setErrorState();
}