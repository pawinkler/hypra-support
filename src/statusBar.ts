import { StatusBarAlignment, StatusBarItem, window } from "vscode";

/** Status Bar Module: Handles all status bar-related operations.
 * 
 * Functions:
 * - create(): Creates a new status bar item and sets its initial state.
 * - destroy(): Destroys the status bar item.
 * - setInitialState(): Sets the status bar item to its initial state.
 * - setVerificationState(): Sets the status bar item to the verification state.
 * - setErrorState(): Sets the status bar item to the error state.
 * - setSuccessState(): Sets the status bar item to the success state. 
 */

/** Status Bar variable */
let statusBar: StatusBarItem | undefined = undefined;
/** Alternation variable for the verification state */
let alternation = false;
/** Interval variable for the verification state */
let interval: NodeJS.Timeout | undefined = undefined;

export function create() {
    statusBar = window.createStatusBarItem(StatusBarAlignment.Left);
    statusBar.name = "Hypra Verification Indicator";
    statusBar.command = "hypra-support.verifyFile";
    setInitialState();
}

export function destroy() {
    if (!statusBar) { return; }

    statusBar.hide();
}

export function setInitialState() {
    if (!statusBar) { return; }

    statusBar.text = "Hypra: Activation successful. Start verification?";
    statusBar.show();
}

export function setVerificationState() {
    if (!statusBar) { return; }

    statusBar.text = "Hypra: Verification is in progress |";
    statusBar.color = "#ffd000";
    statusBar.show();

    if (interval) { return; }

    interval = setInterval(() => {
        if (!statusBar) { return; }

        statusBar.text = "Hypra: Verification is running " + (alternation ? "|" : "-");
        alternation = !alternation;
        statusBar.show();

    }, 500);
}

export function setErrorState() {
    if (statusBar) {
        if (interval) {
            clearInterval(interval);
            interval = undefined;
        }
        statusBar.text = "Hypra: Verification failed! Click to retry.";
        statusBar.color = "#fc6262";
        statusBar.show();
    }
}

export function setSuccessState() {
    if (statusBar) {
        if (interval) {
            clearInterval(interval);
            interval = undefined;
        }
        statusBar.text = "Hypra: Verification successful!";
        statusBar.color = "#19e35c";
        statusBar.show();
    }
}