"use client";

import React, { useState } from "react";
import { ProductCard } from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Grid3X3, List, SlidersHorizontal, Package } from "lucide-react";
import { Product, SORT_OPTIONS, ProductListResponse } from "@/types/product";

interface ProductGridProps {
  data?: ProductListResponse;
  isLoading?: boolean;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
  onSortChange?: (sort: string) => void;
  currentSort?: string;
  onAddToRFQ?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  favorites?: Set<string>;
}

export function ProductGrid({
  data,
  isLoading = false,
  viewMode = "grid",
  onViewModeChange,
  onSortChange,
  currentSort = "newest",
  onAddToRFQ,
  onToggleFavorite,
  favorites = new Set(),
}: ProductGridProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const products = data?.products || [];
  const pagination = data?.pagination;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Update URL with new page
    const url = new URL(window.location.href);
    url.searchParams.set("page", page.toString());
    window.history.pushState({}, "", url.toString());
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Toolbar skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-[120px]" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
        
        {/* Products grid skeleton */}
        <div className={`grid gap-4 ${
          viewMode === "grid"
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1"
        }`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`bg-white rounded-lg border p-4 ${viewMode === "list" ? "flex gap-4" : ""}`}>
              <Skeleton className={`${viewMode === "list" ? "w-64 h-48" : "aspect-square w-full"} rounded-md`} />
              <div className={`space-y-2 ${viewMode === "list" ? "flex-1" : "pt-4"}`}>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Aucun produit trouvé
        </h3>
        <p className="text-muted-foreground max-w-md">
          Nous n&apos;avons trouvé aucun produit correspondant à vos critères de recherche. 
          Essayez de modifier vos filtres ou votre recherche.
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => {
            window.location.href = "/products";
          }}
        >
          Réinitialiser les filtres
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border">
        {/* Results count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          <span>
            <strong className="text-foreground">{pagination?.total || 0}</strong> produits trouvés
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <Select value={currentSort} onValueChange={onSortChange}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex border rounded-md overflow-hidden">
            <button
              onClick={() => onViewModeChange?.("grid")}
              className={`p-2 transition-colors ${
                viewMode === "grid"
                  ? "bg-green-600 text-white"
                  : "bg-background hover:bg-muted"
              }`}
              aria-label="Vue grille"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange?.("list")}
              className={`p-2 transition-colors ${
                viewMode === "list"
                  ? "bg-green-600 text-white"
                  : "bg-background hover:bg-muted"
              }`}
              aria-label="Vue liste"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-4"
        }
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            viewMode={viewMode}
            onAddToRFQ={onAddToRFQ}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favorites.has(product.id)}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center pt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    pagination.hasPrevPage && handlePageChange(pagination.page - 1)
                  }
                  className={
                    !pagination.hasPrevPage
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: pagination.totalPages }).map((_, i) => {
                const page = i + 1;
                // Show first, last, current, and adjacent pages
                if (
                  page === 1 ||
                  page === pagination.totalPages ||
                  Math.abs(page - pagination.page) <= 1
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={page === pagination.page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                // Show ellipsis for gaps
                if (Math.abs(page - pagination.page) === 2) {
                  return (
                    <PaginationItem key={page}>
                      <span className="px-2">...</span>
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    pagination.hasNextPage && handlePageChange(pagination.page + 1)
                  }
                  className={
                    !pagination.hasNextPage
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

export default ProductGrid;
