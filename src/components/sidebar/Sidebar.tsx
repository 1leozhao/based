'use client';

import { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import Explorer from './Explorer';
import Search from './Search';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState('files');
  const { explorerWidth, setExplorerWidth } = useEditorStore();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(150, Math.min(600, e.clientX - 48));
      setExplorerWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, setExplorerWidth]);

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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
        ref={sidebarRef}
        className="bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] relative"
        style={{ width: `${explorerWidth}px` }}
      >
        {activeTab === 'files' && <Explorer />}
        {activeTab === 'search' && <Search />}
      </div>

      {/* Resize Handle */}
      <div
        className="fixed top-14 bottom-0 flex items-center cursor-ew-resize group"
        style={{
          left: `${explorerWidth + 48 - 1}px`,
          width: '2px',
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsResizing(true);
        }}
      >
        <div 
          className="h-full w-full transition-colors duration-150" 
          style={{
            backgroundColor: isResizing ? 'var(--primary-color)' : 'var(--border-color)',
          }}
        />
      </div>
    </div>
  );
} 