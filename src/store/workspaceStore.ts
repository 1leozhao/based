import { create } from 'zustand';

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
}

export interface Workspace {
  name: string;
  files: FileNode[];
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: string;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (name: string) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (name: string, files: FileNode[]) => void;
  addFile: (path: string[], content: string) => void;
  updateFile: (path: string[], content: string) => void;
  deleteFile: (path: string[]) => void;
  searchFiles: (query: string) => Array<{
    fileName: string;
    filePath: string;
    content: string;
    matches: {
      name: boolean;
      content: boolean;
    };
  }>;
}

// Helper function to recursively find and update a file node
const updateFileNode = (nodes: FileNode[], path: string[], content: string, isNew: boolean = false): FileNode[] => {
  if (path.length === 0) return nodes;

  const [current, ...rest] = path;
  const nodeIndex = nodes.findIndex(n => n.name === current);

  if (nodeIndex === -1) {
    // If we're adding a new file and the path doesn't exist
    if (isNew) {
      if (rest.length === 0) {
        // This is a new file
        nodes.push({
          name: current,
          type: 'file',
          content
        });
      } else {
        // This is a new folder
        nodes.push({
          name: current,
          type: 'folder',
          children: updateFileNode([], rest, content, isNew)
        });
      }
    }
    return nodes;
  }

  const node = nodes[nodeIndex];
  if (rest.length === 0) {
    // We've reached the target file
    if (node.type === 'file') {
      nodes[nodeIndex] = { ...node, content };
    }
  } else {
    // We need to go deeper
    if (node.type === 'folder') {
      nodes[nodeIndex] = {
        ...node,
        children: updateFileNode(node.children || [], rest, content, isNew)
      };
    }
  }

  return nodes;
};

// Helper function to recursively delete a file node
const deleteFileNode = (nodes: FileNode[], path: string[]): FileNode[] => {
  if (path.length === 0) return nodes;

  const [current, ...rest] = path;
  if (rest.length === 0) {
    // Remove the target file/folder
    return nodes.filter(n => n.name !== current);
  }

  const nodeIndex = nodes.findIndex(n => n.name === current);
  if (nodeIndex === -1) return nodes;

  const node = nodes[nodeIndex];
  if (node.type === 'folder') {
    nodes[nodeIndex] = {
      ...node,
      children: deleteFileNode(node.children || [], rest)
    };
  }

  return nodes;
};

// Function to recursively search through files
function searchFiles(node: FileNode, query: string, path: string[] = []): Array<{
  fileName: string;
  filePath: string;
  content: string;
  matches: { name: boolean; content: boolean; };
}> {
  const results: Array<{
    fileName: string;
    filePath: string;
    content: string;
    matches: { name: boolean; content: boolean; };
  }> = [];

  // If it's a file, check for matches
  if (node.type === 'file') {
    const matchesName = node.name.toLowerCase().includes(query.toLowerCase());
    const matchesContent = node.content?.toLowerCase().includes(query.toLowerCase()) || false;

    if (matchesName || matchesContent) {
      results.push({
        fileName: node.name,
        filePath: [...path, node.name].join('/'),
        content: node.content || '',
        matches: {
          name: matchesName,
          content: matchesContent,
        }
      });
    }
  }

  // If it's a folder, search through children
  if (node.children) {
    node.children.forEach(child => {
      results.push(...searchFiles(child, query, [...path, node.name]));
    });
  }

  return results;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [
    {
      name: 'Default Workspace',
      files: [
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
    }
  ],
  activeWorkspace: 'Default Workspace',

  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWorkspace: (name) => set({ activeWorkspace: name }),
  addWorkspace: (workspace) => set(state => ({
    workspaces: [...state.workspaces, workspace]
  })),
  updateWorkspace: (name, files) => set(state => ({
    workspaces: state.workspaces.map(w =>
      w.name === name ? { ...w, files } : w
    )
  })),

  addFile: (path, content) => set(state => {
    const { workspaces, activeWorkspace } = state;
    const workspaceIndex = workspaces.findIndex(w => w.name === activeWorkspace);
    if (workspaceIndex === -1) return state;

    const workspace = workspaces[workspaceIndex];
    const updatedFiles = updateFileNode([...workspace.files], path, content, true);

    return {
      workspaces: workspaces.map((w, i) =>
        i === workspaceIndex ? { ...w, files: updatedFiles } : w
      )
    };
  }),

  updateFile: (path, content) => set(state => {
    const { workspaces, activeWorkspace } = state;
    const workspaceIndex = workspaces.findIndex(w => w.name === activeWorkspace);
    if (workspaceIndex === -1) return state;

    const workspace = workspaces[workspaceIndex];
    const updatedFiles = updateFileNode([...workspace.files], path, content, false);

    return {
      workspaces: workspaces.map((w, i) =>
        i === workspaceIndex ? { ...w, files: updatedFiles } : w
      )
    };
  }),

  deleteFile: (path) => set(state => {
    const { workspaces, activeWorkspace } = state;
    const workspaceIndex = workspaces.findIndex(w => w.name === activeWorkspace);
    if (workspaceIndex === -1) return state;

    const workspace = workspaces[workspaceIndex];
    const updatedFiles = deleteFileNode([...workspace.files], path);

    return {
      workspaces: workspaces.map((w, i) =>
        i === workspaceIndex ? { ...w, files: updatedFiles } : w
      )
    };
  }),

  searchFiles: (query) => {
    const { workspaces, activeWorkspace } = get();
    const workspace = workspaces.find(w => w.name === activeWorkspace);
    if (!workspace) return [];

    const results = workspace.files.flatMap(file => searchFiles(file, query));
    
    // Sort results by relevance (name matches first)
    return results.sort((a, b) => {
      if (a.matches.name && !b.matches.name) return -1;
      if (!a.matches.name && b.matches.name) return 1;
      return 0;
    });
  },
})); 