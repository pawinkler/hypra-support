import { window, OutputChannel } from "vscode";

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

export function broadcast(msg: string, lvl: LogLevel = "INF") {
    log(msg, lvl);
    notify(msg, lvl);
}

export function log(msg: string, lvl: LogLevel = "INF") {
  channel.appendLine(msg);
}

export function parseLog(obj: LogEntry): string {
    const time = new Date(obj.timestamp).toISOString().split(".")[0];
    const level = translateLevel(obj.level);

    let out = `[${time}] [${level}]`;
    if (obj.extra && typeof obj.extra === 'object') {
        if ('offsetLeft' in obj.extra && 'offsetRight' in obj.extra) {
            out += ` in ${obj.extra['filePath']}:${obj.extra['offsetLeft']}-${obj.extra['offsetRight']}`;
        }
        if ('title' in obj.extra) {
            out += ` ${obj.extra['title']}:`;
        }
    }
    out += ` ${obj.message}`;
    return out;
}

export function clearLog() {
    channel.clear();
}

export function showLog() {
    channel.show();
}

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

function getTimestamp(): string {
  return new Date().toISOString();
}

function translateLevel(lvl: LogLevel): string {
    switch (lvl) {
        case "INF": return "INFO";
        case "WRN": return "WARN";
        case "ERR": return "ERROR";
        case "DBG": return "DEBUG";
    }
}