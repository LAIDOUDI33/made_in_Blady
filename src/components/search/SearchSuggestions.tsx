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
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Package,
  Building2,
  FolderOpen,
  FileText,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

// ============================================
// Types
// ============================================

export interface SuggestionItem {
  id: string;
  text: string;
  type: "product" | "category" | "company" | "rfq" | "popular";
  slug?: string;
  count?: number;
  rating?: number;
  price?: number;
  image?: string;
  wilaya?: string;
}

interface SearchSuggestionsProps {
  placeholder?: string;
  className?: string;
  showShortcuts?: boolean;
  showPopularSearches?: boolean;
  onSelect?: (suggestion: SuggestionItem) => void;
  onSearch?: (query: string) => void;
  autoFocus?: boolean;
  size?: "default" | "lg" | "sm";
}

// ============================================
// Popular Searches Data (Algerian B2B focus)
// ============================================

const POPULAR_SEARCHES = [
  { term: "Panneaux solaires", icon: "☀️", count: "12.5K" },
  { term: "Câble électrique", icon: "⚡", count: "9.8K" },
  { term: "Acier construction", icon: "🏗️", count: "8.7K" },
  { term: "Pompes irrigation", icon: "💧", count: "7.2K" },
  { term: "Huile d'olive", icon: "🫒", count: "6.5K" },
  { term: "Dates deglet nour", icon: "🌴", count: "5.9K" },
  { term: "Machines agricoles", icon: "🚜", count: "5.4K" },
  { term: "Outils industriels", icon: "⚙️", count: "4.8K" },
  { term: "Carrelage", icon: "🏠", count: "4.2K" },
  { term: "Peinture bâtiment", icon: "🎨", count: "3.9K" },
];

const TRENDING_SEARCHES = [
  "Pompes solaires",
  "Onduleurs photovoltaïques",
  "Batteries lithium",
  "Climatisation inverter",
  "Machines à coudre industrielles",
];

// ============================================
// Main Component
// ============================================

export function SearchSuggestions({
  placeholder = "Rechercher produits, fournisseurs, RFQs...",
  className = "",
  showShortcuts = true,
  showPopularSearches = true,
  onSelect,
  onSearch,
  autoFocus = false,
  size = "default",
}: SearchSuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
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

  // Fetch suggestions with debounce and fuzzy search support
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setDidYouMean(null);
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
          `/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`
        );
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            // Map products to suggestions
            const productSuggestions: SuggestionItem[] = (data.data.results || []).slice(0, 5).map(
              (item: any) => ({
                id: item.id,
                text: item.name,
                type: "product" as const,
                slug: item.slug,
                price: item.price,
                image: item.images?.[0]?.url,
                wilaya: item.company?.wilaya,
              })
            );

            // Map category/company suggestions
            const otherSuggestions: SuggestionItem[] = (data.data.suggestions || []).map(
              (s: any) => ({
                ...s,
                type: s.type as SuggestionItem["type"],
              })
            );

            setSuggestions([...productSuggestions, ...otherSuggestions]);
            
            // Set did you mean if available
            if (data.data.didYouMean) {
              setDidYouMean(data.data.didYouMean);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching search suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    }, 250);

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
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      
      // Escape to close
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const saveToRecentSearches = (term: string) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 10);
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

    if (onSearch) {
      onSearch(term);
    } else {
      router.push(`/search?q=${encodeURIComponent(term)}`);
    }
    
    setIsOpen(false);
    setQuery("");
  };

  const handleSelectSuggestion = (suggestion: SuggestionItem) => {
    saveToRecentSearches(suggestion.text);

    if (onSelect) {
      onSelect(suggestion);
      return;
    }

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
      case "company":
        if (suggestion.slug) {
          router.push(`/suppliers/${suggestion.slug}`);
        } else {
          router.push(`/search?q=${encodeURIComponent(suggestion.text)}`);
        }
        break;
      case "rfq":
        router.push(`/rfqs?search=${encodeURIComponent(suggestion.text)}`);
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

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(recentSearches.filter((s) => s !== term));
    try {
      localStorage.setItem("recent_searches", JSON.stringify(recentSearches.filter((s) => s !== term)));
    } catch {
      // Ignore localStorage errors
    }
  };

  const getSuggestionIcon = (type: SuggestionItem["type"]) => {
    switch (type) {
      case "product":
        return <Package className="h-4 w-4 text-green-600" />;
      case "category":
        return <FolderOpen className="h-4 w-4 text-blue-600" />;
      case "company":
        return <Building2 className="h-4 w-4 text-purple-600" />;
      case "rfq":
        return <FileText className="h-4 w-4 text-orange-600" />;
      case "popular":
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const inputSizeClasses = {
    sm: "h-9 text-sm",
    default: "h-11",
    lg: "h-14 text-lg",
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
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder={placeholder}
            className={`${inputSizeClasses[size]} pl-10 pr-20 bg-background`}
            autoFocus={autoFocus}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {showShortcuts && !isOpen && (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            )}
            <Button
              size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
              onClick={() => handleSearch()}
              className="bg-green-600 hover:bg-green-700"
            >
              {size === "sm" ? <Search className="h-4 w-4" /> : (
                <>
                  <Search className="h-4 w-4 mr-1" />
                  Rechercher
                </>
              )}
            </Button>
          </div>

          {/* Clear button */}
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setDidYouMean(null);
              }}
              className="absolute right-[size==='sm'?80:140] top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border z-50 overflow-hidden max-h-[500px] overflow-y-auto">
              {isLoading ? (
                /* Loading State */
                <div className="p-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-muted-foreground">Recherche en cours...</p>
                </div>
              ) : query.length >= 2 ? (
                /* Results State */
                <div>
                  <CommandList className="p-0">
                    {/* Did You Mean */}
                    {didYouMean && (
                      <div className="px-3 py-2 bg-yellow-50 border-b flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-muted-foreground">Vouliez-vous dire:</span>
                        <button
                          onClick={() => {
                            setQuery(didYouMean);
                            handleSearch(didYouMean);
                          }}
                          className="text-sm font-medium text-yellow-700 hover:text-yellow-800 hover:underline"
                        >
                          {didYouMean}
                        </button>
                      </div>
                    )}

                    {/* Product Suggestions */}
                    {suggestions.filter((s) => s.type === "product").length > 0 && (
                      <CommandGroup heading="Produits" className="px-2">
                        {suggestions
                          .filter((s) => s.type === "product")
                          .map((suggestion) => (
                            <CommandItem
                              key={`product-${suggestion.id}`}
                              onSelect={() => handleSelectSuggestion(suggestion)}
                              className="cursor-pointer gap-3 py-2.5"
                            >
                              {getSuggestionIcon(suggestion.type)}
                              <div className="flex-1 min-w-0">
                                <span className="font-medium truncate block">{suggestion.text}</span>
                                {suggestion.price && (
                                  <span className="text-xs text-muted-foreground">
                                    {suggestion.price.toLocaleString()} DZD
                                  </span>
                                )}
                                {suggestion.wilaya && (
                                  <Badge variant="outline" className="ml-2 text-xs h-5">
                                    {suggestion.wilaya}
                                  </Badge>
                                )}
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    )}

                    {/* Category Suggestions */}
                    {suggestions.filter((s) => s.type === "category").length > 0 && (
                      <CommandGroup heading="Catégories" className="px-2">
                        {suggestions
                          .filter((s) => s.type === "category")
                          .map((suggestion) => (
                            <CommandItem
                              key={`cat-${suggestion.id}`}
                              onSelect={() => handleSelectSuggestion(suggestion)}
                              className="cursor-pointer gap-3"
                            >
                              {getSuggestionIcon(suggestion.type)}
                              <span>{suggestion.text}</span>
                              {suggestion.count !== undefined && (
                                <Badge variant="secondary" className="ml-auto text-xs">
                                  {suggestion.count} produits
                                </Badge>
                              )}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    )}

                    {/* Company Suggestions */}
                    {suggestions.filter((s) => s.type === "company").length > 0 && (
                      <CommandGroup heading="Fournisseurs" className="px-2">
                        {suggestions
                          .filter((s) => s.type === "company")
                          .map((suggestion) => (
                            <CommandItem
                              key={`comp-${suggestion.id}`}
                              onSelect={() => handleSelectSuggestion(suggestion)}
                              className="cursor-pointer gap-3"
                            >
                              {getSuggestionIcon(suggestion.type)}
                              <span>{suggestion.text}</span>
                              {suggestion.rating !== undefined && (
                                <span className="flex items-center ml-auto text-sm">
                                  ⭐ {suggestion.rating.toFixed(1)}
                                </span>
                              )}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    )}

                    {/* No results for query */}
                    {!isLoading && suggestions.length === 0 && (
                      <CommandEmpty className="py-6">
                        <div className="text-center">
                          <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">
                            Aucun résultat pour &quot;{query}&quot;
                          </p>
                          <Button
                            variant="link"
                            onClick={() => handleSearch()}
                            className="mt-2 text-green-600"
                          >
                            Voir tous les résultats
                          </Button>
                        </div>
                      </CommandEmpty>
                    )}

                    {/* View all results button */}
                    {suggestions.length > 0 && (
                      <div className="border-t p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-center text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleSearch()}
                        >
                          Voir tous les résultats pour &quot;{query}&quot;
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </CommandList>
                </div>
              ) : (
                /* Empty Query State - Show Recent & Popular */
                <div className="p-3">
                  {recentSearches.length > 0 && (
                    <>
                      <CommandGroup heading="Recherches récentes" className="px-0">
                        {recentSearches.slice(0, 5).map((term) => (
                          <CommandItem
                            key={term}
                            onSelect={() => handleSearch(term)}
                            className="cursor-pointer justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{term}</span>
                            </div>
                            <button
                              onClick={(e) => removeRecentSearch(term, e)}
                              className="p-1 rounded hover:bg-muted"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandSeparator className="my-2" />
                      <div className="px-2 pb-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearRecentSearches}
                          className="text-muted-foreground h-7 text-xs"
                        >
                          Effacer l&apos;historique
                        </Button>
                      </div>
                      <CommandSeparator className="my-2" />
                    </>
                  )}

                  {/* Popular Searches */}
                  {showPopularSearches && (
                    <div className="pt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-2 px-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Recherches populaires en Algérie
                      </p>
                      <div className="grid grid-cols-2 gap-1 px-2">
                        {POPULAR_SEARCHES.map((item) => (
                          <button
                            key={item.term}
                            onClick={() => handleSearch(item.term)}
                            className="flex items-center gap-2 p-2 rounded-lg text-left hover:bg-muted transition-colors"
                          >
                            <span>{item.icon}</span>
                            <div className="min-w-0">
                              <span className="text-sm truncate block">{item.term}</span>
                              <span className="text-xs text-muted-foreground">{item.count}</span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Trending Now */}
                      <div className="mt-3 pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2 px-2 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-blue-500" />
                          Tendances actuelles
                        </p>
                        <div className="flex flex-wrap gap-1 px-2">
                          {TRENDING_SEARCHES.map((term) => (
                            <Badge
                              key={term}
                              variant="secondary"
                              className="cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors"
                              onClick={() => handleSearch(term)}
                            >
                              {term}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default SearchSuggestions;
