'use client';

import { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { configureMonaco } from '@/config/monaco';
import * as monaco from 'monaco-editor';
import { useEditorStore } from '@/store/editorStore';
import DiffEditor from './DiffEditor';
import Terminal from '../terminal/Terminal';
import { getFileType } from '@/utils/fileIcons';

export default function CodeEditor() {
  const [mounted, setMounted] = useState(false);
  const {
    openFiles,
    activeFileId,
    setCode,
    isDiffViewEnabled,
    toggleDiffView,
    theme,
    toggleTheme,
    explorerWidth,
    closeFile,
    setActiveFile
  } = useEditorStore();
  const [isTerminalVisible, setIsTerminalVisible] = useState(false);
  const activityBarWidth = 48;
  const totalSidebarWidth = explorerWidth + activityBarWidth;

  const activeFile = openFiles.find(f => f.id === activeFileId);
  const fileType = activeFile ? getFileType(activeFile.fileName) : 'text';

  useEffect(() => {
    setMounted(true);
    configureMonaco();
  }, []);

  useEffect(() => {
    monaco.editor.setTheme(`based-${theme}`);
  }, [theme]);

  const handleEditorChange = (value: string | undefined) => {
    if (value && activeFileId) setCode(activeFileId, value);
  };

  if (!mounted) return null;

  return (
    <div 
      className="fixed top-14 bottom-0 flex flex-col"
      style={{ 
        left: `${totalSidebarWidth}px`,
        right: 0
      }}
    >
      {/* Tabs */}
      <div className="h-10 border-b border-[var(--border-color)] flex items-center px-2 bg-[var(--navbar-bg)]">
        <div className="flex-1 flex items-center space-x-1 overflow-x-auto">
          <div className="flex overflow-x-auto border-b border-[var(--border-color)] bg-[var(--editor-bg)]">
            {openFiles.map((file) => (
              <div
                key={file.id}
                className={`flex items-center px-4 py-2 min-w-[120px] max-w-[200px] border-r border-[var(--border-color)] cursor-pointer transition-colors ${
                  file.id === activeFileId
                    ? 'bg-[var(--active-tab-bg)] text-[var(--text-primary)]'
                    : 'bg-[var(--editor-bg)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                }`}
                onClick={() => setActiveFile(file.id)}
              >
                <div className="flex-1 truncate text-sm">
                  {file.fileName}
                  {file.isModified && ' •'}
                </div>
                {file.id === activeFileId && (
                  <button
                    className="ml-2 p-1 rounded-sm hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeFile(file.id);
                    }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-2">
          <button
            onClick={() => setIsTerminalVisible(!isTerminalVisible)}
            className={`px-3 py-1 rounded-lg transition-colors ${
              isTerminalVisible
                ? 'bg-[var(--primary-color)] text-white'
                : 'hover:bg-[var(--hover-bg)]'
            }`}
            title="Toggle Terminal"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={toggleTheme}
            className="px-3 py-1 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
          <button
            onClick={toggleDiffView}
            className={`px-3 py-1 rounded-lg transition-colors ${
              isDiffViewEnabled
                ? 'bg-[var(--primary-color)] text-white'
                : 'hover:bg-[var(--hover-bg)]'
            }`}
            title="Toggle Diff View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Editor */}
      {activeFile ? (
        isDiffViewEnabled ? (
          <DiffEditor />
        ) : (
          <div className="flex-1 bg-[var(--editor-bg)]">
            <Editor
              height="100%"
              defaultLanguage={fileType}
              language={fileType}
              theme={`based-${theme}`}
              value={activeFile.code}
              onChange={handleEditorChange}
              beforeMount={(monaco) => {
                monaco.editor.setTheme(`based-${theme}`);
              }}
              onMount={(editor, monaco) => {
                monaco.editor.setTheme(`based-${theme}`);
                const editorElement = editor.getContainerDomNode();
                editorElement.style.backgroundColor = 'var(--editor-bg)';
                // Also set background for the monaco-editor root element
                const rootElement = editorElement.querySelector('.monaco-editor');
                if (rootElement) {
                  (rootElement as HTMLElement).style.backgroundColor = 'var(--editor-bg)';
                }
              }}
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: false,
                automaticLayout: true,
                padding: { top: 0, bottom: 0 },
                lineNumbersMinChars: 3,
                glyphMargin: false,
                folding: true,
                lineDecorationsWidth: 0,
                wordWrap: 'on',
                renderWhitespace: 'selection',
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </div>
        )
      ) : (
        <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
          No file open
        </div>
      )}

      {/* Terminal */}
      {isTerminalVisible && (
        <Terminal
          isVisible={isTerminalVisible}
        />
      )}
    </div>
  );
}