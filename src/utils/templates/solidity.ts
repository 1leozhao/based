export const getSolidityTemplate = (contractName: string): string => `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ${contractName} {
    // Your smart contract code here
}`; 