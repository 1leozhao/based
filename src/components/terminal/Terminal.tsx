'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount, useBalance, useWalletClient, useChainId, useConfig } from 'wagmi';
import { deployContract, getAvailableContracts } from '@/services/deploymentService';
import { useWorkspaceStore, type FileNode } from '@/store/workspaceStore';
import { ethers } from 'ethers';

interface TerminalCommand {
  input: string;
  output: string;
  isError: boolean;
}

interface TerminalProps {
  isVisible: boolean;
  onResize: (height: number) => void;
}

const MIN_TERMINAL_HEIGHT = 150; // Minimum height in pixels
const MAX_TERMINAL_HEIGHT = 500; // Maximum height in pixels

// Add Base Sepolia chain ID constant
const BASE_SEPOLIA_CHAIN_ID = 84532;

export default function Terminal({ isVisible, onResize }: TerminalProps) {
  const [mounted, setMounted] = useState(false);
  const [commands, setCommands] = useState<TerminalCommand[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { address } = useAccount();
  const config = useConfig();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { data: balance, isLoading: isBalanceLoading, error: balanceError } = useBalance(
    mounted && address ? {
      address,
      chainId,
    } : undefined
  );

  // Get current chain from config
  const chain = config.chains.find(c => c.id === chainId);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isVisible && inputRef.current && mounted) {
      inputRef.current.focus();
    }
  }, [isVisible, mounted]);

  useEffect(() => {
    if (terminalRef.current && mounted) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commands, mounted]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const terminalRect = terminalRef.current?.getBoundingClientRect();
        if (!terminalRect) return;

        const mouseY = e.clientY;
        const terminalBottom = terminalRect.bottom;
        const newHeight = terminalBottom - mouseY;
        const clampedHeight = Math.min(Math.max(newHeight, MIN_TERMINAL_HEIGHT), MAX_TERMINAL_HEIGHT);
        
        onResize?.(clampedHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onResize]);

  useEffect(() => {
    if (contentRef.current && mounted) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [currentCommand, commands, mounted]);

  const handleCommand = async (cmd: string) => {
    const newCommand: TerminalCommand = {
      input: cmd,
      output: '',
      isError: false,
    };

    try {
      if (cmd === 'help') {
        newCommand.output = `Available commands:
  help              - Show this help message
  clear             - Clear the terminal
  balance           - Show wallet balance
  network           - Show current network information
  deploy            - List deployable contracts
  deploy <name>     - Deploy specific contract to current network
  networks          - List available networks`;
      } else if (cmd === 'clear') {
        setCommands([]);
        return; // Don't add the clear command to history
      } else if (cmd === 'networks') {
        newCommand.output = `Available networks:
1. Base Sepolia (testnet)
   Chain ID: ${BASE_SEPOLIA_CHAIN_ID}
   RPC URL: ${chain?.rpcUrls.default.http[0]}

2. Base Mainnet
   Chain ID: ${config.chains.find(c => c.id === config.chains[0].id)?.id}
   RPC URL: ${config.chains.find(c => c.id === config.chains[0].id)?.rpcUrls.default.http[0]}

Current network: ${chain?.name || 'Not connected'}`;
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
        if (!chain) {
          newCommand.output = 'Not connected to any network';
          newCommand.isError = true;
        } else {
          newCommand.output = `Network Info:
Name: ${chain.name}
Chain ID: ${chainId}
Network Type: ${chainId === BASE_SEPOLIA_CHAIN_ID ? 'Testnet' : 'Unknown'}
RPC URL: ${chain.rpcUrls.default.http[0]}`;
        }
      } else if (cmd.startsWith('deploy')) {
        if (!address) {
          newCommand.output = 'Please connect your wallet first';
          newCommand.isError = true;
        } else if (!walletClient) {
          newCommand.output = 'Wallet client not initialized. Please refresh the page and try again.';
          newCommand.isError = true;
        } else if (!chain) {
          newCommand.output = 'No network connection detected. Please check your wallet connection.';
          newCommand.isError = true;
        } else {
          try {
            const { workspaces, activeWorkspace } = useWorkspaceStore.getState();
            const workspace = workspaces.find(w => w.name === activeWorkspace);
            
            if (!workspace) {
              throw new Error('No active workspace found');
            }

            const contracts = await getAvailableContracts(workspace.files);
            const args = cmd.split(' ').slice(1);
            
            if (args.length === 0) {
              // Just list available contracts
              if (contracts.length === 0) {
                newCommand.output = 'No deployable contracts found in any Solidity files';
                newCommand.isError = true;
              } else {
                // Group contracts by file
                const contractsByFile: { [key: string]: string[] } = {};
                contracts.forEach(({ file }) => {
                  // If file is in root (no slashes), just use filename
                  // Otherwise, use the full path
                  const key = file.includes('/') ? file.split('/').slice(0, -1).join('/') + '/' : '';
                  const fileName = file.split('/').pop() || '';
                  
                  if (!contractsByFile[key]) {
                    contractsByFile[key] = [];
                  }
                  contractsByFile[key].push(fileName);
                });

                // Format the output
                const filesList = Object.entries(contractsByFile)
                  .map(([path, files]) => {
                    if (path === '') {
                      // Root files
                      return files.join('\n');
                    } else {
                      // Files in folders
                      return `${path}:\n      ${files.join('\n      ')}`;
                    }
                  })
                  .join('\n\n');

                newCommand.output = `Available Solidity files:\n${filesList}\n\nDeploy a contract with:\n  deploy <filename.sol>`;
              }
            } else {
              // Deploy specific contract
              const fileName = args[0];
              
              // Check if the file name has .sol extension
              if (!fileName.endsWith('.sol')) {
                newCommand.output = 'Please provide the full filename with .sol extension (e.g., deploy Test.sol)';
                newCommand.isError = true;
                setCommands(prev => [...prev, newCommand]);
                setCurrentCommand('');
                return;
              }

              // Find all contracts in the specified file
              const fileContracts = contracts.filter(c => {
                // For files in root directory
                if (!c.file.includes('/')) {
                  return c.file === fileName;
                }
                // For files in subdirectories
                return c.file.endsWith('/' + fileName);
              });
              
              if (fileContracts.length === 0) {
                // Format available files to show full paths
                const availableFiles = contracts.map(c => c.file).sort().join('\n');
                newCommand.output = `File "${fileName}" not found. Available Solidity files:\n${availableFiles}`;
                newCommand.isError = true;
              } else if (fileContracts.length === 1) {
                // If there's only one contract in the file, deploy it automatically
                const contract = fileContracts[0];
                const findFileContent = (node: FileNode, path: string[]): string | null => {
                  if (node.type === 'file' && [...path, node.name].join('/') === contract.file) {
                    return node.content || null;
                  }
                  if (node.children) {
                    for (const child of node.children) {
                      const content = findFileContent(child, [...path, node.name]);
                      if (content) return content;
                    }
                  }
                  return null;
                };

                const fileContent = workspace.files.reduce<string | null>((content, node) => {
                  return content || findFileContent(node, []);
                }, null);

                if (!fileContent) {
                  throw new Error(`Could not find content for file: ${contract.file}`);
                }

                newCommand.output = `Deploying ${contract.name} from ${fileName} to ${chain.name}...`;
                setCommands(prev => [...prev, { ...newCommand }]);

                // Add check for ethereum provider
                if (typeof window === 'undefined' || !window.ethereum) {
                  throw new Error('MetaMask not detected. Please install MetaMask and try again.');
                }

                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                
                const { address: contractAddress, txHash } = await deployContract(
                  fileContent,
                  contract.name,
                  signer
                );
                
                const explorerUrl = chainId === BASE_SEPOLIA_CHAIN_ID
                  ? 'https://sepolia.basescan.org'
                  : 'https://basescan.org';

                newCommand.output = `Deployment successful!
Contract: ${contract.name}
Address: ${contractAddress}
Transaction: ${explorerUrl}/tx/${txHash}`;
              } else {
                // Multiple contracts in the file, show them and ask user to specify
                const contractNames = fileContracts.map(c => c.name).join('\n  ');
                newCommand.output = `Multiple contracts found in ${fileName}:
${contractNames}

Please specify which contract to deploy using its name:
  deploy <contract_name>`;
                newCommand.isError = true;
              }
            }
          } catch (error) {
            console.error('Command error:', error);
            newCommand.output = error instanceof Error ? error.message : 'An unknown error occurred';
            newCommand.isError = true;
          }
        }
      } else {
        newCommand.output = `Command not found: ${cmd}. Type 'help' for available commands.`;
        newCommand.isError = true;
      }
    } catch (error) {
      console.error('Command error:', error);
      newCommand.output = error instanceof Error ? error.message : 'An unknown error occurred';
      newCommand.isError = true;
    }

    setCommands(prev => [...prev, newCommand]);
    setCurrentCommand('');
  };

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentCommand(e.target.value);
  };

  const handleClear = () => {
    setCommands([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!mounted) return null;

  return (
    <div 
      ref={terminalRef}
      className="h-full flex flex-col bg-[#1a1a1a] text-white"
    >
      {/* Resize Handle */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] cursor-row-resize z-50 hover:z-[100] group"
        onMouseDown={handleResizeStart}
      >
        <div className="absolute inset-0 bg-[var(--primary-color)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      {/* Terminal Header */}
      <div className="flex items-center px-4 py-2 bg-[#2a2a2a] border-b border-[var(--border-color)]">
        <span className="text-sm font-medium">Terminal</span>
        <div className="ml-auto flex items-center space-x-2">
          <button
            onClick={handleClear}
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
        ref={contentRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm"
        onClick={() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }}
      >
        {commands.map((cmd, i) => (
          <div key={i} className="mb-2">
            <div className="flex items-center text-[var(--primary-color)]">
              <span>$</span>
              <span className="ml-2">{cmd.input}</span>
            </div>
            {cmd.output && (
              <div className={`mt-1 whitespace-pre-wrap ${cmd.isError ? 'text-red-500' : 'text-white'}`}>
                {cmd.output}
              </div>
            )}
          </div>
        ))}

        {/* Input Line */}
        <div className="flex items-center text-[var(--primary-color)]">
          <span>$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={handleCommandChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && currentCommand.trim()) {
                handleCommand(currentCommand.trim());
              }
            }}
            className="flex-1 ml-2 bg-transparent outline-none text-white placeholder-[#666]"
            placeholder="Type 'help' for available commands"
            spellCheck={false}
            autoComplete="off"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
} 