import * as vsc from "vscode";

export function fileIsHypraCode(document: vsc.TextDocument) {
    return document.languageId === 'hypra' && document.fileName.endsWith('.hhl')
}