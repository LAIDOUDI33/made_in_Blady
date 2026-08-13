"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters, FilterState, defaultFilters } from "@/components/products/ProductFilters";
import { SearchBar } from "@/components/products/SearchBar";
import { SearchResponse as SearchResponseType, ProductListResponse, Product, SearchSuggestion } from "@/types/product";
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Package,
  Building2,
  FolderOpen,
  Lightbulb,
  Loader2,
  AlertCircle,
} from "lucide-react";

// Popular searches for Algeria B2B
const POPULAR_SEARCHES = [
  "Panneaux solaires",
  "Câble électrique",
  "Acier construction",
  "Pompes irrigation",
  "Huile d'olive",
  "Dates deglet nour",
  "Machines agricoles",
  "Outils industriels",
];

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  // State
  const [query, setQuery] = useState(initialQuery);
  const [searchData, setSearchData] = useState<SearchResponseType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  // Load recent and saved searches from localStorage
  useEffect(() => {
    try {
      const recent = localStorage.getItem("recent_searches");
      if (recent) setRecentSearches(JSON.parse(recent));
      
      const saved = localStorage.getItem("saved_searches");
      if (saved) setSavedSearches(JSON.parse(saved));
    } catch {
      // Ignore errors
    }
  }, []);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=20`
      );
      const data = await response.json();

      if (data.success) {
        setSearchData(data.data);
        
        // Save to recent searches
        const updatedRecent = [
          searchQuery,
          ...recentSearches.filter((s) => s !== searchQuery),
        ].slice(0, 10);
        setRecentSearches(updatedRecent);
        
        try {
          localStorage.setItem("recent_searches", JSON.stringify(updatedRecent));
        } catch {
          // Ignore errors
        }
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setIsLoading(false);
    }
  }, [recentSearches]);

  // Initial search on mount
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim()) {
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set("q", query);
      window.history.pushState({}, "", url.toString());
      
      performSearch(query);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    
    const url = new URL(window.location.href);
    url.searchParams.set("q", suggestion.text);
    window.history.pushState({}, "", url.toString());
    
    performSearch(suggestion.text);
  };

  // Handle popular search click
  const handlePopularClick = (term: string) => {
    setQuery(term);
    
    const url = new URL(window.location.href);
    url.searchParams.set("q", term);
    window.history.pushState({}, "", url.toString());
    
    performSearch(term);
  };

  // Handle recent search click
  const handleRecentClick = (term: string) => {
    setQuery(term);
    performSearch(term);
  };

  // Save current search
  const handleSaveSearch = () => {
    if (query && !savedSearches.includes(query)) {
      const updated = [query, ...savedSearches].slice(0, 10);
      setSavedSearches(updated);
      
      try {
        localStorage.setItem("saved_searches", JSON.stringify(updated));
      } catch {
        // Ignore errors
      }
    }
  };

  // Clear recent searches
  const handleClearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("recent_searches");
    } catch {
      // Ignore errors
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setQuery("");
    setSearchData(null);
    setHasSearched(false);
    window.history.pushState({}, "", "/search");
  };

  // Convert search results to product list format for ProductGrid
  const convertToProductListResponse = (): ProductListResponse | undefined => {
    if (!searchData) return undefined;

    return {
      products: searchData.results.map((p) => ({
        ...p,
        _count: p._count || { reviews: 0, favorites: 0 },
      })) as ProductListResponse["products"],
      pagination: searchData.pagination,
      filters: {
        categories: [],
        wilayas: [],
        priceRange: [0, 10000000],
        moqRange: [0, 100000],
      },
    };
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="bg-white border-b sticky top-[105px] z-30">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Recherche</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher des produits, fournisseurs, catégories..."
                className="pl-12 pr-12 h-12 text-base"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              )}
            </div>
            
            <Button type="submit" size="lg" className="bg-green-600 hover:bg-green-700 px-8">
              <Search className="h-5 w-5 mr-2" />
              Rechercher
            </Button>
          </form>

          {/* Did You Mean */}
          {searchData?.didYouMean && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span className="text-muted-foreground">Vouliez-vous dire:</span>
              <button
                onClick={() => handlePopularClick(searchData.didYouMean!)}
                className="font-medium text-green-600 hover:text-green-700 hover:underline"
              >
                {searchData.didYouMean}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {!hasSearched ? (
          /* Initial State - No search performed */
          <div className="max-w-4xl mx-auto py-8">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      Recherches Récentes
                    </h2>
                    <Button variant="ghost" size="sm" onClick={handleClearRecent}>
                      Effacer tout
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <Badge
                        key={term}
                        variant="secondary"
                        className="cursor-pointer hover:bg-green-100 hover:text-green-700 px-3 py-1.5 text-sm"
                        onClick={() => handleRecentClick(term)}
                      >
                        <Search className="h-3 w-3 mr-1" />
                        {term}
                        <X 
                          className="h-3 w-3 ml-2 opacity-50 hover:opacity-100" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecentSearches(recentSearches.filter((s) => s !== term));
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h2 className="font-semibold flex items-center gap-2 mb-4">
                    💾 Recherches Sauvegardées
                  </h2>
                  
                  <div className="flex flex-wrap gap-2">
                    {savedSearches.map((term) => (
                      <Badge
                        key={term}
                        variant="outline"
                        className="cursor-pointer hover:border-green-300 hover:bg-green-50 px-3 py-1.5 text-sm"
                        onClick={() => handleRecentClick(term)}
                      >
                        {term}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Popular Searches */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Recherches Populaires
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      onClick={() => handlePopularClick(term)}
                      className="flex items-center gap-2 p-3 border rounded-lg hover:border-green-200 hover:bg-green-50 transition-colors text-left"
                    >
                      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{term}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/products" className="group">
                <Card className="hover:border-green-200 transition-colors h-full">
                  <CardContent className="p-6 text-center">
                    <Package className="h-10 w-10 mx-auto mb-3 text-green-600 group-hover:scale-110 transition-transform" />
                    <h3 className="font-medium group-hover:text-green-600 transition-colors">
                      Explorer les Produits
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Parcourir le catalogue complet
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/categories" className="group">
                <Card className="hover:border-green-200 transition-colors h-full">
                  <CardContent className="p-6 text-center">
                    <FolderOpen className="h-10 w-10 mx-auto mb-3 text-blue-600 group-hover:scale-110 transition-transform" />
                    <h3 className="font-medium group-hover:text-blue-600 transition-colors">
                      Par Catégorie
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Trouver par secteur d&apos;activité
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/suppliers" className="group">
                <Card className="hover:border-green-200 transition-colors h-full">
                  <CardContent className="p-6 text-center">
                    <Building2 className="h-10 w-10 mx-auto mb-3 text-purple-600 group-hover:scale-110 transition-transform" />
                    <h3 className="font-medium group-hover:text-purple-600 transition-colors">
                      Fournisseurs Vérifiés
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Découvrir nos partenaires
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        ) : isLoading ? (
          /* Loading State */
          <div className="py-16 text-center">
            <Loader2 className="h-12 w-12 text-green-600 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Recherche en cours...</p>
            <p className="text-muted-foreground mt-1">
              Recherche de &quot;{query}&quot;
            </p>
          </div>
        ) : searchData ? (
          /* Results State */
          <div>
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-xl font-semibold">
                  Résultats pour &quot;{searchData.searchQuery}&quot;
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchData.pagination.total} résultat(s) trouvé(s)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveSearch}
                  disabled={savedSearches.includes(query)}
                >
                  💾 {savedSearches.includes(query) ? "Sauvegardé" : "Sauvegarder la recherche"}
                </Button>
                
                {/* View Mode Toggle */}
                <div className="hidden sm:flex border rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 transition-colors ${
                      viewMode === "grid"
                        ? "bg-green-600 text-white"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 transition-colors ${
                      viewMode === "list"
                        ? "bg-green-600 text-white"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-6">
              {/* Sidebar Filters - Desktop */}
              <aside className="hidden lg:block w-72 shrink-0">
                <ProductFilters
                  onFiltersChange={(newFilters) => setFilters({ ...filters, ...newFilters })}
                  currentFilters={filters}
                />
              </aside>

              {/* Main Content */}
              <main className="flex-1 min-w-0">
                {/* Mobile Filter Button */}
                <div className="lg:hidden mb-4">
                  <ProductFilters
                    onFiltersChange={(newFilters) => setFilters({ ...filters, ...newFilters })}
                    currentFilters={filters}
                  />
                </div>

                {/* Products Grid/List */}
                {searchData.results.length > 0 ? (
                  <Suspense fallback={<ProductGrid isLoading />}>
                    <ProductGrid
                      data={convertToProductListResponse()}
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                      onSortChange={setSortBy}
                      currentSort={sortBy}
                      onAddToRFQ={() => {}}
                      onToggleFavorite={() => {}}
                    />
                  </Suspense>
                ) : (
                  /* Empty Results */
                  <Card>
                    <CardContent className="p-12 text-center">
                      <AlertCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h2 className="text-xl font-semibold mb-2">
                        Aucun résultat trouvé
                      </h2>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Nous n&apos;avons trouvé aucun produit correspondant à &quot;{searchData.searchQuery}&quot;. 
                        Essayez avec d&apos;autres termes de recherche.
                      </p>

                      {/* Suggestions */}
                      {searchData.suggestions.length > 0 && (
                        <div className="mb-6">
                          <p className="text-sm font-medium mb-3">Suggestions:</p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {searchData.suggestions.slice(0, 5).map((suggestion) => (
                              <Badge
                                key={suggestion.id}
                                variant="secondary"
                                className="cursor-pointer hover:bg-green-100 hover:text-green-700 px-3 py-1.5"
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                {suggestion.type === "product" && <Package className="h-3 w-3 mr-1" />}
                                {suggestion.type === "category" && <FolderOpen className="h-3 w-3 mr-1" />}
                                {suggestion.type === "company" && <Building2 className="h-3 w-3 mr-1" />}
                                {suggestion.text}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Popular Searches */}
                      <div>
                        <p className="text-sm font-medium mb-3 flex items-center justify-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          Recherches populaires:
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {POPULAR_SEARCHES.slice(0, 4).map((term) => (
                            <Badge
                              key={term}
                              variant="outline"
                              className="cursor-pointer hover:border-green-300 px-3 py-1.5"
                              onClick={() => handlePopularClick(term)}
                            >
                              {term}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Search Suggestions */}
                {searchData.suggestions.length > 0 && searchData.results.length > 0 && (
                  <Card className="mt-6">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Vous pourriez aussi chercher:
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {searchData.suggestions.map((suggestion) => (
                          <Badge
                            key={suggestion.id}
                            variant="outline"
                            className="cursor-pointer hover:border-green-300 hover:bg-green-50"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion.type === "product" && <Package className="h-3 w-3 mr-1" />}
                            {suggestion.type === "category" && <FolderOpen className="h-3 w-3 mr-1" />}
                            {suggestion.type === "company" && <Building2 className="h-3 w-3 mr-1" />}
                            {suggestion.text}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </main>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
