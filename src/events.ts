import { TextDocument } from "vscode";
import { fileIsHypra } from "./utils";
import { verify } from "./verification";
import { clearLog, showLog, log } from "./logs";

export function saveDocument(doc: TextDocument) {
    if (fileIsHypra(doc)) {
        verify(doc.fileName);
    }
}

export function openDocument(doc: TextDocument) {
    if (fileIsHypra(doc)) {
        showLog();
        clearLog();
        log("Hypra Support is now active. Sytnax Highlighting, static code completion and automatic verification is available.");
        log("This application relies on:\n- Java 17.*\n- Boogie 2.15.8.0\n- z3 4.8.14. \nUsing other versions is possible, but not recommended and happens at the risk of the user.");
        log("To start verification process on a Hypra (.hhl) file: Save the current file or use the command Hypra: Start Verification.");
    }
}