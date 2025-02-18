import { create } from 'zustand';

interface ViewState {
  isExplorerOpen: boolean;
  isSearchOpen: boolean;
  isProblemsOpen: boolean;
  isCommandPaletteOpen: boolean;
  toggleExplorer: () => void;
  toggleSearch: () => void;
  toggleProblems: () => void;
  toggleCommandPalette: () => void;
}

export const useViewStore = create<ViewState>((set) => ({
  isExplorerOpen: false,
  isSearchOpen: false,
  isProblemsOpen: false,
  isCommandPaletteOpen: false,

  toggleExplorer: () =>
    set((state) => ({ isExplorerOpen: !state.isExplorerOpen })),
  
  toggleSearch: () =>
    set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  
  toggleProblems: () =>
    set((state) => ({ isProblemsOpen: !state.isProblemsOpen })),
  
  toggleCommandPalette: () =>
    set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
})); 