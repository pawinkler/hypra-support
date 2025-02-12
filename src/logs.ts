import { window, OutputChannel } from "vscode";

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

const channel = window.createOutputChannel("Hypra Logs"); 

export function broadcast(msg: string, lvl: LogLevel = "INFO") {
    log(msg, lvl);
    notify(msg, lvl);
}

export function log(msg: string, lvl: LogLevel = "INFO") {
  channel.appendLine(`[${getTimestamp()}] [${lvl}] ${msg}`);
}

export function clearLog() {
    channel.clear();
}

export function showLog() {
    channel.show();
}

export function notify(msg: string, lvl: LogLevel = "INFO") {
    switch (lvl) {
        case "INFO": 
            window.showInformationMessage(msg);
            break;
        case "WARN": 
            window.showWarningMessage(msg);
            break;
        case "ERROR": 
            window.showErrorMessage(msg);
            break;
        case "DEBUG": 
            window.showInformationMessage(`[DEBUG] ${msg}`);
            break;
    }
}

function getTimestamp(): string {
  return new Date().toISOString();
}
