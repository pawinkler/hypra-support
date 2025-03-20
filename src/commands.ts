import { window } from "vscode";
import { broadcast, log } from "./logs";
import { verify } from "./verification";
import { fileIsHypra } from "./events";
import * as statusBar from "./statusBar";

/** Command Module: Handles all command related operations.
 * 
 * Functions:
 * - startVerification(): Starts the verification process.
 */

export async function startVerification() {
    const path = await getPath();
    if (!path) { return; }

    verify(path);
}

async function getPath(): Promise<string | undefined> {
    const doc = window.activeTextEditor?.document;
    if (doc && fileIsHypra(doc)) {
        return doc.fileName;
    } else {
        try {
            return await window.showInputBox({ prompt: "Please specify the absolute path to the Hypra file." });
        } catch (error) {
            broadcast("Failed to get file path of Hypra file!", "ERR");
            statusBar.setErrorState();
            return undefined;
        }
    }
}