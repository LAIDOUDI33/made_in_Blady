"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Search, X, Clock, TrendingUp, Package, Building2 } from "lucide-react";

interface SearchSuggestion {
  id: string;
  text: string;
  type: "product" | "category" | "company";
  count?: number;
  slug?: string;
}

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  showShortcuts?: boolean;
}

// Popular search terms for Algeria B2B
const POPULAR_SEARCHES = [
  "Panneaux solaires",
  "Câble électrique",
  "Acier construction",
  "Pompes irrigation",
  "Olive oil",
  "Dates",
  "Textiles",
  "Machines agricoles",
];

export function SearchBar({
  placeholder = "Rechercher produits, fournisseurs...",
  className = "",
  showShortcuts = true,
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("recent_searches");
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce API call
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}&limit=8`
        );
        if (response.ok) {
          const data = await response.json();
          const mappedSuggestions: SearchSuggestion[] = [
            ...data.results.slice(0, 5).map((item: { id: string; name: string; slug: string }) => ({
              id: item.id,
              text: item.name,
              type: "product" as const,
              slug: item.slug,
            })),
            ...(data.suggestions || []).slice(0, 3).map(
              (s: SearchSuggestion) => s
            ),
          ];
          setSuggestions(mappedSuggestions);
        }
      } catch (error) {
        console.error("Error fetching search suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchSuggestions(query);
  }, [query, fetchSuggestions]);

  // Keyboard shortcut to open search (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const saveToRecentSearches = (term: string) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem("recent_searches", JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  };

  const handleSearch = (searchTerm?: string) => {
    const term = searchTerm || query;
    if (!term.trim()) return;

    saveToRecentSearches(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
    setIsOpen(false);
    setQuery("");
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    saveToRecentSearches(suggestion.text);
    
    switch (suggestion.type) {
      case "product":
        if (suggestion.slug) {
          router.push(`/products/${suggestion.slug}`);
        } else {
          router.push(`/search?q=${encodeURIComponent(suggestion.text)}`);
        }
        break;
      case "category":
        if (suggestion.slug) {
          router.push(`/categories/${suggestion.slug}`);
        } else {
          router.push(`/search?q=${encodeURIComponent(suggestion.text)}`);
        }
        break;
      default:
        router.push(`/search?q=${encodeURIComponent(suggestion.text)}`);
    }
    
    setIsOpen(false);
    setQuery("");
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("recent_searches");
    } catch {
      // Ignore localStorage errors
    }
  };

  return (
    <>
      {/* Desktop Search Bar */}
      <div className={`relative ${className}`}>
        <div className="relative flex">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder={placeholder}
            className="pl-10 pr-20 h-11 bg-background"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {showShortcuts && (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            )}
            <Button
              size="sm"
              onClick={() => handleSearch()}
              className="bg-green-600 hover:bg-green-700 h-8 px-3"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Clear button */}
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-24 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Dropdown Suggestions */}
        {isOpen && query && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border z-50 overflow-hidden max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Recherche en cours...
                </div>
              ) : suggestions.length > 0 ? (
                <div>
                  <CommandList>
                    <CommandGroup heading="Suggestions">
                      {suggestions.map((suggestion) => (
                        <CommandItem
                          key={`${suggestion.type}-${suggestion.id}`}
                          onSelect={() => handleSelectSuggestion(suggestion)}
                          className="cursor-pointer"
                        >
                          {suggestion.type === "product" && (
                            <Package className="mr-2 h-4 w-4 text-green-600" />
                          )}
                          {suggestion.type === "category" && (
                            <span className="mr-2">📁</span>
                          )}
                          {suggestion.type === "company" && (
                            <Building2 className="mr-2 h-4 w-4 text-blue-600" />
                          )}
                          <span>{suggestion.text}</span>
                          {suggestion.count !== undefined && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {suggestion.count}
                            </Badge>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-center text-green-600 hover:text-green-700"
                      onClick={() => handleSearch()}
                    >
                      Voir tous les résultats pour &quot;{query}&quot;
                    </Button>
                  </div>
                </div>
              ) : query.length >= 2 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Aucun résultat pour &quot;{query}&quot;
                </div>
              ) : null}
            </div>
          </>
        )}

        {/* Recent searches dropdown when focused but no query */}
        {isOpen && !query && recentSearches.length > 0 && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border z-50 overflow-hidden">
              <CommandList>
                <CommandGroup heading="Recherches récentes">
                  {recentSearches.map((term) => (
                    <CommandItem
                      key={term}
                      onSelect={() => handleSearch(term)}
                      className="cursor-pointer"
                    >
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{term}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecentSearches(recentSearches.filter((s) => s !== term));
                        }}
                        className="ml-auto p-1 rounded hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={clearRecentSearches}
                    className="cursor-pointer text-muted-foreground"
                  >
                    Effacer l&apos;historique
                  </CommandItem>
                </CommandGroup>
              </CommandList>

              {/* Popular Searches */}
              <CommandSeparator />
              <div className="p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Recherches populaires
                </p>
                <div className="flex flex-wrap gap-1">
                  {POPULAR_SEARCHES.map((term) => (
                    <Badge
                      key={term}
                      variant="secondary"
                      className="cursor-pointer hover:bg-green-100 hover:text-green-700 transition-colors"
                      onClick={() => handleSearch(term)}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default SearchBar;
