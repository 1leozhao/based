'use client';

import Link from 'next/link';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import Menu from './Menu';
import Settings from './Settings';
import { useEditorStore } from '@/store/editorStore';
import { useKeyboardShortcuts } from '@/utils/shortcuts';
import { useRef, useState, useEffect } from 'react';
import { useViewStore } from '@/store/viewStore';

export default function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { newFile, saveFile, undo, redo, compile, deploy, openFile } = useEditorStore();
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
    setMounted(true);
  }, []);

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
    if (file) {
      await openFile(file);
      event.target.value = ''; // Reset input
    }
  };

  const fileMenuItems = [
    { label: 'New File', shortcut: '⌘N', onClick: newFile },
    { label: 'Open File...', shortcut: '⌘O', onClick: handleFileOpen },
    { label: 'Save', shortcut: '⌘S', onClick: saveFile },
    { divider: true as const },
    { label: 'Compile', shortcut: '⌘B', onClick: compile },
    { label: 'Deploy', shortcut: '⌘⇧D', onClick: deploy },
  ];

  const editMenuItems = [
    { label: 'Undo', shortcut: '⌘Z', onClick: undo },
    { label: 'Redo', shortcut: '⌘⇧Z', onClick: redo },
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

  const helpMenuItems = [
    { label: 'Documentation' },
    { label: 'Keyboard Shortcuts', shortcut: '⌘K ⌘S' },
    { divider: true as const },
    { label: 'About Based' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-[var(--navbar-bg)] border-b border-[var(--border-color)] z-50">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".sol"
        onChange={handleFileChange}
      />
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-xl font-bold text-gradient">
            Based
          </Link>
          <div className="hidden md:flex space-x-2">
            <Menu label="File" items={fileMenuItems} />
            <Menu label="Edit" items={editMenuItems} />
            <Menu label="View" items={viewMenuItems} />
            <Menu label="Help" items={helpMenuItems} />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {mounted && (
            <button 
              className="px-4 py-1.5 rounded-lg bg-[var(--primary-color)] hover:bg-blue-600 transition-colors"
              onClick={handleConnection}
            >
              {isConnected ? displayAddress : 'Connect MetaMask'}
            </button>
          )}
          <Settings />
        </div>
      </div>
    </nav>
  );
} 