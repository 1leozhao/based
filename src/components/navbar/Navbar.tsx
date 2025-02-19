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
  const { activeFileId, newFile, openFile, saveFile, undo, redo, compile, deploy } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  const {
    toggleExplorer,
    toggleSearch,
    toggleProblems,
    toggleCommandPalette,
  } = useViewStore();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    if (address) {
      setMounted(true);
    }
  }, [address]);

  const displayAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const handleConnection = () => {
    if (isConnected) {
      disconnect();
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
    openFile(file.name, content);
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

  const handleDeploy = async () => {
    if (activeFileId) {
      await deploy();
    }
  };

  const fileMenuItems = [
    { label: 'New File', shortcut: '⌘N', onClick: newFile },
    { label: 'Open File...', shortcut: '⌘O', onClick: handleFileOpen },
    { label: 'Save', shortcut: '⌘S', onClick: handleSave },
    { divider: true as const },
    { label: 'Compile', shortcut: '⌘B', onClick: handleCompile },
    { label: 'Deploy', shortcut: '⌘⇧D', onClick: handleDeploy },
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
          <Link href="/" className="text-xl font-bold text-[var(--primary-color)]">
            Based
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
          <button
            onClick={handleConnection}
            className="px-4 py-2 rounded-lg bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color-hover)] transition-colors"
          >
            {isConnected && mounted ? displayAddress : 'Connect Wallet'}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".sol,.md,.txt,.json"
      />
    </nav>
  );
} 