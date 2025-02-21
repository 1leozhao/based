import React, { useCallback } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useWorkspaceStore } from '@/store/workspaceStore';

interface Workspace {
  name: string;
}

const Explorer: React.FC = () => {
  const { closeAllFiles } = useEditorStore();
  const { setActiveWorkspace } = useWorkspaceStore();

  const handleWorkspaceClick = useCallback((workspace: Workspace) => {
    closeAllFiles();
    setActiveWorkspace(workspace.name);
  }, [closeAllFiles, setActiveWorkspace]);

  return (
    <div className="h-full">
      {/* Workspace list will be rendered here */}
      <div className="p-4">
        {/* Example usage of handleWorkspaceClick */}
        <button onClick={() => handleWorkspaceClick({ name: 'Default' })}>
          Switch to Default Workspace
        </button>
      </div>
    </div>
  );
};

export default Explorer; 