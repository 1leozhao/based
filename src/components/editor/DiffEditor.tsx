import { DiffEditor as MonacoDiffEditor } from '@monaco-editor/react';
import { useEditorStore } from '@/store/editorStore';

export default function DiffEditor() {
  const { code, originalCode, fileName, theme } = useEditorStore();

  return (
    <div className="h-[calc(100vh-8rem)]">
      <MonacoDiffEditor
        height="100%"
        language="solidity"
        theme={`based-${theme}`}
        original={originalCode || ''}
        modified={code}
        options={{
          renderSideBySide: true,
          originalEditable: false,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          diffWordWrap: 'off',
        }}
      />
    </div>
  );
} 