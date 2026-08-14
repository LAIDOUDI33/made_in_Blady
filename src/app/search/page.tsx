"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductGrid } from "@/components/products/ProductGrid";
import {
  AdvancedFilters,
  defaultAdvancedFilters,
  type AdvancedFilterState,
} from "@/components/search/AdvancedFilters";
import { SearchSuggestions } from "@/components/search/SearchSuggestions";
import { ActiveFilters } from "@/components/search/ActiveFilters";
import { SavedSearches } from "@/components/search/SavedSearches";
import { SearchResultsMeta } from "@/components/search/SearchResultsMeta";
import type { SearchResponse as SearchResponseType, ProductListResponse, Product, SearchSuggestion } from "@/types/product";
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
  FileText,
  ChevronRight,
} from "lucide-react";

// ============================================
// Popular Searches (Algerian B2B Focus)
// ============================================

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

// ============================================
// Main Search Content Component
// ============================================

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  // State
  const [query, setQuery] = useState(initialQuery);
  const [searchData, setSearchData] = useState<SearchResponseType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("relevance");
  const [filters, setFilters] = useState<AdvancedFilterState>(defaultAdvancedFilters);
  const [activeTab, setActiveTab] = useState<"products" | "suppliers" | "rfqs">("products");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const recent = localStorage.getItem("recent_searches");
      if (recent) setRecentSearches(JSON.parse(recent));
    } catch {
      // Ignore errors
    }
  }, []);

  // Build search URL with all filters
  const buildSearchUrl = useCallback(
    (searchQuery: string) => {
      const params = new URLSearchParams();
      params.set("q", searchQuery);
      params.set("limit", "20");
      params.set("sortBy", sortBy);

      // Add filter parameters if they have values
      if (filters.categories.length > 0) params.set("categories", filters.categories.join(","));
      if (filters.wilayas.length > 0) params.set("wilaya", filters.wilayas.join(","));
      if (filters.minPrice > 0) params.set("minPrice", String(filters.minPrice));
      if (filters.maxPrice < 10000000) params.set("maxPrice", String(filters.maxPrice));
      if (filters.minMoq > 0) params.set("minMoq", String(filters.minMoq));
      if (filters.maxMoq < 100000) params.set("maxMoq", String(filters.maxMoq));
      if (filters.verifiedOnly) params.set("verifiedOnly", "true");
      if (filters.availability.length > 0) params.set("availability", filters.availability.join(","));
      if (filters.countryOfOrigin) params.set("countryOfOrigin", filters.countryOfOrigin);
      if (filters.minRating > 0) params.set("minRating", String(filters.minRating));
      if (filters.datePosted) params.set("datePosted", filters.datePosted);
      if (filters.leadTime) params.set("leadTime", filters.leadTime);

      return `/api/search?${params.toString()}`;
    },
    [filters, sortBy]
  );

  // Perform search
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      setIsLoading(true);
      setHasSearched(true);

      try {
        const url = buildSearchUrl(searchQuery);
        const response = await fetch(url);
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
    },
    [buildSearchUrl, recentSearches]
  );

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

  // Handle saved search apply
  const handleApplySavedSearch = (savedSearch: any) => {
    setQuery(savedSearch.query);
    if (savedSearch.filters) {
      setFilters({ ...defaultAdvancedFilters, ...savedSearch.filters });
    }
    performSearch(savedSearch.query);
  };

  // Clear search
  const handleClearSearch = () => {
    setQuery("");
    setSearchData(null);
    setHasSearched(false);
    window.history.pushState({}, "", "/search");
  };

  // Remove single filter
  const handleRemoveFilter = (category: string, value?: string) => {
    let updatedFilters = { ...filters };

    switch (category) {
      case "categories":
      case "wilayas":
      case "availability":
      case "businessTypes":
      case "supplierWilayas":
      case "rfqStatus":
        updatedFilters = {
          ...updatedFilters,
          [category]: (updatedFilters[category] as string[]).filter((v) => v !== value),
        };
        break;
      case "priceRange":
        updatedFilters = { ...updatedFilters, minPrice: 0, maxPrice: 10000000 };
        break;
      case "moqRange":
        updatedFilters = { ...updatedFilters, minMoq: 0, maxMoq: 100000 };
        break;
      case "verifiedOnly":
        updatedFilters = { ...updatedFilters, verifiedOnly: false };
        break;
      case "supplierVerifiedOnly":
        updatedFilters = { ...updatedFilters, supplierVerifiedOnly: false };
        break;
      case "countryOfOrigin":
        updatedFilters = { ...updatedFilters, countryOfOrigin: "" };
        break;
      case "minRating":
        updatedFilters = { ...updatedFilters, minRating: 0 };
        break;
      case "datePosted":
        updatedFilters = { ...updatedFilters, datePosted: "" };
        break;
      case "leadTime":
        updatedFilters = { ...updatedFilters, leadTime: "" };
        break;
      case "yearsInBusiness":
        updatedFilters = { ...updatedFilters, yearsInBusiness: "" };
        break;
      case "sortBy":
        updatedFilters = { ...updatedFilters, sortBy: "relevance" };
        setSortBy("relevance");
        break;
      default:
        break;
    }

    setFilters(updatedFilters);
    
    // Re-search with updated filters
    if (query) {
      setTimeout(() => performSearch(query), 100);
    }
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setFilters(defaultAdvancedFilters);
    setSortBy("relevance");
    if (query) {
      setTimeout(() => performSearch(query), 100);
    }
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
            <div className="relative flex-1 max-w-3xl">
              <SearchSuggestions
                placeholder="Rechercher des produits, fournisseurs, catégories..."
                showShortcuts={false}
                size="lg"
                onSearch={(term) => {
                  setQuery(term);
                  performSearch(term);
                }}
              />
            </div>

            <Button type="submit" size="lg" className="bg-green-600 hover:bg-green-700 px-8 h-14">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem("recent_searches");
                      }}
                    >
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
            <SavedSearches
              currentQuery={query}
              currentFilters={filters}
              onApplySavedSearch={handleApplySavedSearch}
              compact={false}
            />

            {/* Popular Searches */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Recherches Populaires en Algérie
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
              Recherche de &quot;{query}&quot; avec vos filtres
            </p>
          </div>
        ) : searchData ? (
          /* Results State */
          <div>
            {/* Results Header with Meta Info */}
            <div className="mb-6">
              <SearchResultsMeta
                totalResults={searchData.pagination.total}
                searchQuery={searchData.searchQuery}
                currentSort={sortBy}
                viewMode={viewMode}
                onSortChange={setSortBy}
                onViewModeChange={setViewMode}
                onToggleFilters={() => setShowMobileFilters(!showMobileFilters)}
                isLoading={isLoading}
              />

              {/* Active Filters Display */}
              <div className="mt-4">
                <ActiveFilters
                  filters={filters}
                  onRemoveFilter={handleRemoveFilter}
                  onClearAll={handleClearAllFilters}
                />
              </div>

              {/* Save Current Search Button */}
              <div className="mt-4 flex items-center gap-3">
                <SavedSearches
                  currentQuery={query}
                  currentFilters={filters}
                  onApplySavedSearch={handleApplySavedSearch}
                  compact={true}
                />
              </div>
            </div>

            {/* Tab Navigation for different result types */}
            {(searchData.rfqResults && searchData.rfqResults.length > 0 ||
              searchData.suggestions.some((s) => s.type === "company")) && (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
                <TabsList>
                  <TabsTrigger value="products" className="gap-2">
                    <Package className="h-4 w-4" />
                    Produits ({searchData.pagination.total})
                  </TabsTrigger>
                  {searchData.suggestions.some((s) => s.type === "company") && (
                    <TabsTrigger value="suppliers" className="gap-2">
                      <Building2 className="h-4 w-4" />
                      Fournisseurs
                    </TabsTrigger>
                  )}
                  {searchData.rfqResults && searchData.rfqResults.length > 0 && (
                    <TabsTrigger value="rfqs" className="gap-2">
                      <FileText className="h-4 w-4" />
                      RFQs ({searchData.rfqResults.length})
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
            )}

            <div className="flex gap-6">
              {/* Sidebar Filters - Desktop */}
              <aside className={`w-72 shrink-0 ${showMobileFilters ? "block" : "hidden lg:block"}`}>
                <AdvancedFilters
                  filterType="all"
                  onFiltersChange={(newFilters) => {
                    setFilters({ ...filters, ...newFilters });
                    // Debounce re-search
                    setTimeout(() => query && performSearch(query), 300);
                  }}
                  currentFilters={filters}
                />
              </aside>

              {/* Main Content */}
              <main className="flex-1 min-w-0">
                {/* Products Results */}
                {(activeTab === "products" || !searchData.rfqResults?.length) &&
                  (searchData.results.length > 0 ? (
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
                    /* Empty Products Results */
                    <Card>
                      <CardContent className="p-12 text-center">
                        <AlertCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">
                          Aucun produit trouvé
                        </h2>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          Nous n&apos;avons trouvé aucun produit correspondant à &quot;{searchData.searchQuery}&quot;.{" "}
                          Essayez avec d&apos;autres termes ou modifiez vos filtres.
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
                                  {suggestion.type === "product" && (
                                    <Package className="h-3 w-3 mr-1" />
                                  )}
                                  {suggestion.type === "category" && (
                                    <FolderOpen className="h-3 w-3 mr-1" />
                                  )}
                                  {suggestion.type === "company" && (
                                    <Building2 className="h-3 w-3 mr-1" />
                                  )}
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
                  ))}

                {/* Supplier Suggestions */}
                {activeTab === "suppliers" && (
                  <div className="space-y-3">
                    {searchData.suggestions
                      .filter((s) => s.type === "company")
                      .map((supplier) => (
                        <Card key={supplier.id} className="hover:border-green-200 transition-colors cursor-pointer">
                          <CardContent className="p-4 flex items-center gap-4">
                            <Building2 className="h-10 w-10 text-purple-600 bg-purple-50 rounded-lg p-2" />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium">{supplier.text}</h3>
                              {supplier.count !== undefined && (
                                <p className="text-sm text-muted-foreground">
                                  {supplier.count} produits
                                </p>
                              )}
                              {supplier.rating !== undefined && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-yellow-500">⭐</span>
                              <span className="text-sm">{supplier.rating}</span>
                                </div>
                              )}
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}

                {/* RFQ Results */}
                {activeTab === "rfqs" && searchData.rfqResults && (
                  <div className="space-y-3">
                    {searchData.rfqResults.map((rfq: any) => (
                      <Card key={rfq.id} className="hover:border-orange-200 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <FileText className="h-10 w-10 text-orange-600 bg-orange-50 rounded-lg p-2 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium">{rfq.title}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {rfq.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>Qté: {rfq.quantity.toLocaleString()} {rfq.unit}</span>
                                {rfq.targetPrice && (
                                  <span>Budget: {rfq.targetPrice.toLocaleString()} DZD</span>
                                )}
                                <span>{rfq._count?.quotations || 0} devis</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Related Searches / Popular Searches */}
                {searchData.relatedSearches && searchData.relatedSearches.length > 0 && searchData.results.length > 0 && (
                  <Card className="mt-6">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Autres recherches populaires
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {searchData.relatedSearches.map((item, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="cursor-pointer hover:border-green-300 hover:bg-green-50"
                            onClick={() => handlePopularClick(item.term)}
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {item.term}
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

// ============================================
// Export Page Component
// ============================================

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
