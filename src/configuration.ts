import { workspace } from "vscode";

/** Hypra Configuration Module: Handles all Hypra configuration related operations.
 * 
 * Functions:
 * - fetchConfiguration(): Fetches the Hypra configuration from the workspace.
 * 
 * Variables:
 * - hypraConfig: The Hypra configuration object.
 */

/** Hypra Configuration Type */
type HypraConfigT = {
    javaPath: string | undefined,
    boogiePath: string | undefined,
    z3Path: string | undefined,
    hypraPath: string | undefined,
    saveViperEncoding: boolean | undefined,
    forallEncoding: boolean | undefined,
    existsEncoding: boolean | undefined,
    noFrame: boolean | undefined,
    existsFrame: boolean | undefined,
    auto: boolean | undefined,
    inline: boolean | undefined
}

export const hypraConfig: HypraConfigT = {
    javaPath: undefined,
    boogiePath: undefined,
    z3Path: undefined,
    hypraPath: undefined,
    saveViperEncoding: undefined,
    forallEncoding: undefined,
    existsEncoding: undefined,
    noFrame: undefined,
    existsFrame: undefined,
    auto: undefined,
    inline: undefined
};

export function fetchConfiguration() {
    const config = workspace.getConfiguration('hypra-support');

    hypraConfig.javaPath = config.get<string>('requisites.javaPath');
    hypraConfig.boogiePath = config.get<string>('requisites.boogiePath');
    hypraConfig.z3Path = config.get<string>('requisites.z3Path');
    hypraConfig.hypraPath = config.get<string>('requisites.hypraPath');
    hypraConfig.saveViperEncoding = config.get<boolean>('verifierOptions.saveViperEncoding');
    hypraConfig.forallEncoding = config.get<boolean>('verifierOptions.forallEncoding');
    hypraConfig.existsEncoding = config.get<boolean>('verifierOptions.existsEncoding');
    hypraConfig.noFrame = config.get<boolean>('verifierOptions.noFrame');
    hypraConfig.existsFrame = config.get<boolean>('verifierOptions.existsFrame');
    hypraConfig.auto = config.get<boolean>('verifierOptions.auto');
    hypraConfig.inline = config.get<boolean>('verifierOptions.inline');
}