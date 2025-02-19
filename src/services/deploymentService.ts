'use client';

import { ethers } from 'ethers';
import { baseSepolia, base } from 'viem/chains';
import { toast } from 'react-hot-toast';
import { type FileNode } from '@/store/workspaceStore';

// Helper function to recursively find all Solidity files
const findSolidityFiles = (node: FileNode, path: string[] = []): Array<{ path: string[], content: string }> => {
  const files: Array<{ path: string[], content: string }> = [];

  if (node.type === 'file' && node.name.endsWith('.sol') && node.content) {
    files.push({ path: [...path, node.name], content: node.content });
  }

  if (node.children) {
    node.children.forEach(child => {
      files.push(...findSolidityFiles(child, [...path, node.name]));
    });
  }

  return files;
};

export const deployContract = async (
  sourceCode: string,
  contractName: string,
  signer: ethers.Signer
) => {
  try {
    // Check for browser environment and ethereum provider
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('This function can only be called in a browser environment with MetaMask installed');
    }

    // Get the current chain ID
    const network = await signer.provider?.getNetwork();
    const chainId = network?.chainId;

    // Validate network
    if (!chainId) {
      throw new Error('Unable to determine network');
    }

    if (chainId !== BigInt(baseSepolia.id) && chainId !== BigInt(base.id)) {
      throw new Error('Please connect to Base Sepolia or Base Mainnet');
    }

    // First compile the contract using browser-based compilation
    const response = await fetch('/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: sourceCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Compilation failed');
    }

    const result = await response.json();
    
    if (!result.contracts) {
      throw new Error('Invalid compilation result: missing contracts data');
    }

    // Find the contract data
    const contractData = result.contracts[contractName];

    if (!contractData) {
      throw new Error(`Contract ${contractName} not found in compilation output`);
    }

    // Get ABI and bytecode
    const abi = contractData.abi;
    const bytecode = contractData.bytecode;

    if (!abi || !bytecode) {
      throw new Error('Invalid contract data: missing ABI or bytecode');
    }

    // Deploy with progress notification
    const loadingToast = toast.loading('Deploying contract...');
    
    // Create contract factory with proper ABI and bytecode
    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    const deploymentTx = contract.deploymentTransaction();

    if (!deploymentTx) {
      throw new Error('Deployment transaction not found');
    }

    // Get explorer URL based on network
    const explorerUrl = chainId === BigInt(baseSepolia.id)
      ? 'https://sepolia.basescan.org'
      : 'https://basescan.org';

    toast.dismiss(loadingToast);
    toast.success(`Contract deployed! View on explorer: ${explorerUrl}/address/${contractAddress}`);

    return {
      address: contractAddress,
      txHash: deploymentTx.hash,
    };
  } catch (error) {
    console.error('Deployment error:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to deploy contract');
    throw error;
  }
};

export const getAvailableContracts = async (files: FileNode[]): Promise<Array<{ name: string, file: string }>> => {
  try {
    // Find all Solidity files in the workspace
    const solidityFiles = files.flatMap(node => findSolidityFiles(node));
    
    // Compile each file and collect all contracts
    const contracts: Array<{ name: string, file: string }> = [];
    const compilationPromises = solidityFiles.map(async (file) => {
      try {
        const response = await fetch('/api/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: file.content }),
        });

        if (!response.ok) {
          console.warn(`Failed to compile file: ${file.path.join('/')}`);
          return;
        }

        const result = await response.json();
        
        if (result.contracts) {
          // Get all contracts from this file
          for (const compiledFile in result.contracts) {
            for (const contractName in result.contracts[compiledFile]) {
              // Only add the contract name if it's a valid contract (not metadata or debug info)
              if (!contractName.includes(':') && !contractName.endsWith('.dbg')) {
                contracts.push({
                  name: contractName,
                  file: file.path.join('/')
                });
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Error compiling file ${file.path.join('/')}:`, error);
      }
    });

    // Wait for all compilations to complete
    await Promise.all(compilationPromises);

    // Sort contracts by file path and then by name
    return contracts.sort((a, b) => {
      const fileCompare = a.file.localeCompare(b.file);
      if (fileCompare !== 0) return fileCompare;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error getting contracts:', error);
    throw error;
  }
}; 