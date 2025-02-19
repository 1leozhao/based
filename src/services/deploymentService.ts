import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';

interface CompilationOutput {
  contracts: {
    [file: string]: {
      [contract: string]: {
        abi: any[];
        evm: {
          bytecode: {
            object: string;
          };
        };
      };
    };
  };
  sources: {
    [file: string]: {
      id: number;
      ast: any;
    };
  };
}

export async function getAvailableContracts(code: string): Promise<string[]> {
  try {
    const response = await fetch('/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('Compilation failed');
    }

    const result = await response.json();
    console.log('Compilation result for contract list:', result);

    if (!result.contracts) {
      throw new Error('Invalid compilation result: missing contracts data');
    }

    // Handle the compilation output structure
    const contracts: string[] = [];
    
    // The contracts object is keyed by file name first
    for (const file in result.contracts) {
      const fileContracts = result.contracts[file];
      for (const contractName in fileContracts) {
        // Filter out .dbg files
        if (!contractName.endsWith('.dbg')) {
          contracts.push(contractName);
        }
      }
    }

    console.log('Found contracts:', contracts);
    return contracts;
  } catch (error) {
    console.error('Error getting contracts:', error);
    throw error;
  }
}

export async function deployContract(
  code: string,
  contractName: string,
  signer: ethers.Signer
): Promise<{ address: string; txHash: string }> {
  try {
    // Compile the contract
    const response = await fetch('/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Compilation failed');
    }

    const result = await response.json();
    console.log('Compilation result for deployment:', result);

    if (!result.contracts) {
      throw new Error('Invalid compilation result: missing contracts data');
    }

    // Find the contract data
    let contractData;
    let foundFile;

    // Search through all files
    for (const file in result.contracts) {
      if (result.contracts[file][contractName]) {
        contractData = result.contracts[file][contractName];
        foundFile = file;
        break;
      }
    }

    if (!contractData) {
      const availableContracts = Object.entries(result.contracts as Record<string, Record<string, any>>)
        .map(([file, contracts]) => Object.keys(contracts))
        .flat();
      throw new Error(`Contract ${contractName} not found in compilation output. Available contracts: ${availableContracts.join(', ')}`);
    }

    // Get ABI and bytecode
    const abi = contractData.abi;
    const bytecode = contractData.evm?.bytecode?.object;

    if (!abi || !bytecode) {
      console.error('Missing ABI or bytecode:', { abi, bytecode, contractData });
      throw new Error('Invalid contract data: missing ABI or bytecode');
    }

    console.log('Contract compilation successful:', {
      file: foundFile,
      name: contractName,
      abiLength: abi.length,
      bytecodeLength: bytecode.length
    });

    // Create contract factory
    const factory = new ethers.ContractFactory(abi, bytecode, signer);

    // Deploy the contract
    const deployedContract = await factory.deploy();
    
    // Wait for deployment to complete
    const receipt = await deployedContract.deploymentTransaction()?.wait();
    
    if (!receipt) {
      throw new Error('Deployment failed: No transaction receipt');
    }

    return {
      address: await deployedContract.getAddress(),
      txHash: receipt.hash,
    };
  } catch (error) {
    console.error('Deployment error:', error);
    throw error;
  }
} 