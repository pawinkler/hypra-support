import { ConfigurationChangeEvent, TextDocument } from "vscode";
import { verify } from "./verification";
import * as statusBar from "./statusBar";
import { notify } from "./logs";

/** Event Module: Handles all event related operations.
 * 
 * Functions:
 * - saveDocument(doc: TextDocument): Event handler for saving a document.
 * - openDocument(doc: TextDocument): Event handler for opening a document.
 * - changeConfiguration(event: ConfigurationChangeEvent): Event handler for configuration changes.
 * - fileIsHypra(doc: TextDocument): Checks if the provided document is a Hypra document.
 */

/** Event handler for saving a document
 * 
 * @param doc The document that was saved
 * 
 * This function is called whenever a document is saved. If the document is a Hypra document, it triggers the verification process.
 */
export function saveDocument(doc: TextDocument) {
    if (fileIsHypra(doc)) {
        verify(doc.fileName);
    }
}

/** Event handler for opening a document
 *  
 * @param doc The document that was opened
 * 
 * This function is called whenever a document is opened. If the document is a Hypra document, it resets the status bar.
 */
export function openDocument(doc: TextDocument) {
    if (fileIsHypra(doc)) {
        statusBar.setInitialState();
    } else {
        statusBar.destroy();
    }
}

/** Event handler for configuration changes
 * 
 * @param event The configuration change event
 * 
 * This function is called whenever a configuration change is detected. It notifies the user that the new settings will be automatically applied.
 */
export function changeConfiguration(event: ConfigurationChangeEvent) {
    if (event.affectsConfiguration('hypra-support')) {
        notify("Hypra: A configuration change was detected. The new settings will be automatically applied.");
    }
}

/** Checks if the provided document is a Hypra document
 * 
 * @param doc The document to check
 * @returns True if the document is a Hypra document
 */
export function fileIsHypra(doc: TextDocument) {
    return doc.languageId === 'hypra' && doc.fileName.endsWith('.hhl');
}