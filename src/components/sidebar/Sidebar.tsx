'use client';

import { useState } from 'react';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState('files');

  return (
    <div className="fixed left-0 top-14 bottom-0 flex">
      {/* Activity Bar */}
      <div className="w-14 bg-[var(--navbar-bg)] border-r border-[var(--border-color)] flex flex-col items-center py-4 space-y-4">
        <button
          className={`p-3 rounded-lg transition-colors ${
            activeTab === 'files' ? 'bg-[var(--editor-bg)]' : 'hover:bg-gray-800'
          }`}
          onClick={() => setActiveTab('files')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
        <button
          className={`p-3 rounded-lg transition-colors ${
            activeTab === 'search' ? 'bg-[var(--editor-bg)]' : 'hover:bg-gray-800'
          }`}
          onClick={() => setActiveTab('search')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        <button
          className={`p-3 rounded-lg transition-colors ${
            activeTab === 'contracts' ? 'bg-[var(--editor-bg)]' : 'hover:bg-gray-800'
          }`}
          onClick={() => setActiveTab('contracts')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </button>
      </div>

      {/* Sidebar Panel */}
      <div className="w-64 bg-[var(--sidebar-bg)] border-r border-[var(--border-color)]">
        {activeTab === 'files' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase">Explorer</h2>
              <button className="p-1 rounded hover:bg-gray-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-300 hover:text-white cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span>contracts</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300 hover:text-white cursor-pointer pl-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>BaseIDE.sol</span>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'search' && (
          <div className="p-4">
            <input
              type="text"
              placeholder="Search files..."
              className="w-full px-3 py-2 bg-[var(--editor-bg)] rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-[var(--primary-color)]"
            />
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase mb-4">Smart Contracts</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded hover:bg-gray-800 cursor-pointer">
                <span>BaseIDE</span>
                <span className="text-xs text-gray-400">0.8.24</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 