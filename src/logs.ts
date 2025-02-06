import * as vsc from "vscode";

// Tunable parameters
const logName = "Hypra Logs";

// Main code
const outputChannel = vsc.window.createOutputChannel(logName);

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

function getTimestamp(): string {
  return new Date().toISOString();
}

export function log(level: LogLevel, message: string) {
  outputChannel.appendLine(`[${getTimestamp()}] [${level}] ${message}`);
}

export function clearLog() {
    outputChannel.clear();
}