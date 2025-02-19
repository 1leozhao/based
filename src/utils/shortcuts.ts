import { useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useViewStore } from '@/store/viewStore';

interface ShortcutHandler {
  key: string;
  metaKey?: boolean;
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
    toggleDiffView,
  } = useEditorStore();

  const {
    toggleExplorer,
    toggleSearch,
    toggleProblems,
    toggleCommandPalette,
  } = useViewStore();

  useEffect(() => {
    const shortcuts: ShortcutHandler[] = [
      { key: 'n', metaKey: true, handler: newFile },
      { key: 's', metaKey: true, handler: saveFile },
      { key: 'z', metaKey: true, handler: undo },
      { key: 'z', metaKey: true, shiftKey: true, handler: redo },
      { key: 'b', metaKey: true, handler: compile },
      { key: 'd', metaKey: true, shiftKey: true, handler: deploy },
      { key: 'p', metaKey: true, shiftKey: true, handler: toggleCommandPalette },
      { key: 'e', metaKey: true, shiftKey: true, handler: toggleExplorer },
      { key: 'f', metaKey: true, shiftKey: true, handler: toggleSearch },
      { key: 'm', metaKey: true, shiftKey: true, handler: toggleProblems },
      { key: '\\', metaKey: true, handler: toggleDiffView },
    ];

    function handleKeyDown(event: KeyboardEvent) {
      const { key, metaKey, shiftKey } = event;
      
      const shortcut = shortcuts.find(s => 
        s.key === key.toLowerCase() &&
        !!s.metaKey === metaKey &&
        !!s.shiftKey === shiftKey
      );

      if (shortcut) {
        event.preventDefault();
        shortcut.handler();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    newFile,
    saveFile,
    undo,
    redo,
    compile,
    deploy,
    toggleDiffView,
    toggleCommandPalette,
    toggleExplorer,
    toggleSearch,
    toggleProblems,
  ]);
} 