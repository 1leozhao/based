'use client';

import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useWorkspaceStore, type FileNode, type Workspace } from '@/store/workspaceStore';
import { getFileType, getFileIcon } from '@/utils/fileIcons';
import { getDefaultContent } from '@/utils/templates';
import ResizeHandle from './ResizeHandle';
import Dropdown from './Dropdown';

export default function Explorer() {
  const { explorerWidth, setExplorerWidth, openFile } = useEditorStore();
  const { 
    workspaces, 
    activeWorkspace, 
    setWorkspaces,
    setActiveWorkspace,
    addWorkspace,
    updateWorkspace
  } = useWorkspaceStore();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);

  const currentWorkspace = workspaces.find(w => w.name === activeWorkspace);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target as Node)) {
        setIsWorkspaceDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateFile = (parentPath: string[] = []) => {
    setIsCreatingFile(true);
    setIsCreatingFolder(false);
    setIsCreatingWorkspace(false);
    setCurrentPath(parentPath);
    setNewFileName('');
  };

  const handleCreateFolder = (parentPath: string[] = []) => {
    setIsCreatingFolder(true);
    setIsCreatingFile(false);
    setIsCreatingWorkspace(false);
    setCurrentPath(parentPath);
    setNewFileName('');
  };

  const handleCreateWorkspace = () => {
    setIsCreatingWorkspace(true);
    setIsCreatingFile(false);
    setIsCreatingFolder(false);
    setCurrentPath([]);
    setNewFileName('');
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName) return;

    let newName = newFileName;
    if (isCreatingFile && !newFileName.includes('.')) {
      newName = newFileName;
    }

    if (isCreatingWorkspace) {
      // Check for duplicate workspace names
      if (workspaces.some(w => w.name === newName)) {
        alert('A workspace with this name already exists');
        setIsCreatingWorkspace(false);
        setNewFileName('');
        return;
      }

      addWorkspace({
        name: newName,
        files: [
          {
            name: 'contracts',
            type: 'folder',
            children: []
          }
        ]
      });
      setActiveWorkspace(newName);
      setIsCreatingWorkspace(false);
      setNewFileName('');
      setIsWorkspaceDropdownOpen(false);
      return;
    }

    if (!currentWorkspace) return;

    // Function to find a node by path
    const findNodeByPath = (nodes: FileNode[], path: string[]): FileNode[] | null => {
      if (path.length === 0) return nodes;
      
      const [current, ...rest] = path;
      const folder = nodes.find(n => n.name === current && n.type === 'folder');
      
      if (!folder || !folder.children) return null;
      return findNodeByPath(folder.children, rest);
    };

    // Get the target folder using the path
    const targetFolder = currentPath.length === 0 
      ? currentWorkspace.files 
      : findNodeByPath(currentWorkspace.files, currentPath);

    if (!targetFolder) {
      alert('Target folder not found');
      return;
    }

    // Check for duplicates in the target folder
    if (targetFolder.some(node => node.name === newName)) {
      alert(`A ${isCreatingFile ? 'file' : 'folder'} with this name already exists`);
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      setNewFileName('');
      return;
    }

    const updateNodeAtPath = (nodes: FileNode[], path: string[]): FileNode[] => {
      if (path.length === 0) {
        const newNode: FileNode = isCreatingFolder ? {
          name: newName,
          type: 'folder',
          children: []
        } : {
          name: newName,
          type: 'file',
          content: getDefaultContent(newName)
        };
        return [...nodes, newNode];
      }

      const [current, ...rest] = path;
      return nodes.map(node => {
        if (node.name === current && node.type === 'folder') {
          return {
            ...node,
            children: updateNodeAtPath(node.children || [], rest)
          };
        }
        return node;
      });
    };

    updateWorkspace(currentWorkspace.name, updateNodeAtPath(currentWorkspace.files, currentPath));

    setIsCreatingFile(false);
    setIsCreatingFolder(false);
    setNewFileName('');
  };

  const handleFileClick = (file: FileNode) => {
    if (file.type === 'file') {
      openFile(file.name, file.content || '');
    }
  };

  const handleDelete = (node: FileNode, path: string[]) => {
    if (!currentWorkspace) return;
    if (confirm(`Are you sure you want to delete ${node.name}?`)) {
      const deleteNodeAtPath = (nodes: FileNode[], path: string[]): FileNode[] => {
        if (path.length === 0) {
          return nodes.filter(n => n.name !== node.name);
        }

        const [current, ...rest] = path;
        return nodes.map(n => {
          if (n.name === current && n.type === 'folder') {
            return {
              ...n,
              children: deleteNodeAtPath(n.children || [], rest)
            };
          }
          return n;
        });
      };

      updateWorkspace(currentWorkspace.name, deleteNodeAtPath(currentWorkspace.files, path));
    }
  };

  const toggleFolder = (node: FileNode, path: string[]) => {
    if (!currentWorkspace) return;
    const toggleNodeAtPath = (nodes: FileNode[], path: string[]): FileNode[] => {
      if (path.length === 0) {
        return nodes.map(n => 
          n.name === node.name && n.type === 'folder'
            ? { ...n, isExpanded: !n.isExpanded }
            : n
        );
      }

      const [current, ...rest] = path;
      return nodes.map(n => {
        if (n.name === current && n.type === 'folder') {
          return {
            ...n,
            children: toggleNodeAtPath(n.children || [], rest)
          };
        }
        return n;
      });
    };

    updateWorkspace(currentWorkspace.name, toggleNodeAtPath(currentWorkspace.files, path));
  };

  const BlankFileIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );

  const CreateMenu = ({ path = [], position = 'root' }: { path?: string[], position?: 'root' | 'hover' }) => (
    <div className="absolute" style={{ position: 'absolute' }}>
      <Dropdown
        isOpen={true}
        onClose={() => setShowCreateMenu(null)}
        className={`${position === 'hover' ? 'right-0 top-6' : 'right-0 top-full mt-1'}`}
      >
        <div className="divide-y divide-[var(--border-color)]">
          <button
            className="w-full px-3 py-2 text-sm text-left hover:bg-[var(--hover-bg)] text-[var(--text-primary)] flex items-center space-x-2"
            onClick={() => {
              handleCreateFile(path);
              setShowCreateMenu(null);
            }}
          >
            <BlankFileIcon />
            <span>New File</span>
          </button>
          <button
            className="w-full px-3 py-2 text-sm text-left hover:bg-[var(--hover-bg)] text-[var(--text-primary)] flex items-center space-x-2"
            onClick={() => {
              handleCreateFolder(path);
              setShowCreateMenu(null);
            }}
          >
            {getFileIcon('folder')}
            <span>New Folder</span>
          </button>
        </div>
      </Dropdown>
    </div>
  );

  const renderFileTree = (nodes: FileNode[], path: string[] = []) => {
    return nodes.map((node) => {
      const fullPath = [...path, node.name];
      const uniqueKey = fullPath.join('|');
      const isExpanded = node.isExpanded !== false;
      const fileType = node.type === 'folder' ? 'folder' : getFileType(node.name);

      return (
        <div key={uniqueKey} className="relative">
          {/* Tree structure lines - only show for non-root items */}
          {path.length > 0 && path.map((_, index) => (
            <div
              key={index}
              className="absolute w-px bg-[var(--border-color)]"
              style={{
                left: `calc(${index * 1.25}rem + 0.75rem)`,
                top: 0,
                bottom: 0,
                width: '1px'
              }}
            />
          ))}
          <div
            className="flex items-center space-x-2 cursor-pointer text-[var(--text-primary)] hover:text-[var(--primary-color)]"
            style={{ paddingLeft: `${path.length * 1.25}rem` }}
            onMouseEnter={() => setHoveredNode(node.name)}
            onMouseLeave={() => {
              setHoveredNode(null);
              if (!showCreateMenu) setShowCreateMenu(null);
            }}
          >
            <div className="flex items-center space-x-2" onClick={() => handleFileClick(node)}>
              {getFileIcon(fileType)}
              <span>{node.name}</span>
            </div>
            
            {/* Folder arrow and action buttons */}
            <div className="flex items-center ml-auto">
              {node.type === 'folder' && (
                <button
                  className="p-1 rounded hover:bg-[var(--hover-bg)] text-[var(--text-primary)] transition-transform duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFolder(node, path);
                  }}
                  style={{
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              
              {/* Action buttons on hover */}
              {hoveredNode === node.name && (
                <div className="flex space-x-1">
                  {node.type === 'folder' && (
                    <button
                      className="p-1 rounded hover:bg-[var(--hover-bg)] text-[var(--text-primary)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        const menuKey = [...path, node.name].join('|');
                        setShowCreateMenu(showCreateMenu === menuKey ? null : menuKey);
                      }}
                      title="Create New"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  )}
                  {showCreateMenu === [...path, node.name].join('|') && (
                    <CreateMenu path={[...path, node.name]} position="hover" />
                  )}
                  <button
                    className="p-1 rounded hover:bg-red-500 hover:text-white text-[var(--text-primary)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(node, path);
                    }}
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Render children for folders */}
          {node.type === 'folder' && node.children && isExpanded && (
            <div className="mt-1">
              {renderFileTree(node.children, [...path, node.name])}
              {/* Place input form inside the folder if we're creating in this folder */}
              {(isCreatingFile || isCreatingFolder) && 
               JSON.stringify([...path, node.name]) === JSON.stringify(currentPath) && (
                <form 
                  onSubmit={handleNameSubmit} 
                  className="flex items-center space-x-2"
                  style={{ paddingLeft: `${(path.length + 1) * 1.25}rem` }}
                >
                  {isCreatingFile ? <BlankFileIcon /> : getFileIcon('folder')}
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder={isCreatingFolder ? "folder name" : "filename"}
                    className="flex-1 px-2 py-1 text-sm bg-[var(--editor-bg)] rounded border border-[var(--border-color)] focus:outline-none focus:border-[var(--primary-color)] text-[var(--text-primary)]"
                    autoFocus
                    onBlur={() => {
                      setIsCreatingFile(false);
                      setIsCreatingFolder(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsCreatingFile(false);
                        setIsCreatingFolder(false);
                      }
                    }}
                  />
                </form>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div ref={sidebarRef} className="h-full flex flex-col">
      {/* Workspace Selector */}
      <div className="p-4 bg-[var(--sidebar-bg)] border-b border-[var(--border-color)]">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1" ref={workspaceDropdownRef}>
            <button
              className="w-full px-3 py-2 text-sm bg-[var(--editor-bg)] rounded border border-[var(--border-color)] focus:outline-none focus:border-[var(--primary-color)] text-[var(--text-primary)] flex items-center justify-between"
              onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>{activeWorkspace}</span>
              </div>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isWorkspaceDropdownOpen && (
              <div className="absolute left-0 right-0" style={{ position: 'absolute' }}>
                <Dropdown 
                  isOpen={isWorkspaceDropdownOpen}
                  onClose={() => setIsWorkspaceDropdownOpen(false)}
                  className="w-full mt-1"
                >
                  <div className="divide-y divide-[var(--border-color)]">
                    {workspaces.map(workspace => (
                      <button
                        key={workspace.name}
                        className={`w-full px-3 py-2 text-sm text-left hover:bg-[var(--hover-bg)] ${
                          workspace.name === activeWorkspace ? 'text-[var(--primary-color)]' : 'text-[var(--text-primary)]'
                        }`}
                        onClick={() => {
                          setActiveWorkspace(workspace.name);
                          setIsWorkspaceDropdownOpen(false);
                        }}
                      >
                        {workspace.name}
                      </button>
                    ))}
                    {isCreatingWorkspace ? (
                      <form 
                        onSubmit={handleNameSubmit}
                        className="px-3 py-2"
                      >
                        <input
                          type="text"
                          value={newFileName}
                          onChange={(e) => setNewFileName(e.target.value)}
                          placeholder="New workspace name"
                          className="w-full px-2 py-1 text-sm bg-[var(--editor-bg)] rounded border border-[var(--border-color)] focus:outline-none focus:border-[var(--primary-color)] text-[var(--text-primary)]"
                          autoFocus
                          onBlur={() => {
                            setIsCreatingWorkspace(false);
                            setNewFileName('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setIsCreatingWorkspace(false);
                              setNewFileName('');
                            }
                          }}
                        />
                      </form>
                    ) : (
                      <button
                        className="w-full px-3 py-2 text-sm text-left hover:bg-[var(--hover-bg)] text-[var(--text-primary)] flex items-center space-x-2"
                        onClick={handleCreateWorkspace}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>New Workspace</span>
                      </button>
                    )}
                  </div>
                </Dropdown>
              </div>
            )}
          </div>

          <button
            className="p-2 rounded hover:bg-[var(--hover-bg)] text-[var(--text-primary)]"
            onClick={() => setShowCreateMenu(showCreateMenu === 'root' ? null : 'root')}
            title="Create New"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>

        {showCreateMenu === 'root' && (
          <div className="absolute right-4" style={{ position: 'absolute' }}>
            <CreateMenu />
          </div>
        )}
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          {currentWorkspace && (
            <>
              {renderFileTree(currentWorkspace.files)}
              {(isCreatingFile || isCreatingFolder) && currentPath.length === 0 && (
                <form 
                  onSubmit={handleNameSubmit} 
                  className="flex items-center space-x-2 mt-2"
                >
                  {isCreatingFile ? <BlankFileIcon /> : getFileIcon('folder')}
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder={isCreatingFolder ? "folder name" : "filename"}
                    className="flex-1 px-2 py-1 text-sm bg-[var(--editor-bg)] rounded border border-[var(--border-color)] focus:outline-none focus:border-[var(--primary-color)] text-[var(--text-primary)]"
                    autoFocus
                    onBlur={() => {
                      setIsCreatingFile(false);
                      setIsCreatingFolder(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsCreatingFile(false);
                        setIsCreatingFolder(false);
                      }
                    }}
                  />
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {/* Resize Handle */}
      <ResizeHandle onResizeStart={(e) => {
        const startX = e.clientX;
        const startWidth = explorerWidth;

        const handleMouseMove = (e: MouseEvent) => {
          const delta = e.clientX - startX;
          const newWidth = Math.max(200, Math.min(480, startWidth + delta));
          setExplorerWidth(newWidth);
        };

        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }} />
    </div>
  );
} 