'use client';

import Link from 'next/link';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import Menu from './Menu';
import NetworkSelector from './NetworkSelector';
import { useEditorStore } from '@/store/editorStore';
import { useKeyboardShortcuts } from '@/utils/shortcuts';
import { useRef, useState, useEffect } from 'react';
import { useViewStore } from '@/store/viewStore';
import BaseLogo from '@/assets/base-logo.svg';
import Image from 'next/image';

export default function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { activeFileId, newFile, openFile, saveFile, undo, redo, compile } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const walletButtonRef = useRef<HTMLDivElement>(null);

  const {
    toggleExplorer,
    toggleSearch,
    toggleProblems,
    toggleCommandPalette,
  } = useViewStore();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (walletButtonRef.current && !walletButtonRef.current.contains(event.target as Node)) {
        setShowDisconnect(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const handleWalletClick = () => {
    if (isConnected) {
      setShowDisconnect(!showDisconnect);
    } else {
      connect({ connector: injected({ target: 'metaMask' }) });
    }
  };

  const handleFileOpen = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    const fileName = file.name;
    
    // Add file to workspace and open it
    openFile(fileName, content);
  };

  const handleSave = () => {
    if (activeFileId) {
      saveFile(activeFileId);
    }
  };

  const handleUndo = () => {
    if (activeFileId) {
      undo(activeFileId);
    }
  };

  const handleRedo = () => {
    if (activeFileId) {
      redo(activeFileId);
    }
  };

  const handleCompile = async () => {
    if (activeFileId) {
      await compile();
    }
  };

  const fileMenuItems = [
    { label: 'New File', shortcut: '⌘N', onClick: newFile },
    { label: 'Open File...', shortcut: '⌘O', onClick: handleFileOpen },
    { label: 'Save', shortcut: '⌘S', onClick: handleSave },
    { divider: true as const },
    { label: 'Compile', shortcut: '⌘B', onClick: handleCompile },
  ];

  const editMenuItems = [
    { label: 'Undo', shortcut: '⌘Z', onClick: handleUndo },
    { label: 'Redo', shortcut: '⌘⇧Z', onClick: handleRedo },
    { divider: true as const },
    { label: 'Cut', shortcut: '⌘X' },
    { label: 'Copy', shortcut: '⌘C' },
    { label: 'Paste', shortcut: '⌘V' },
  ];

  const viewMenuItems = [
    { label: 'Command Palette...', shortcut: '⌘⇧P', onClick: toggleCommandPalette },
    { divider: true as const },
    { label: 'Explorer', shortcut: '⌘⇧E', onClick: toggleExplorer },
    { label: 'Search', shortcut: '⌘⇧F', onClick: toggleSearch },
    { label: 'Problems', shortcut: '⌘⇧M', onClick: toggleProblems },
  ];

  if (!mounted) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-[var(--navbar-bg)] border-b border-[var(--border-color)] z-50">
      <div className="h-full flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/based.png"
              alt="Based Logo"
              width={32}
              height={32}
              className="rounded"
            />
          </Link>
          <div className="flex space-x-2">
            <Menu label="File" items={fileMenuItems} />
            <Menu label="Edit" items={editMenuItems} />
            <Menu label="View" items={viewMenuItems} />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center px-3 py-1.5 bg-[#0052FF]/10 rounded-lg">
            <Image
              src={BaseLogo}
              alt="Base Logo"
              width={20}
              height={20}
              className="mr-2"
            />
            <span className="text-sm font-medium text-[#0052FF]">Built on Base</span>
          </div>

          <NetworkSelector />
          <div className="relative" ref={walletButtonRef}>
            <button
              onClick={handleWalletClick}
              className="px-4 py-2 rounded-lg bg-[var(--primary-color)] text-white transition-colors hover:opacity-90 hover:bg-[var(--primary-color)]"
            >
              {isConnected && mounted ? displayAddress : 'Connect Wallet'}
            </button>
            
            {showDisconnect && isConnected && (
              <div className="absolute right-0 mt-[44px] inline-flex rounded-md shadow-lg bg-[var(--navbar-bg)] border border-[var(--border-color)] z-50">
                <button
                  onClick={() => {
                    disconnect();
                    setShowDisconnect(false);
                  }}
                  className="px-4 py-2 text-sm whitespace-nowrap text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  title="Disconnect Wallet"
                >
                  Disconnect Wallet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".sol,.md,.txt,.json,.js,.ts"
      />
    </nav>
  );
} 