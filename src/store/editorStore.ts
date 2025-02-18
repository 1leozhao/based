import { create } from 'zustand';
import toast from 'react-hot-toast';

interface EditorState {
  code: string;
  fileName: string;
  isModified: boolean;
  history: string[];
  historyIndex: number;
  setCode: (code: string) => void;
  setFileName: (name: string) => void;
  newFile: () => void;
  saveFile: () => void;
  openFile: (file: File) => Promise<void>;
  undo: () => void;
  redo: () => void;
  compile: () => Promise<void>;
  deploy: () => Promise<void>;
}

const defaultCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Based {
    // Your code here
}`;

export const useEditorStore = create<EditorState>((set, get) => ({
  code: defaultCode,
  fileName: 'Based.sol',
  isModified: false,
  history: [defaultCode],
  historyIndex: 0,

  setCode: (code: string) => {
    const { history, historyIndex } = get();
    const newHistory = [...history.slice(0, historyIndex + 1), code];
    set({
      code,
      isModified: true,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  setFileName: (name: string) => set({ fileName: name }),

  newFile: () => {
    set({
      code: defaultCode,
      fileName: 'Untitled.sol',
      isModified: false,
      history: [defaultCode],
      historyIndex: 0,
    });
  },

  saveFile: () => {
    const { code, fileName } = get();
    // Create a blob and trigger download
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    set({ isModified: false });
  },

  openFile: async (file: File) => {
    try {
      const content = await file.text();
      set({
        code: content,
        fileName: file.name,
        isModified: false,
        history: [content],
        historyIndex: 0,
      });
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({
        code: history[historyIndex - 1],
        historyIndex: historyIndex - 1,
        isModified: true,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({
        code: history[historyIndex + 1],
        historyIndex: historyIndex + 1,
        isModified: true,
      });
    }
  },

  compile: async () => {
    const { code } = get();
    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
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
    const { code } = get();
    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
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
})); 