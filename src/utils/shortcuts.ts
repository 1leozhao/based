'use client';

import { useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useViewStore } from '@/store/viewStore';

interface ShortcutHandler {
  key: string;
  metaKey: boolean;
  shiftKey?: boolean;
  handler: () => void;
}

export function useKeyboardShortcuts() {
  const {
    newFile,
    saveFile,
    undo,
    redo,
    compile,
    deploy,
    activeFileId,
    toggleDiffView
  } = useEditorStore();

  const {
    toggleCommandPalette,
    toggleExplorer,
    toggleSearch,
    toggleProblems
  } = useViewStore();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const shortcuts: ShortcutHandler[] = [
        { key: 'n', metaKey: true, handler: () => newFile() },
        { key: 's', metaKey: true, handler: () => activeFileId && saveFile(activeFileId) },
        { key: 'z', metaKey: true, handler: () => activeFileId && undo(activeFileId) },
        { key: 'z', metaKey: true, shiftKey: true, handler: () => activeFileId && redo(activeFileId) },
        { key: 'b', metaKey: true, handler: () => compile() },
        { key: 'd', metaKey: true, shiftKey: true, handler: () => deploy() },
        { key: 'p', metaKey: true, shiftKey: true, handler: () => toggleCommandPalette() },
        { key: 'e', metaKey: true, shiftKey: true, handler: () => toggleExplorer() },
        { key: 'f', metaKey: true, shiftKey: true, handler: () => toggleSearch() },
        { key: 'm', metaKey: true, shiftKey: true, handler: () => toggleProblems() },
        { key: '\\', metaKey: true, handler: () => toggleDiffView() },
      ];

      const shortcut = shortcuts.find(
        s =>
          s.key.toLowerCase() === e.key.toLowerCase() &&
          s.metaKey === e.metaKey &&
          (s.shiftKey || false) === e.shiftKey
      );

      if (shortcut) {
        e.preventDefault();
        shortcut.handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    newFile,
    saveFile,
    undo,
    redo,
    compile,
    deploy,
    activeFileId,
    toggleCommandPalette,
    toggleExplorer,
    toggleSearch,
    toggleProblems,
    toggleDiffView,
  ]);
} 