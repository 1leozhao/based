'use client';

import { useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { configureMonaco } from '@/config/monaco';
import { useEditorStore } from '@/store/editorStore';

export default function CodeEditor() {
  const { code, fileName, setCode } = useEditorStore();

  useEffect(() => {
    configureMonaco();
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    if (value) setCode(value);
  };

  return (
    <div className="fixed left-[calc(4rem+16rem)] top-14 right-0 bottom-0 bg-[var(--editor-bg)]">
      {/* Tabs */}
      <div className="h-10 border-b border-[var(--border-color)] flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <div className="px-4 py-2 bg-[var(--navbar-bg)] text-white border-r border-[var(--border-color)] flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{fileName}</span>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="h-[calc(100vh-8rem)]">
        <Editor
          height="100%"
          language="solidity"
          theme="baseide-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-[calc(4rem+16rem)] right-0 h-6 bg-[var(--navbar-bg)] border-t border-[var(--border-color)] flex items-center justify-between px-4 text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Solidity 0.8.24</span>
          <span>Base Sepolia</span>
          <span>Gas: 0 gwei</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>{code.split('\n').length} lines</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
} 