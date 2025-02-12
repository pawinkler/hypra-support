import { TextDocument } from "vscode";

export function fileIsHypra(doc: TextDocument) {
    return doc.languageId === 'hypra' && doc.fileName.endsWith('.hhl');
}