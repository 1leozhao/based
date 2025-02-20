'use client';

import { create } from 'zustand';
import toast from 'react-hot-toast';

interface FileTab {
  id: string;
  fileName: string;
  code: string;
  isModified: boolean;
  history: string[];
  historyIndex: number;
}

interface SearchResult {
  fileName: string;
  filePath: string;
  content: string;
  matches: {
    name: boolean;
    content: boolean;
  };
}

interface EditorState {
  openFiles: FileTab[];
  activeFileId: string | null;
  isDiffViewEnabled: boolean;
  originalCode: string | null;
  theme: 'light' | 'dark';
  explorerWidth: number;
  searchQuery: string;
  searchResults: SearchResult[];
  setCode: (id: string, code: string) => void;
  openFile: (fileName: string, content: string) => void;
  closeFile: (id: string) => void;
  setActiveFile: (id: string) => void;
  newFile: () => void;
  saveFile: (id: string) => void;
  undo: (id: string) => void;
  redo: (id: string) => void;
  compile: () => Promise<void>;
  deploy: () => Promise<void>;
  toggleDiffView: () => void;
  setOriginalCode: (code: string) => void;
  toggleTheme: () => void;
  setExplorerWidth: (width: number) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
}

const defaultCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Based {
    string public message;
    address public owner;
    
    event MessageUpdated(string newMessage);
    
    constructor() {
        message = "Hello, Base!";
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    function updateMessage(string memory newMessage) public onlyOwner {
        message = newMessage;
        emit MessageUpdated(newMessage);
    }
    
    function getMessage() public view returns (string memory) {
        return message;
    }
}`;

export const useEditorStore = create<EditorState>((set, get) => ({
  openFiles: [],
  activeFileId: null,
  isDiffViewEnabled: false,
  originalCode: null,
  theme: 'light',
  explorerWidth: 300,
  searchQuery: '',
  searchResults: [],

  setCode: (id: string, code: string) => {
    set(state => ({
      openFiles: state.openFiles.map(file => {
        if (file.id === id) {
          const newHistory = [...file.history.slice(0, file.historyIndex + 1), code];
          return {
            ...file,
            code,
            isModified: true,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }
        return file;
      }),
    }));
  },

  openFile: (fileName: string, content: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    set(state => {
      // Check if file is already open
      const existingFile = state.openFiles.find(f => f.fileName === fileName);
      if (existingFile) {
        return { activeFileId: existingFile.id };
      }

      // Open new file
      return {
        openFiles: [...state.openFiles, {
          id,
          fileName,
          code: content,
          isModified: false,
          history: [content],
          historyIndex: 0,
        }],
        activeFileId: id,
      };
    });
  },

  closeFile: (id: string) => {
    set(state => {
      const newFiles = state.openFiles.filter(f => f.id !== id);
      let newActiveId = state.activeFileId;
      
      if (state.activeFileId === id) {
        newActiveId = newFiles.length > 0 ? newFiles[newFiles.length - 1].id : null;
      }

      return {
        openFiles: newFiles,
        activeFileId: newActiveId,
      };
    });
  },

  setActiveFile: (id: string) => set({ activeFileId: id }),

  newFile: () => {
    const id = Math.random().toString(36).substr(2, 9);
    set(state => ({
      openFiles: [...state.openFiles, {
        id,
        fileName: 'Untitled.sol',
        code: defaultCode,
        isModified: false,
        history: [defaultCode],
        historyIndex: 0,
      }],
      activeFileId: id,
    }));
  },

  saveFile: (id: string) => {
    const { openFiles } = get();
    const file = openFiles.find(f => f.id === id);
    if (!file) return;

    const blob = new Blob([file.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName;
    a.click();
    URL.revokeObjectURL(url);

    set(state => ({
      openFiles: state.openFiles.map(f => 
        f.id === id ? { ...f, isModified: false } : f
      ),
    }));
  },

  toggleDiffView: () => {
    const { isDiffViewEnabled, activeFileId, openFiles, originalCode } = get();
    const activeFile = openFiles.find(f => f.id === activeFileId);
    
    if (!activeFile) return;

    if (!isDiffViewEnabled && !originalCode) {
      set({ 
        isDiffViewEnabled: true,
        originalCode: activeFile.code 
      });
    } else {
      set({ isDiffViewEnabled: !isDiffViewEnabled });
    }
  },

  setOriginalCode: (code: string) => set({ originalCode: code }),

  undo: (id: string) => {
    set(state => ({
      openFiles: state.openFiles.map(file => {
        if (file.id === id && file.historyIndex > 0) {
          return {
            ...file,
            code: file.history[file.historyIndex - 1],
            historyIndex: file.historyIndex - 1,
            isModified: true,
          };
        }
        return file;
      }),
    }));
  },

  redo: (id: string) => {
    set(state => ({
      openFiles: state.openFiles.map(file => {
        if (file.id === id && file.historyIndex < file.history.length - 1) {
          return {
            ...file,
            code: file.history[file.historyIndex + 1],
            historyIndex: file.historyIndex + 1,
            isModified: true,
          };
        }
        return file;
      }),
    }));
  },

  compile: async () => {
    const { activeFileId, openFiles } = get();
    const activeFile = openFiles.find(f => f.id === activeFileId);
    if (!activeFile) return;

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activeFile.code }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || 'Compilation failed');
        throw new Error(data.error);
      }
      
      toast.success('Compilation successful');
      return data;
    } catch (error) {
      console.error('Compilation error:', error);
      toast.error('Compilation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  },

  deploy: async () => {
    const { activeFileId, openFiles } = get();
    const activeFile = openFiles.find(f => f.id === activeFileId);
    if (!activeFile) return;

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activeFile.code }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || 'Deployment failed');
        throw new Error(data.error);
      }
      
      toast.success('Contract deployed successfully');
      return data;
    } catch (error) {
      console.error('Deployment error:', error);
      toast.error('Deployment failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  },

  toggleTheme: () => {
    const { theme } = get();
    const newTheme = theme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
  },

  setExplorerWidth: (width: number) => set({ explorerWidth: width }),

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSearchResults: (results: SearchResult[]) => set({ searchResults: results }),
})); 