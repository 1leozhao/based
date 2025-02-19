'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useWorkspaceStore, type FileNode } from '@/store/workspaceStore';

export default function Search() {
  const { searchQuery, setSearchQuery, searchResults, setSearchResults, openFile } = useEditorStore();
  const [isSearching, setIsSearching] = useState(false);
  const { workspaces, activeWorkspace } = useWorkspaceStore();

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const workspace = workspaces.find(w => w.name === activeWorkspace);
      if (!workspace) {
        throw new Error('No active workspace found');
      }

      // Function to recursively search through files
      const searchFiles = (node: FileNode, query: string, path: string[] = []): Array<{
        fileName: string;
        filePath: string;
        content: string;
        matches: { name: boolean; content: boolean; };
      }> => {
        const results: Array<{
          fileName: string;
          filePath: string;
          content: string;
          matches: { name: boolean; content: boolean; };
        }> = [];

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

        if (node.children) {
          node.children.forEach(child => {
            results.push(...searchFiles(child, query, [...path, node.name]));
          });
        }

        return results;
      };

      // Search through all files in the workspace
      const results = workspace.files.flatMap(node => searchFiles(node, searchQuery, []));

      // Sort results by relevance (name matches first)
      const sortedResults = results.sort((a, b) => {
        if (a.matches.name && !b.matches.name) return -1;
        if (!a.matches.name && b.matches.name) return 1;
        return 0;
      });

      setSearchResults(sortedResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, workspaces, activeWorkspace, setSearchResults]);

  // Effect for search query changes
  useEffect(() => {
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Effect for workspace changes
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    }
  }, [workspaces, activeWorkspace, searchQuery, performSearch]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[var(--border-color)]">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full px-3 py-2 pl-9 bg-[var(--editor-bg)] rounded-lg border border-[var(--border-color)] focus:outline-none focus:border-[var(--primary-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
          />
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--primary-color)] border-t-transparent" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {searchResults.length === 0 && searchQuery && !isSearching ? (
          <div className="text-[var(--text-secondary)] text-sm">No results found</div>
        ) : (
          <div className="space-y-4">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => openFile(result.fileName, result.content)}
                className="w-full text-left hover:bg-[var(--hover-bg)] p-2 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-2 text-[var(--text-primary)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="font-medium">{result.fileName}</span>
                </div>
                <div className="mt-1 text-sm text-[var(--text-secondary)]">
                  {result.filePath}
                  {result.matches.name && <span className="ml-2">(matches name)</span>}
                  {result.matches.content && <span className="ml-2">(matches content)</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 