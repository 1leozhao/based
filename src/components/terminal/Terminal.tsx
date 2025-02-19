import { useState, useRef, useEffect } from 'react';
import { useAccount, useBalance, usePublicClient, useWalletClient, useChainId, useConfig } from 'wagmi';
import { deployContract, getAvailableContracts } from '@/services/deploymentService';
import { useEditorStore } from '@/store/editorStore';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';

interface TerminalProps {
  isVisible: boolean;
  onResize: (height: number) => void;
}

interface TerminalCommand {
  command: string;
  output: string;
  isError?: boolean;
}

const MIN_TERMINAL_HEIGHT = 150; // Minimum height in pixels
const MAX_TERMINAL_HEIGHT = 500; // Maximum height in pixels

// Add Base Sepolia chain ID constant
const BASE_SEPOLIA_CHAIN_ID = 84532;

export default function Terminal({ isVisible, onResize }: TerminalProps) {
  const [commands, setCommands] = useState<TerminalCommand[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [terminalHeight, setTerminalHeight] = useState(256); // Default height (16rem = 256px)
  const [isResizing, setIsResizing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const { address } = useAccount();
  const config = useConfig();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { data: balance, isLoading: isBalanceLoading, error: balanceError } = useBalance({
    address,
    chainId,
  });
  const { code } = useEditorStore();

  // Get current chain from config
  const chain = config.chains.find(c => c.id === chainId);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commands]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newHeight = window.innerHeight - e.clientY;
        const clampedHeight = Math.min(Math.max(newHeight, MIN_TERMINAL_HEIGHT), MAX_TERMINAL_HEIGHT);
        setTerminalHeight(clampedHeight);
        onResize(clampedHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onResize]);

  useEffect(() => {
    // Initial setup of commands if needed
    setCommands([]);
  }, []); // Empty dependency array means this runs once on mount

  const handleCommand = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !currentCommand.trim()) return;

    const newCommand: TerminalCommand = {
      command: currentCommand,
      output: '',
    };

    // Process command - only make the command name lowercase, preserve args case
    const cmdParts = currentCommand.trim().split(' ');
    const cmd = cmdParts[0].toLowerCase();
    const args = cmdParts.slice(1);

    if (cmd === 'clear') {
      setCommands([]);
    } else if (cmd === 'help') {
      newCommand.output = `Available commands:
  help                    - Show this help message
  clear                   - Clear terminal
  balance                 - Show current wallet balance
  network                 - Show current network info
  deploy                  - List available contracts to deploy
  deploy <contract_name>  - Deploy specific contract (case-sensitive)`;
    } else if (cmd === 'balance') {
      if (!address) {
        newCommand.output = 'Wallet not connected';
        newCommand.isError = true;
      } else if (!chainId) {
        newCommand.output = 'Network not connected';
        newCommand.isError = true;
      } else if (isBalanceLoading) {
        newCommand.output = 'Loading balance...';
        newCommand.isError = true;
      } else if (balanceError) {
        newCommand.output = `Error fetching balance: ${balanceError.message}`;
        newCommand.isError = true;
      } else if (!balance) {
        newCommand.output = 'Unable to fetch balance';
        newCommand.isError = true;
      } else {
        const formattedBalance = parseFloat(balance.formatted).toFixed(4);
        newCommand.output = `Balance: ${formattedBalance} ${balance.symbol}
Network: ${chain?.name || 'Unknown'}
Address: ${address}`;
      }
    } else if (cmd === 'network') {
      try {
        if (!chain) {
          newCommand.output = 'Not connected to any network';
          newCommand.isError = true;
        } else {
          newCommand.output = `Network Info:
  Name: ${chain.name}
  Chain ID: ${chainId}
  ${chainId === BASE_SEPOLIA_CHAIN_ID ? '✓ Connected to Base Sepolia' : '⚠ Not connected to Base Sepolia'}
  RPC URL: ${chain.rpcUrls.default.http[0]}`;
        }
      } catch (error) {
        newCommand.output = `Error getting network info: ${error instanceof Error ? error.message : 'Unknown error'}`;
        newCommand.isError = true;
      }
    } else if (cmd === 'deploy') {
      try {
        if (!address) {
          newCommand.output = 'Please connect your wallet first';
          newCommand.isError = true;
        } else if (!walletClient) {
          newCommand.output = 'Wallet client not initialized. Please refresh the page and try again.';
          newCommand.isError = true;
        } else if (!chain) {
          newCommand.output = 'No network connection detected. Please check your wallet connection.';
          newCommand.isError = true;
        } else if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
          newCommand.output = `Wrong network detected (${chain.name}, Chain ID: ${chainId})
Please switch to Base Sepolia (Chain ID: ${BASE_SEPOLIA_CHAIN_ID})
Note: Make sure you're using Base Sepolia, not regular Sepolia network`;
          newCommand.isError = true;
        } else {
          // If no contract name provided, list available contracts
          if (args.length === 0) {
            const contracts = await getAvailableContracts(code);
            if (contracts.length === 0) {
              newCommand.output = 'No deployable contracts found in the current file';
              newCommand.isError = true;
            } else {
              newCommand.output = `Available contracts to deploy:
${contracts.map(name => `  ${name}`).join('\n')}

Deploy a specific contract with:
  deploy <contract_name>

Note: Contract names are case-sensitive`;
            }
          } else {
            const contractName = args[0]; // Use original case
            
            // Start deployment
            newCommand.output = `Starting deployment of contract "${contractName}"...\n`;
            setCommands(prev => [...prev, newCommand]);

            // Create ethers signer from wallet client
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            
            console.log('Using address:', await signer.getAddress()); // Debug log

            const { address: contractAddress, txHash } = await deployContract(code, contractName, signer);
            
            newCommand.output = `Deployment successful!
Contract: ${contractName}
Address: ${contractAddress}
Transaction Hash: ${txHash}

View on Explorer: https://sepolia.basescan.org/address/${contractAddress}`;
            
            toast.success('Contract deployed successfully!');
          }
        }
      } catch (error) {
        console.error('Deployment error:', error); // Debug log
        newCommand.output = `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        newCommand.isError = true;
        toast.error('Deployment failed');
      }
    } else {
      newCommand.output = `Command not found: ${cmd}. Type 'help' for available commands.`;
      newCommand.isError = true;
    }

    setCommands(prev => [...prev, newCommand]);
    setCurrentCommand('');
  };

  if (!isVisible) return null;

  return (
    <div 
      style={{ height: terminalHeight }}
      className="relative bg-[#1a1a1a] border-t border-[var(--border-color)] text-white"
    >
      {/* Resize Handle */}
      <div
        className="absolute top-0 left-0 right-0 h-1 cursor-row-resize bg-[var(--border-color)] hover:bg-[var(--primary-color)] transition-colors"
        onMouseDown={() => setIsResizing(true)}
      />
      
      {/* Terminal Header */}
      <div className="flex items-center px-4 py-2 bg-[#2a2a2a] border-b border-[var(--border-color)]">
        <span className="text-sm font-medium">Terminal</span>
        <div className="ml-auto flex items-center space-x-2">
          <button
            onClick={() => setCommands([])}
            className="p-1 rounded hover:bg-[#3a3a3a] text-[#999] hover:text-white transition-colors"
            title="Clear Terminal"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="h-[calc(100%-2.5rem)] overflow-auto p-4 font-mono text-sm"
        style={{
          backgroundImage: 'linear-gradient(to bottom, #1a1a1a 50%, #1f1f1f 50%)',
          backgroundSize: '100% 5px',
          backgroundAttachment: 'local'
        }}
      >
        {commands.map((cmd, i) => (
          <div key={i} className="mb-2">
            <div className="flex items-center">
              <span className="text-[var(--primary-color)]">$</span>
              <span className="ml-2 text-[#ccc]">{cmd.command}</span>
            </div>
            {cmd.output && (
              <div className={`mt-1 whitespace-pre-wrap ${
                cmd.isError ? 'text-red-500' : 'text-[#b4b4b4]'
              }`}>
                {cmd.output}
              </div>
            )}
          </div>
        ))}
        <div className="flex items-center">
          <span className="text-[var(--primary-color)]">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleCommand}
            className="flex-1 ml-2 bg-transparent outline-none text-white placeholder-[#666]"
            placeholder="Type 'help' for available commands"
          />
        </div>
      </div>
    </div>
  );
} 