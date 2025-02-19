import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, readdir } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    // Write the code to a temporary file
    const tempFile = path.join(process.cwd(), 'hardhat/contracts/temp.sol');
    await writeFile(tempFile, code);

    // Compile the contract
    const { stdout, stderr } = await execAsync('cd hardhat && npx hardhat compile');

    if (stderr) {
      return NextResponse.json({ error: stderr }, { status: 400 });
    }

    // Find all compiled contracts in the artifacts directory
    const artifactsDir = path.join(process.cwd(), 'hardhat/artifacts/contracts/temp.sol');
    const files = await readdir(artifactsDir);
    const contractFiles = files.filter(f => f.endsWith('.json'));

    // Read all contract artifacts
    const contracts: any = {};
    for (const file of contractFiles) {
      const artifactPath = path.join(artifactsDir, file);
      const artifactData = await readFile(artifactPath, 'utf8');
      const compiledContract = JSON.parse(artifactData);
      const contractName = path.basename(file, '.json');

      if (!contracts['temp.sol']) {
        contracts['temp.sol'] = {};
      }

      contracts['temp.sol'][contractName] = {
        abi: compiledContract.abi,
        evm: {
          bytecode: {
            object: compiledContract.bytecode
          }
        }
      };
    }

    return NextResponse.json({
      message: 'Compilation successful',
      output: stdout,
      contracts
    });
  } catch (error) {
    console.error('Compilation error:', error);
    return NextResponse.json(
      { error: 'Compilation failed' },
      { status: 500 }
    );
  }
} 