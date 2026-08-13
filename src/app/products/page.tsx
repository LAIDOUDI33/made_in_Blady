"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters, FilterState, defaultFilters } from "@/components/products/ProductFilters";
import { SearchBar } from "@/components/products/SearchBar";
import { ProductListResponse, Product } from "@/types/product";
import { Package, SlidersHorizontal } from "lucide-react";

function ProductsContent() {
  const searchParams = useSearchParams();
  
  // State
  const [productsData, setProductsData] = useState<ProductListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  // Initialize filters from URL params
  useEffect(() => {
    const category = searchParams.get("category") || "";
    const subcategory = searchParams.get("subcategory") || "";
    const wilaya = searchParams.get("wilaya") || "";
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "10000000");
    const minMoq = parseInt(searchParams.get("minMoq") || "0");
    const maxMoq = parseInt(searchParams.get("maxMoq") || "100000");
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";
    const availabilityParam = searchParams.get("availability");
    const availability = availabilityParam ? availabilityParam.split(",") : [];
    const sort = searchParams.get("sortBy") || "newest";
    const view = searchParams.get("view") as "grid" | "list" | null;

    setFilters({
      category,
      subcategory,
      wilaya,
      minPrice,
      maxPrice,
      minMoq,
      maxMoq,
      verifiedOnly,
      availability,
    });
    
    if (sort) setSortBy(sort);
    if (view) setViewMode(view);
  }, [searchParams]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Pagination
      params.set("page", searchParams.get("page") || "1");
      params.set("limit", "20");

      // Filters
      if (filters.category) params.set("category", filters.category);
      if (filters.subcategory) params.set("subcategory", filters.subcategory);
      if (filters.wilaya) params.set("wilaya", filters.wilaya);
      if (filters.minPrice > 0) params.set("minPrice", filters.minPrice.toString());
      if (filters.maxPrice < 10000000) params.set("maxPrice", filters.maxPrice.toString());
      if (filters.minMoq > 0) params.set("minMoq", filters.minMoq.toString());
      if (filters.maxMoq < 100000) params.set("maxMoq", filters.maxMoq.toString());
      if (filters.verifiedOnly) params.set("verifiedOnly", "true");
      if (filters.availability.length > 0) params.set("availability", filters.availability.join(","));

      // Sort
      params.set("sortBy", sortBy);

      // Search query
      const searchQuery = searchParams.get("search");
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setProductsData(data.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, sortBy, searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    
    // Update URL without navigation
    const url = new URL(window.location.href);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== false && 
          (Array.isArray(value) ? value.length > 0 : true)) {
        if (Array.isArray(value)) {
          url.searchParams.set(key, value.join(","));
        } else {
          url.searchParams.set(key, String(value));
        }
      } else {
        url.searchParams.delete(key);
      }
    });
    url.searchParams.delete("page"); // Reset to page 1 on filter change
    window.history.pushState({}, "", url.toString());
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
    const url = new URL(window.location.href);
    url.searchParams.set("sortBy", sort);
    window.history.pushState({}, "", url.toString());
  }, []);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: "grid" | "list") => {
    setViewMode(mode);
    const url = new URL(window.location.href);
    url.searchParams.set("view", mode);
    window.history.pushState({}, "", url.toString());
  }, []);

  // Handle add to RFQ
  const handleAddToRFQ = useCallback((product: Product) => {
    // TODO: Implement RFQ functionality
    alert(`Produit "${product.name}" ajouté au devis!`);
  }, []);

  // Handle toggle favorite
  const handleToggleFavorite = useCallback((product: Product) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(product.id)) {
        newFavorites.delete(product.id);
      } else {
        newFavorites.add(product.id);
      }
      return newFavorites;
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Produits</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                <Package className="h-8 w-8 text-green-600" />
                Catalogue des Produits
              </h1>
              <p className="mt-1 text-muted-foreground">
                Découvrez des milliers de produits algériens de qualité
              </p>
            </div>

            {/* Mobile Search */}
            <div className="md:hidden w-full">
              <SearchBar placeholder="Rechercher un produit..." showShortcuts={false} />
            </div>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:block mt-4 max-w-2xl">
            <SearchBar placeholder="Rechercher des produits, marques, catégories..." />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-72 shrink-0">
            <ProductFilters
              categories={productsData?.filters.categories}
              onFiltersChange={handleFiltersChange}
              currentFilters={filters}
              priceRange={productsData?.filters.priceRange as [number, number]}
              moqRange={productsData?.filters.moqRange as [number, number]}
            />
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4 flex items-center gap-2">
              <ProductFilters
                categories={productsData?.filters.categories}
                onFiltersChange={handleFiltersChange}
                currentFilters={filters}
                priceRange={productsData?.filters.priceRange as [number, number]}
                moqRange={productsData?.filters.moqRange as [number, number]}
              />
              
              {/* View Mode Toggle - Mobile */}
              <div className="flex border rounded-md overflow-hidden ml-auto">
                <button
                  onClick={() => handleViewModeChange("grid")}
                  className={`p-2 transition-colors ${
                    viewMode === "grid"
                      ? "bg-green-600 text-white"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                </button>
                <button
                  onClick={() => handleViewModeChange("list")}
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

            {/* Products Grid/List */}
            <Suspense fallback={<ProductGrid isLoading />}>
              <ProductGrid
                data={productsData || undefined}
                isLoading={isLoading}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                onSortChange={handleSortChange}
                currentSort={sortBy}
                onAddToRFQ={handleAddToRFQ}
                onToggleFavorite={handleToggleFavorite}
                favorites={favorites}
              />
            </Suspense>
          </main>
        </div>
      </div>

      {/* SEO Content Section */}
      <section className="bg-white border-t mt-8">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto prose prose-sm">
            <h2 className="text-xl font-semibold mb-4">À propos du Catalogue AlgeriaTrade</h2>
            <p className="text-muted-foreground leading-relaxed">
              AlgeriaTrade.dz est la première plateforme B2B dédiée au marché algérien. 
              Notre catalogue comprend plus de 50 000 produits provenant de fournisseurs 
              vérifiés dans toutes les wilayas d&apos;Algérie.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Que vous soyez à la recherche de matériaux de construction, d&apos;équipements 
              industriels, de produits agricoles ou de solutions énergétiques, vous trouverez 
              ici les meilleurs fournisseurs algériens avec des prix compétitifs et une 
              qualité garantie.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 not-prose">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">50K+</p>
                <p className="text-sm text-muted-foreground">Produits</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">2.5K+</p>
                <p className="text-sm text-muted-foreground">Fournisseurs</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">58</p>
                <p className="text-sm text-muted-foreground">Wilayas</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">98%</p>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-green-600 mx-auto animate-pulse" />
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
