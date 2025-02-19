import { NextResponse } from 'next/server';
import solc from 'solc';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Source code is required' }, { status: 400 });
    }

    // Prepare input for the Solidity compiler
    const input = {
      language: 'Solidity',
      sources: {
        'contract.sol': {
          content: code
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode']
          }
        },
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    };

    // Compile the contract
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    // Check for errors
    if (output.errors) {
      const errors = output.errors.filter((error: any) => error.severity === 'error');
      if (errors.length > 0) {
        return NextResponse.json({
          error: 'Compilation failed',
          details: errors
        }, { status: 400 });
      }
    }

    // Filter out unnecessary metadata and only return contract names with their ABI and bytecode
    const contracts = output.contracts['contract.sol'];
    const filteredContracts: { [key: string]: { abi: any; bytecode: string } } = {};

    for (const [name, contract] of Object.entries<any>(contracts)) {
      if (!name.includes(':') && !name.endsWith('.dbg')) {
        filteredContracts[name] = {
          abi: contract.abi,
          bytecode: contract.evm.bytecode.object
        };
      }
    }

    return NextResponse.json({ contracts: filteredContracts });
  } catch (error) {
    console.error('Compilation error:', error);
    return NextResponse.json(
      { error: 'Failed to compile contract' },
      { status: 500 }
    );
  }
} 