'use client';

import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useWorkspaceStore, type FileNode } from '@/store/workspaceStore';
import { getFileType, getFileIcon } from '@/utils/fileIcons';
import { getDefaultContent } from '@/utils/templates';
import ResizeHandle from './ResizeHandle';
import Dropdown from './Dropdown';

export default function Explorer() {
  const { explorerWidth, setExplorerWidth, openFile, closeAllFiles } = useEditorStore();
  const { 
    workspaces, 
    activeWorkspace,
    setActiveWorkspace,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace
  } = useWorkspaceStore();

  // Type guard to check if a node is a folder
  const isFolder = (node: FileNode): node is FileNode & { type: 'folder'; children: FileNode[] } => {
    return node.type === 'folder' && Array.isArray(node.children);
  };

  // Helper function to find a node by path
  const findNodeByPath = (nodes: FileNode[], path: string[]): FileNode[] | FileNode | null => {
    if (path.length === 0) return nodes;
    
    const [current, ...rest] = path;
    const node = nodes.find((n: FileNode) => n.name === current);
    
    if (!node) return null;
    if (rest.length === 0) return node;
    if (isFolder(node)) {
      return findNodeByPath(node.children, rest);
    }
    return null;
  };

  // Helper function to get children of a node or path
  const getChildren = (nodeOrPath: FileNode[] | FileNode | null): FileNode[] => {
    if (!nodeOrPath) return [];
    if (Array.isArray(nodeOrPath)) return nodeOrPath;
    if (isFolder(nodeOrPath)) return nodeOrPath.children;
    return [];
  };

  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<{ node: FileNode; path: string[] } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ 
    path: string[]; 
    isFolder: boolean;
    position: 'inside' | 'before' | 'after' | 'root';
  } | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

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
    // Expand the parent folder
    if (parentPath.length > 0) {
      const newExpanded = new Set(expandedNodes);
      newExpanded.add(parentPath.join('/'));
      setExpandedNodes(newExpanded);
    }
  };

  const handleCreateFolder = (parentPath: string[] = []) => {
    setIsCreatingFolder(true);
    setIsCreatingFile(false);
    setIsCreatingWorkspace(false);
    setCurrentPath(parentPath);
    setNewFileName('');
    // Expand the parent folder
    if (parentPath.length > 0) {
      const newExpanded = new Set(expandedNodes);
      newExpanded.add(parentPath.join('/'));
      setExpandedNodes(newExpanded);
    }
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
            name: 'README.md',
            type: 'file',
            content: `# ${newName}

## Getting Started

This is a smart contract development workspace. Here's what you'll find:

- \`/contracts\`: Sample contract directory
  - \`Based.sol\`: A sample contract to get you started

## Development

1. Edit your contracts within the IDE
2. Use the terminal to compile and deploy your contracts
3. Run \`help\` in the terminal for available commands

## Support

Built with ♥ on Base`
          },
          {
            name: 'contracts',
            type: 'folder',
            children: [
              {
                name: 'Based.sol',
                type: 'file',
                content: `// SPDX-License-Identifier: MIT
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
}`
              }
            ]
          }
        ]
      });
      setIsCreatingWorkspace(false);
      setNewFileName('');
      setIsWorkspaceDropdownOpen(false);
      return;
    }

    if (!currentWorkspace) return;

    // Get the target folder using the path
    const targetFolder = currentPath.length === 0 
      ? currentWorkspace.files 
      : getChildren(findNodeByPath(currentWorkspace.files, currentPath));

    // Check for duplicates in the target folder
    if (targetFolder.some((node: FileNode) => node.name === newName)) {
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

  const handleFileClick = (file: FileNode, path: string[]) => {
    if (file.type === 'file') {
      const fullPath = [...path, file.name].join('/');
      openFile(fullPath, file.content || '');
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

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
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

  const isNodeExpanded = (path: string) => expandedNodes.has(path);

  const handleDragStart = (e: React.DragEvent, node: FileNode, path: string[]) => {
    e.stopPropagation();
    setDraggedNode({ node, path });
    e.dataTransfer.setData('text/plain', node.name); // Required for Firefox
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, path: string[], isFolder: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedNode) return;
    
    // Don't allow dropping on itself
    const dragPath = draggedNode.path.join('/');
    const dropPath = path.join('/');
    if (dragPath === dropPath) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    // Allow dropping into subfolders even if they're siblings
    if (isFolder && dropPath !== dragPath) {
      e.dataTransfer.dropEffect = 'move';
      setDropTarget({ path, isFolder, position: 'inside' });
      return;
    }

    e.dataTransfer.dropEffect = 'move';

    // Calculate drop position based on mouse position
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    let position: 'inside' | 'before' | 'after' | 'root' = 'inside';
    
    if (isFolder) {
      // For folders, create three zones: top 25% for before, middle 50% for inside, bottom 25% for after
      if (y < rect.height * 0.25) {
        position = 'before';
      } else if (y > rect.height * 0.75) {
        position = 'after';
      } else {
        position = 'inside';
      }
    } else {
      // For files, just use top/bottom half
      position = y < rect.height / 2 ? 'before' : 'after';
    }

    setDropTarget({ path, isFolder, position });
  };

  // Add root folder drag over handler
  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedNode) return;
    
    e.dataTransfer.dropEffect = 'move';
    setDropTarget({ path: [], isFolder: true, position: 'root' });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetPath: string[], isTargetFolder: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedNode || !currentWorkspace || !dropTarget) return;

    const { node: draggedFile, path: sourcePath } = draggedNode;
    
    // Don't allow dropping on itself or its children
    const dragPathStr = sourcePath.join('/');
    const dropPathStr = targetPath.join('/');
    if (dragPathStr === dropPathStr || dropPathStr.startsWith(dragPathStr + '/')) {
      setDraggedNode(null);
      setDropTarget(null);
      return;
    }

    // Calculate the new path based on drop position
    let parentPath: string[];
    let insertIndex: number;

    if (dropTarget.position === 'root') {
      // Dropping at root level
      parentPath = [];
      insertIndex = currentWorkspace.files.length;
    } else if (dropTarget.position === 'inside' && isTargetFolder) {
      // Dropping inside a folder
      parentPath = targetPath;
      const targetNode = findNodeByPath(currentWorkspace.files, targetPath);
      if (targetNode && !Array.isArray(targetNode) && isFolder(targetNode)) {
        insertIndex = targetNode.children?.length || 0;
        // Expand the target folder
        const newExpanded = new Set(expandedNodes);
        newExpanded.add(targetPath.join('/'));
        setExpandedNodes(newExpanded);
      } else {
        // If target is not a valid folder, drop at root
        parentPath = [];
        insertIndex = currentWorkspace.files.length;
      }
    } else {
      // Dropping before or after an item
      parentPath = targetPath.slice(0, -1);
      const siblings = parentPath.length === 0 
        ? currentWorkspace.files 
        : getChildren(findNodeByPath(currentWorkspace.files, parentPath));
      
      if (Array.isArray(siblings)) {
        const targetIndex = siblings.findIndex(n => n.name === targetPath[targetPath.length - 1]);
        insertIndex = dropTarget.position === 'before' ? targetIndex : targetIndex + 1;
      } else {
        // Fallback to root if siblings can't be found
        parentPath = [];
        insertIndex = currentWorkspace.files.length;
      }
    }

    // Move the node to its new position
    const updatedFiles = moveNodeToIndex(
      currentWorkspace.files,
      [...sourcePath, draggedFile.name], // Include the node name in source path
      parentPath,
      draggedFile.name,
      insertIndex
    );

    if (updatedFiles) {
      updateWorkspace(currentWorkspace.name, updatedFiles);
    }

    setDraggedNode(null);
    setDropTarget(null);
  };

  // Helper function to move a node to a specific index
  const moveNodeToIndex = (
    nodes: FileNode[], 
    sourcePath: string[], 
    targetParentPath: string[],
    nodeName: string,
    targetIndex: number
  ): FileNode[] | null => {
    if (!currentWorkspace) return null;

    // First find and store the source node
    const sourceNode = findNodeByPath(nodes, sourcePath);
    if (!sourceNode || Array.isArray(sourceNode)) return null;

    // Create a clean copy of the source node
    const cleanSourceNode = { ...sourceNode };

    // Get target folder's children
    const targetFolder = targetParentPath.length === 0 
      ? nodes 
      : getChildren(findNodeByPath(nodes, targetParentPath));

    // Check for name conflicts and generate a new name if needed
    const generateUniqueName = (baseName: string): string => {
      // Split name and extension for files
      let nameWithoutExt = baseName;
      let extension = '';
      if (sourceNode.type === 'file' && baseName.includes('.')) {
        const lastDotIndex = baseName.lastIndexOf('.');
        nameWithoutExt = baseName.substring(0, lastDotIndex);
        extension = baseName.substring(lastDotIndex);
      }

      // Check if the base name already has a number suffix
      const baseNameMatch = nameWithoutExt.match(/^(.+?)(?:\((\d+)\))?$/);
      const baseNameWithoutNumber = baseNameMatch?.[1] || nameWithoutExt;

      let counter = 1;
      let newName = baseName;

      while (targetFolder.some(n => n.name === newName && n !== sourceNode)) {
        newName = `${baseNameWithoutNumber}(${counter})${extension}`;
        counter++;
      }

      return newName;
    };

    // Update the node name if there's a conflict
    cleanSourceNode.name = generateUniqueName(nodeName);

    // Function to remove node from its original location
    const removeFromSource = (currentNodes: FileNode[], path: string[]): FileNode[] => {
      if (path.length === 0) {
        return currentNodes.filter(n => n.name !== nodeName);
      }

      const [current, ...rest] = path;
      return currentNodes.map(node => {
        if (node.name === current && node.type === 'folder') {
          return {
            ...node,
            children: removeFromSource(node.children || [], rest)
          };
        }
        return node;
      });
    };

    // Function to insert node at the target location
    const insertAtTarget = (currentNodes: FileNode[], path: string[]): FileNode[] => {
      if (path.length === 0) {
        // Insert at root level
        const newNodes = [...currentNodes];
        const actualIndex = Math.min(targetIndex, newNodes.length);
        newNodes.splice(actualIndex, 0, cleanSourceNode);
        return newNodes;
      }

      const [current, ...rest] = path;
      return currentNodes.map(node => {
        if (node.name === current && node.type === 'folder') {
          if (rest.length === 0) {
            // Insert into this folder
            const newChildren = [...(node.children || [])];
            const actualIndex = Math.min(targetIndex, newChildren.length);
            newChildren.splice(actualIndex, 0, cleanSourceNode);
            return { ...node, children: newChildren };
          }
          return {
            ...node,
            children: insertAtTarget(node.children || [], rest)
          };
        }
        return node;
      });
    };

    // First remove the node from its source location
    const updatedFiles = removeFromSource(nodes, sourcePath.slice(0, -1));
    
    // Then insert it at the target location
    return insertAtTarget(updatedFiles, targetParentPath);
  };

  const renderFileTree = (nodes: FileNode[], path: string[] = []) => {
    return nodes.map((node) => {
      const fullPath = [...path, node.name].join('/');
      const isExpanded = isNodeExpanded(fullPath);
      const uniqueKey = [...path, node.name].join('|');
      const fileType = node.type === 'folder' ? 'folder' : getFileType(node.name);
      const isDropTarget = dropTarget?.path.join('/') === fullPath;
      const isDragging = draggedNode?.path.join('/') === fullPath;
      const isDropInside = isDropTarget && dropTarget?.position === 'inside';

      return (
        <div key={uniqueKey}>
          {/* Drop zone before item */}
          {dropTarget?.path.join('/') === fullPath && dropTarget.position === 'before' && (
            <div className="h-0.5 bg-[var(--primary-color)] mx-2 rounded-full" />
          )}

          <div
            className={`flex items-center px-2 py-1 rounded-lg cursor-pointer relative group
            ${isDropInside ? 'outline outline-2 outline-[#0052FF]' : ''} 
            ${isDragging ? 'opacity-50' : ''}`}
            style={{ paddingLeft: `${path.length * 1.25}rem` }}
            onClick={() => {
              if (node.type === 'file') {
                handleFileClick(node, path);
              } else {
                toggleNode(fullPath);
              }
            }}
            onMouseEnter={() => setHoveredNode(uniqueKey)}
            onMouseLeave={() => setHoveredNode(null)}
            draggable
            onDragStart={(e) => handleDragStart(e, node, path)}
            onDragOver={(e) => handleDragOver(e, [...path, node.name], node.type === 'folder')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, [...path, node.name], node.type === 'folder')}
          >
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
            <div className="flex items-center space-x-2">
              {getFileIcon(fileType)}
              <span>{node.name}</span>
            </div>
            
            {/* Folder arrow and action buttons */}
            <div className="flex items-center ml-auto">
              {node.type === 'folder' && (
                <button
                  className={`p-1 rounded hover:bg-[var(--hover-bg)] text-[var(--text-primary)] transition-transform duration-200 ${
                    hoveredNode !== uniqueKey ? 'opacity-0' : 'opacity-100'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNode(fullPath);
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
              {hoveredNode === uniqueKey && !isDragging && (
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
          
          {/* Drop zone after item */}
          {dropTarget?.path.join('/') === fullPath && dropTarget.position === 'after' && (
            <div className="h-0.5 bg-[var(--primary-color)] mx-2 rounded-full" />
          )}

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
                      <div
                        key={workspace.name}
                        className={`w-full px-3 py-2 text-sm text-left hover:bg-[var(--hover-bg)] ${
                          workspace.name === activeWorkspace ? 'text-[var(--primary-color)]' : 'text-[var(--text-primary)]'
                        } group relative flex items-center justify-between cursor-pointer`}
                        onClick={() => {
                          closeAllFiles();
                          setActiveWorkspace(workspace.name);
                          setIsWorkspaceDropdownOpen(false);
                        }}
                      >
                        <span>{workspace.name}</span>
                        {workspaces.length > 1 && (
                          <button
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500 hover:text-white text-[var(--text-primary)] transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to delete the workspace "${workspace.name}"?`)) {
                                deleteWorkspace(workspace.name);
                              }
                            }}
                            title="Delete Workspace"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
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

      {/* File Tree with root drop zone */}
      <div 
        className="flex-1 overflow-auto pl-2 pr-4"
        onDragOver={handleRootDragOver}
        onDrop={(e) => handleDrop(e, [], true)}
      >
        <div 
          className={`p-4 min-h-[calc(100%-1rem)] mt-2 rounded-lg ${
            dropTarget?.position === 'root' ? 'outline outline-2 outline-[#0052FF]' : ''
          }`}
        >
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