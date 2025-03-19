import { window, Range, TextDocument, Position, ExtensionContext, commands, workspace, StatusBarItem, StatusBarAlignment, ThemeColor, languages, Hover, HoverProvider, Disposable } from "vscode";
import { ChildProcessWithoutNullStreams, exec, spawn } from "child_process";
import { basename, join, dirname } from "path";
import { broadcast, clearLog, log, LogEntry, notify, parseLog, showLog } from "./logs";

let statusBar: StatusBarItem | undefined = undefined;
export function createStatusBar() {
    statusBar = window.createStatusBarItem(StatusBarAlignment.Left);
    statusBar.name = "Hypra Verification Indicator";
    statusBar.command = "hypra-support.verifyFile";
    barSetInitial();
}

export function barRemove() {
    if (statusBar) {
        statusBar.hide();
    }
}

export function barSetInitial() {
    if (statusBar) {
        statusBar.text = "Hypra: Activation successful. Start Verification?";
        statusBar.show();
    }
}

let alternation = false;
let interval: NodeJS.Timeout | undefined = undefined;

function barSetInVerification(c: number = 0) {
    if (statusBar) {
        statusBar.text = "Hypra: Verification is running |";
        statusBar.color = "#ffd000";
        statusBar.show();

        if (interval) {
            return;
        }
        interval = setInterval(() => {
            if (statusBar) {
                statusBar.text = "Hypra: Verification is running " + (alternation ? "|" : "-");
                alternation = !alternation;
                statusBar.show();
            }
        }, 500);
    }
}

function barSetError() {
    if (statusBar) {
        if (interval) {
            clearInterval(interval);
            interval = undefined;
        }
        statusBar.text = "Hypra: Verifcation failed! Click to retry.";
        statusBar.color = "#ff0d00";
        statusBar.show();
    }
}

function barSetSuccess() {
    if (statusBar) {
        if (interval) {
            clearInterval(interval);
            interval = undefined;
        }
        statusBar.text = "Hypra: Verficiation successful!";
        statusBar.color = "#19e35c";
        statusBar.show();
    }
}

const hypraConfig = {
    javaPath: undefined,
    boogiePath: undefined,
    z3Path: undefined,
    hypraPath: undefined,
    saveViperEncoding: undefined,
    forallEncoding: undefined,
    existsEncoding: undefined,
    noFrame: undefined,
    existsFrame: undefined,
    auto: undefined
} as {
    javaPath: string | undefined,
    boogiePath: string | undefined,
    z3Path: string | undefined,
    hypraPath: string | undefined,
    saveViperEncoding: boolean | undefined,
    forallEncoding: boolean | undefined,
    existsEncoding: boolean | undefined,
    noFrame: boolean | undefined,
    existsFrame: boolean | undefined,
    auto: boolean | undefined,
    inline: boolean | undefined
};

function fetchConfiguration() {
    const config = workspace.getConfiguration('hypra-support');

    hypraConfig.javaPath = config.get<string>('requisites.javaPath');
    hypraConfig.boogiePath = config.get<string>('requisites.boogiePath');
    hypraConfig.z3Path = config.get<string>('requisites.z3Path');
    hypraConfig.hypraPath = config.get<string>('requisites.hypraPath');
    hypraConfig.saveViperEncoding = config.get<boolean>('verifierOptions.saveViperEncoding');
    hypraConfig.forallEncoding = config.get<boolean>('verifierOptions.forallEncoding');
    hypraConfig.existsEncoding = config.get<boolean>('verifierOptions.existsEncoding');
    hypraConfig.noFrame = config.get<boolean>('verifierOptions.noFrame');
    hypraConfig.existsFrame = config.get<boolean>('verifierOptions.existsFrame');
    hypraConfig.auto = config.get<boolean>('verifierOptions.auto');
    hypraConfig.inline = config.get<boolean>('verifierOptions.inline');
}

const redLineDecorationType = window.createTextEditorDecorationType({
    textDecoration: 'underline wavy red',
});

let ctx: ExtensionContext | undefined = undefined;
let hypraProdPath: string | undefined = undefined;
let verificationProcess: ChildProcessWithoutNullStreams | null = null;

export function setContext(_ctx: ExtensionContext) {
    ctx = _ctx;
    hypraProdPath = join(ctx.extensionPath, 'hypra', 'hhl.jar');
}

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

let errorsOccured = false;
let hoverProviders: Disposable[] = [];

export async function verify(filePath: string) {
    barSetInVerification();

    errorsOccured = false;

    if (!await checkPrerequisites()) {
        broadcast("Verification process was not started due to missing prerequisites.", "ERR");
        barSetError();
        return;
    }

    if (verificationProcess) { verificationProcess.kill(); }

    const editor = window.activeTextEditor;
    const doc = editor?.document;

    // reset
    errorRanges = [];
    if (editor) {
        editor.setDecorations(redLineDecorationType, errorRanges.map(e => e.range));
        hoverProviders.forEach(hp => hp.dispose());
        hoverProviders = [];
        veriDoc = editor.document;
    }

    showLog();
    if (doc) {
        window.showTextDocument(doc);
    }
    clearLog();

    // parse arguments
    const args: string[] = [];

    args.push("-Xss32m"); // additional stack space
    args.push('-jar'); // run jar file

    if (hypraConfig.hypraPath && hypraConfig.hypraPath !== "") {
        args.push(hypraConfig.hypraPath!); 
        console.log("Using custom hypra path: ", hypraConfig.hypraPath);
    } else { 
        args.push(hypraProdPath!); 
        console.log("Using default hypra path: ", hypraProdPath);
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

    // start verification
    try {
        verificationProcess = spawn(hypraConfig.javaPath as string, args); 
        verificationProcess.stdout.on('data', handleSTDOUT);
        verificationProcess.stderr.on('data', handleSTDERR);
        verificationProcess.on('exit', handleTermination);
    } catch (e) {
        notify("An unexpected error occured during the verification process (CLIENT). More information can be found in the extension's output.", "ERR");
        log((e as Error).message, "ERR");
        barSetError();
        console.log(e);
    }
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
            // console.log("Parsing failed due to the following error:", e, jsonStr);
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
        if (errorsOccured) {
            barSetError();
            if (window.activeTextEditor) {
                window.activeTextEditor.setDecorations(redLineDecorationType, errorRanges.map(e => e.range));
            }
        } else {
            barSetSuccess();
        }
    } else {
        broadcast(`Verification failed with code ${code}`, "ERR");
        barSetError();
    }
}

let errorRanges: Array<{range: Range; msg: string}> = [];
let veriDoc: TextDocument | undefined = undefined;

function handleCodeError(err: LogEntry) {
    errorsOccured = true;
	let errStr = parseLog(err);

	if (veriDoc && "offsetLeft" in err.extra && "offsetRight" in err.extra) {
        console.log("Setting red line decoration");

        const start = getPositionFromOffset(veriDoc, err.extra["offsetLeft"]);
        const end = getPositionFromOffset(veriDoc, err.extra["offsetRight"]);
        errorRanges.push({
            range: new Range(start, end),
            msg: errStr
        });

        console.log("Setting hover message");
        hoverProviders.push(languages.registerHoverProvider('*', {
            provideHover(doc, position, token) {
                if (position.isAfter(start) && position.isBefore(end)) {
                    return new Hover(errStr);
                }
            }
        }));
    }

    log(errStr, "ERR");
}

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

function getPositionFromOffset(document: TextDocument, offset: number): Position {
    return document.positionAt(offset);
}
