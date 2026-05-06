"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CommandPalette } from "./command-palette";

interface SearchContextValue {
  openSearch: () => void;
}

const SearchContext = createContext<SearchContextValue>({ openSearch: () => {} });

export function useSearchOpen() {
  return useContext(SearchContext);
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSearch = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <SearchContext.Provider value={{ openSearch }}>
      <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
        {children}
      </div>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </SearchContext.Provider>
  );
}
