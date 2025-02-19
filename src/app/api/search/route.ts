import { NextResponse } from 'next/server';
import { useWorkspaceStore } from '@/store/workspaceStore';

// Mock workspace data structure (this should match your Explorer component's data)
interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
}

interface Workspace {
  name: string;
  files: FileNode[];
}

// Default workspace data
const workspaces: Workspace[] = [
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
];

// Function to recursively search through files
function searchFiles(node: FileNode, query: string): { fileName: string; filePath: string; content: string; matches: { name: boolean; content: boolean; } } | null {
  // If it's a file, check for matches
  if (node.type === 'file') {
    const matchesName = node.name.toLowerCase().includes(query.toLowerCase());
    const matchesContent = node.content?.toLowerCase().includes(query.toLowerCase()) || false;

    if (matchesName || matchesContent) {
      return {
        fileName: node.name,
        filePath: node.name, // For now, just using the name as the path
        content: node.content || '',
        matches: {
          name: matchesName,
          content: matchesContent,
        }
      };
    }
    return null;
  }

  // If it's a folder, search through children
  if (node.children) {
    const results = node.children
      .map(child => searchFiles(child, query))
      .filter((result): result is NonNullable<typeof result> => result !== null);
    return results[0] || null; // Return the first match in this folder
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Use the workspace store to search files
    const results = useWorkspaceStore.getState().searchFiles(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
} 