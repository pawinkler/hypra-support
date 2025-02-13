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

Using other versions is possible, but not tested. At the moment, only the system-wide installations can be used.

## Usage

There are two possible use cases supported: **In-file verification** and **manual verification**. By default, verification is attemtepted using the _--auto_ argument for rule selection.

**In-file verification**:

1. Install the Hypra Support extension in Visual Studio Code.
2. Open or create a Hypra file (.hhl).
3. Save the corresponding file to start the verification process.

**Manual Verification**:

1. Install the Hypra Support extension in Visual Studio Code.
2. Run the _Hypra: Start Verification_ or the _Hypra: Start Verification with Arguments_ command.

### Commands

These commands are supported. 

**Hypra: Start Verification**:

- (No hypra file) Specify the path to corresponding Hypra file.
- Verification process starts and feedback is printed to the debug console.

**Hypra: Start Verification with Arguments**:

- (No hypra file) Specify the path to corresponding Hypra file.
- Specify all arguments needed for verifying a Hypra file from the console (except file path).
- Verification process starts and feedback is printed to the debug console.

Note: Failing to specify correct arguments will lead to erronous behaviour in this case.

## Hypra / HHL Documentation

At the moment, no documentation for Hypra / HHL exists. Information can be found in the [corresponding paper](https://dl.acm.org/doi/10.1145/3689756), on the website of the [Programming Methodology Group](https://www.pm.inf.ethz.ch/) at ETH Zurich, or in the provided [code examples](https://github.com/anqili426/hhl_frontend/tree/main/src/test).

## Contact 

If you have questions, you may reach us via the following contacts.

- **Extension**: Paul Winkler ([paul.winkler@inf.ethz.ch](mailto:paul.winkler@inf.ethz.ch))
- **Hypra Verifier**: Anqi Li ([anqi.li@inf.ethz.ch](mailto:anqi.li@inf.ethz.ch))
- **Programming Methodology Group at ETH Zurich**: Prof. Dr. Peter Müller ([peter.mueller@inf.ethz.ch](mailto:peter.mueller@inf.ethz.ch))
