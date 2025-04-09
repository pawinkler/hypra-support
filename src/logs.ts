import { window } from "vscode";

type LogLevel = "INF" | "WRN" | "ERR" | "DBG";

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    extra: {
        [key: string]: any;
    };
}

const channel = window.createOutputChannel("Hypra Logs"); 

/** Broadcasts a message to both the log and notification system */
export function broadcast(msg: string, lvl: LogLevel = "INF") {
    log(msg, lvl);
    notify(msg, lvl);
}

/** Logs a message to the output channel */
export function log(msg: string, lvl: LogLevel = "INF") {
    channel.appendLine(msg);
}

/** Parses a log entry into a formatted string */
export function parseLog(obj: LogEntry): string {
    const time = new Date(obj.timestamp).toISOString().split(".")[0];
    const level = translateLevel(obj.level);

    let out = `[${time}] [${level}]`;
    if (obj.extra) {
        if ('offsetLeft' in obj.extra && 'offsetRight' in obj.extra) {
            out += ` in ${obj.extra['filePath']}:${obj.extra['offsetLeft']}-${obj.extra['offsetRight']}`;
        }
        if ('title' in obj.extra) {
            out += ` ${obj.extra['title']}:`;
        }
    }
    out += ` ${obj.message}`;
    if (obj.extra) {
        if ('quantifiersRemoved' in obj.extra && parseInt(obj.extra['quantifiersRemoved']) > 0) {
            out += ` (${obj.extra['quantifiersRemoved']} existential quantifiers removed)`;
        }
    }
    if (obj.extra) {
        if ('whileRule' in obj.extra) {
            out += ` (${obj.extra['whileRule']})`;
        }
    }
    return out;
}

/** Clears the log output channel */
export function clearLog() {
    channel.clear();
}

/** Displays the log output channel */
export function showLog() {
    channel.show();
}

/** Sends a notification message based on the log level */
export function notify(msg: string, lvl: LogLevel = "INF") {
    switch (lvl) {
        case "INF": 
            window.showInformationMessage(msg);
            break;
        case "WRN": 
            window.showWarningMessage(msg);
            break;
        case "ERR": 
            window.showErrorMessage(msg);
            break;
        case "DBG": 
            window.showInformationMessage(`[DEBUG] ${msg}`);
            break;
    }
}

/** Gets the current timestamp in ISO format */
function getTimestamp(): string {
    return new Date().toISOString();
}

/** Translates a log level to its full string representation */
function translateLevel(lvl: LogLevel): string {
    switch (lvl) {
        case "INF": return "INFO";
        case "WRN": return "WARN";
        case "ERR": return "ERROR";
        case "DBG": return "DEBUG";
    }
}