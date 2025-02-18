import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';
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

    return NextResponse.json({ message: 'Compilation successful', output: stdout });
  } catch (error) {
    console.error('Compilation error:', error);
    return NextResponse.json(
      { error: 'Compilation failed' },
      { status: 500 }
    );
  }
} 