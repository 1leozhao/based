'use client';

import { useState, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import Explorer from './Explorer';
import Search from './Search';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState('files');
  const { explorerWidth } = useEditorStore();

  return (
    <div className="fixed left-0 top-14 bottom-0 flex">
      {/* Activity Bar */}
      <div className="w-14 bg-[var(--navbar-bg)] border-r border-[var(--border-color)] flex flex-col items-center py-4 space-y-4">
        <button
          className={`p-3 rounded-lg transition-colors ${
            activeTab === 'files' ? 'bg-[var(--hover-bg)]' : 'hover:bg-[var(--hover-bg)]'
          }`}
          onClick={() => setActiveTab('files')}
          title="Explorer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
        <button
          className={`p-3 rounded-lg transition-colors ${
            activeTab === 'search' ? 'bg-[var(--hover-bg)]' : 'hover:bg-[var(--hover-bg)]'
          }`}
          onClick={() => setActiveTab('search')}
          title="Search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Sidebar Panel */}
      <div 
        className="bg-[var(--sidebar-bg)] border-r border-[var(--border-color)]"
        style={{ width: `${explorerWidth}px` }}
      >
        {activeTab === 'files' && <Explorer />}
        {activeTab === 'search' && <Search />}
      </div>
    </div>
  );
} 