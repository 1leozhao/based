export const getContractTemplate = (contractName: string): string => `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ${contractName} {
    // Your smart contract code here
}`;

export const getMarkdownTemplate = (title: string): string => `# ${title}

## Description

Add your description here.
`;

export const getJsonTemplate = (): string => `{
  
}`;

export const getTxtTemplate = (): string => '';

export const getDefaultContent = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

  switch (extension) {
    case 'sol':
      return getContractTemplate(nameWithoutExt);
    case 'md':
      return getMarkdownTemplate(nameWithoutExt);
    case 'json':
      return getJsonTemplate();
    case 'txt':
      return getTxtTemplate();
    default:
      return '';
  }
}; 