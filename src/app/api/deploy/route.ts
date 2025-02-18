import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { code, network = 'base-sepolia' } = await request.json();

    // Write the code to a temporary file
    const tempFile = path.join(process.cwd(), 'hardhat/contracts/temp.sol');
    await writeFile(tempFile, code);

    // Compile the contract first
    await execAsync('cd hardhat && npx hardhat compile');

    // Deploy the contract
    const { stdout, stderr } = await execAsync(
      `cd hardhat && npx hardhat run scripts/deploy.ts --network ${network}`
    );

    if (stderr) {
      return NextResponse.json({ error: stderr }, { status: 400 });
    }

    return NextResponse.json({ message: 'Deployment successful', output: stdout });
  } catch (error) {
    console.error('Deployment error:', error);
    return NextResponse.json(
      { error: 'Deployment failed' },
      { status: 500 }
    );
  }
} 