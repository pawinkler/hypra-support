import * as vsc from "vscode";

export function sendNotification(text: string) {
    vsc.window.showInformationMessage(text);
}

export function greetUser() {
    sendNotification("Welcome to Hypra, a automatic verifier for Hyper Hoare Logic!");
}