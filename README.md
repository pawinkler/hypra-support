# Hypra Support

#### [Repository](https://github.com/pawinkler/hypra-support)&nbsp;&nbsp;|&nbsp;&nbsp;[Paper & Artifact](https://dl.acm.org/doi/10.1145/3689756)&nbsp;&nbsp;|&nbsp;&nbsp;[Code Samples](https://github.com/anqili426/hhl_frontend/tree/main/src/test)&nbsp;&nbsp;|&nbsp;&nbsp;[PMG at ETH Zurich](https://www.pm.inf.ethz.ch/)

**NOTE**: This extension is currently being developed and still unstable! 

The Hypra Support extension adds language support for Hypra / Hyper Hoare Logic to Visual Studio code. This includes a static syntax highlighting, static code completion and error handling. Futher, the extension contains a up-to-date instance of the [Hypra verifer](https://github.com/anqili426/hhl_frontend/), which allows direct verification of Hypra files.

This extension is part of the Hypra Verifier, which was developed by the [Programming Methodology Group (PMG)](https://www.pm.inf.ethz.ch/) at ETH Zurich.

## Pre-requisites
At the moment, Hypra Support requires very specific pre-requisites in order to be used. The Hypra extension **includes a Hypra instance**, but **does not include any external software**, like the verifiers Hypra relies on. You will need to install these tools or use those already installed on your computer.

 * [Java](https://dev.java/), version 17.*
 * [Boogie](https://www.microsoft.com/en-us/research/project/boogie-an-intermediate-verification-language/), version 2.15.8.0
 * [Z3 Theorem Prover](https://github.com/Z3Prover/z3), version 4.8.14

Using other versions is possible, but not tested. By default, Hypra uses the global installations, but paths can be updated in the settings. 

## Usage

There are two possible use cases supported: **In-file verification** and **manual verification**. By default, verification is attemtepted using the _--auto_ argument for rule selection.

**In-file verification**:

1. Install the Hypra Support extension in Visual Studio Code.
2. Open or create a Hypra file (.hhl).
3. Save the corresponding file to start the verification process.

**Manual Verification**:

1. Install the Hypra Support extension in Visual Studio Code.
2. Run the _Hypra: Verify File_ command.

### Commands

**Hypra: Verify File**:

- (No hypra file) Specify the path to corresponding Hypra file.
- Verification process starts and feedback is printed to the debug console.

### Settings

Hypra supports customizable settings, which allow you to adjust the behaviour of the Hypra instance which is running in the background.

This can be achieved by adjusting them in the VS Code settings. For example, you could change the Hypra path by:

1. Open the global VS Code settings (by >Preferences: Open Settings (UI))
2. Search for Hypra.
3. Adjust the corresponding setting.

**Note**: Entering faulty settings will lead to erronous behaviour in this case. More information can be found on Hypra's GitHub page.

## Hypra / HHL Documentation

At the moment, no documentation for Hypra / HHL exists. Information can be found in the [corresponding paper](https://dl.acm.org/doi/10.1145/3689756), on the website of the [Programming Methodology Group](https://www.pm.inf.ethz.ch/) at ETH Zurich, or in the provided [code examples](https://github.com/anqili426/hhl_frontend/tree/main/src/test).

## Contact 

If you have questions, you may reach us via the following contacts.

- **Extension**: Paul Winkler ([paul.winkler@inf.ethz.ch](mailto:paul.winkler@inf.ethz.ch))
- **Hypra Verifier**: Anqi Li ([anqi.li@inf.ethz.ch](mailto:anqi.li@inf.ethz.ch))
- **Programming Methodology Group at ETH Zurich**: Prof. Dr. Peter Müller ([peter.mueller@inf.ethz.ch](mailto:peter.mueller@inf.ethz.ch))
