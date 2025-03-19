import { TextDocument } from "vscode";
import { fileIsHypra } from "./utils";
import { barRemove, barSetInitial, verify } from "./verification";
import { clearLog, showLog, log } from "./logs";

export function saveDocument(doc: TextDocument) {
    if (fileIsHypra(doc)) {
        verify(doc.fileName);
    }
}

export function openDocument(doc: TextDocument) {
    if (fileIsHypra(doc)) {
        barSetInitial();
    } else {
        barRemove();
    }
}