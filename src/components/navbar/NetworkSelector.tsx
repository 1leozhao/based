'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount, useChainId, useConnect } from 'wagmi';
import { baseSepolia, base } from 'viem/chains';
import { injected } from 'wagmi/connectors';

export default function NetworkSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const chainId = useChainId();
  const { connect } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNetworkSwitch = (targetChainId: number) => {
    if (isConnected) {
      connect({
        connector: injected({ target: 'metaMask' }),
        chainId: targetChainId,
      });
    }
    setIsOpen(false);
  };

  const getCurrentNetwork = () => {
    if (!isConnected) return '';
    if (chainId === baseSepolia.id) return 'Base Sepolia';
    if (chainId === base.id) return 'Base Mainnet';
    return 'Unknown Network';
  };

  if (!mounted) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        title="Select Network"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        {getCurrentNetwork() && <span className="text-sm">{getCurrentNetwork()}</span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-[var(--navbar-bg)] border border-[var(--border-color)] z-50">
          <div className="py-1">
            <button
              className={`w-full px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] flex items-center justify-between ${
                chainId === baseSepolia.id ? 'text-[var(--primary-color)]' : ''
              }`}
              onClick={() => handleNetworkSwitch(baseSepolia.id)}
              disabled={!isConnected}
            >
              <span>Base Sepolia</span>
              {chainId === baseSepolia.id && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              className={`w-full px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] flex items-center justify-between ${
                chainId === base.id ? 'text-[var(--primary-color)]' : ''
              }`}
              onClick={() => handleNetworkSwitch(base.id)}
              disabled={!isConnected}
            >
              <span>Base Mainnet</span>
              {chainId === base.id && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 