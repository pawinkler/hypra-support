/**
 * This file contains all code required for the following commands:
 * - Hypra: Start Verification - Starts default verification process.
 * - Hypra: Start Verification with Arguments - Starts custom verification process.
 */

import { window } from "vscode";
import { broadcast, log } from "./logs";
import { verify } from "./verification";
import { fileIsHypra } from "./utils";

export async function startVerification() {
    const path = await getPath();
    if (!path) {
        broadcast("Failed to get file path of Hypra file!", "ERR");
        return;
    }

    verify(path);
}

async function getPath(): Promise<string | undefined> {
    const doc = window.activeTextEditor?.document;
    if (doc && fileIsHypra(doc)) {
        return doc.fileName;
    } else {
        return await window.showInputBox({
            prompt: "Please specify the absolute path to the Hypra file.",
        });
    }
}