'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount, useChainId, useConnect } from 'wagmi';
import { baseSepolia, base } from 'viem/chains';
import { injected } from 'wagmi/connectors';

export default function Settings() {
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

  if (!mounted) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-[var(--navbar-bg)] border border-[var(--border-color)] z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-400">Network</div>
            <button
              className={`w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 flex items-center ${chainId === baseSepolia.id ? 'text-blue-400' : ''}`}
              onClick={() => handleNetworkSwitch(baseSepolia.id)}
              disabled={!isConnected}
            >
              <span>Base Sepolia</span>
              {chainId === baseSepolia.id && (
                <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              className={`w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 flex items-center ${chainId === base.id ? 'text-blue-400' : ''}`}
              onClick={() => handleNetworkSwitch(base.id)}
              disabled={!isConnected}
            >
              <span>Base Mainnet</span>
              {chainId === base.id && (
                <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <hr className="my-1 border-[var(--border-color)]" />
            
            <div className="px-4 py-2 text-sm text-gray-400">Theme</div>
            <button
              className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 flex items-center"
              onClick={() => setIsOpen(false)}
            >
              <span>Dark</span>
              <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 