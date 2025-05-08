import { ConfigurationTarget, window, workspace } from "vscode";

/**
 * Activates the custom file icons for Hypra Support.
 */
export function activateFileIcons() {
    const config = workspace.getConfiguration('workbench');
    const theme = 'hypra-icons';

    const current = config.get<string>('iconTheme');
    if (current !== theme) {
        window.showInformationMessage(
        'Do you want to enable Hypra Support file icons?',
        'Yes', 'No'
        ).then(selection => {
        if (selection === 'Yes') {
            config.update('iconTheme', theme, ConfigurationTarget.Global);
        }
        });
    }
}