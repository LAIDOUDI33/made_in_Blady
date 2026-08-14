"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Grid3X3,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  Star,
  Eye,
  Package,
} from "lucide-react";

// ============================================
// Types
// ============================================

export interface SortOption {
  value: string;
  label: string;
  icon?: React.ElementType;
}

interface SearchResultsMetaProps {
  totalResults: number;
  searchQuery: string;
  currentSort: string;
  viewMode: "grid" | "list";
  onSortChange: (sort: string) => void;
  onViewModeChange: (mode: "grid" | "list") => void;
  onToggleFilters?: () => void;
  isLoading?: boolean;
  showingFrom?: number;
  showingTo?: number;
}

// ============================================
// Sort Options (Algerian B2B focus)
// ============================================

const SORT_OPTIONS: SortOption[] = [
  { value: "relevance", label: "Pertinence", icon: ArrowUpDown },
  { value: "newest", label: "Plus récent", icon: Clock },
  { value: "price_asc", label: "Prix croissant", icon: ArrowUp },
  { value: "price_desc", label: "Prix décroissant", icon: ArrowDown },
  { value: "rating", label: "Mieux notés", icon: Star },
  { value: "most_viewed", label: "Plus vus", icon: Eye },
];

// ============================================
// Helper Functions
// ============================================

function formatResultCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${Math.round(count / 1000)}K`;
  }
  return count.toLocaleString("fr-FR");
}

function getSortIcon(value: string): React.ElementType | undefined {
  const option = SORT_OPTIONS.find((opt) => opt.value === value);
  return option?.icon;
}

// ============================================
// Main Component
// ============================================

export function SearchResultsMeta({
  totalResults,
  searchQuery,
  currentSort,
  viewMode,
  onSortChange,
  onViewModeChange,
  onToggleFilters,
  isLoading = false,
  showingFrom = 1,
  showingTo = 20,
}: SearchResultsMetaProps) {
  const SortIcon = getSortIcon(currentSort);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Left Side - Results Count & Query */}
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2 flex-wrap">
          <Package className="h-5 w-5 text-green-600" />
          {!isLoading ? (
            <>
              <span>{formatResultCount(totalResults)} résultat{totalResults !== 1 ? "s" : ""}</span>
              {searchQuery && (
                <>
                  <span className="text-muted-foreground">pour</span>
                  <span className="text-green-600">&quot;{searchQuery}&quot;</span>
                </>
              )}
            </>
          ) : (
            <span className="animate-pulse bg-muted rounded h-6 w-48 inline-block" />
          )}
        </h1>

        {/* Showing X to Y of Z results */}
        {!isLoading && totalResults > 20 && (
          <p className="text-sm text-muted-foreground mt-1">
            Affichage de {showingFrom.toLocaleString("fr-FR")} à{" "}
            {Math.min(showingTo, totalResults).toLocaleString("fr-FR")} sur{" "}
            {totalResults.toLocaleString("fr-FR")}
          </p>
        )}
      </div>

      {/* Right Side - Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Mobile Filter Toggle */}
        {onToggleFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFilters}
            className="lg:hidden gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
          </Button>
        )}

        {/* Sort By Dropdown */}
        <Select value={currentSort} onValueChange={onSortChange}>
          <SelectTrigger className="w-[160px] sm:w-[180px]">
            <SelectValue placeholder="Trier par">
              <span className="flex items-center gap-2">
                {SortIcon && <SortIcon className="h-4 w-4" />}
                {SORT_OPTIONS.find((opt) => opt.value === currentSort)?.label || "Trier par"}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    {option.label}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* View Mode Toggle - Desktop */}
        <div className="hidden sm:flex border rounded-md overflow-hidden">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-2 transition-colors ${
              viewMode === "grid"
                ? "bg-green-600 text-white"
                : "bg-background hover:bg-muted"
            }`}
            title="Vue grille"
            aria-label="Vue grille"
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-2 transition-colors ${
              viewMode === "list"
                ? "bg-green-600 text-white"
                : "bg-background hover:bg-muted"
            }`}
            title="Vue liste"
            aria-label="Vue liste"
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile View Mode Toggle */}
        <Select
          value={viewMode}
          onValueChange={(val) => onViewModeChange(val as "grid" | "list")}
        >
          <SelectTrigger className="w-[110px] sm:hidden">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">
              <span className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" /> Grille
              </span>
            </SelectItem>
            <SelectItem value="list">
              <span className="flex items-center gap-2">
                <List className="h-4 w-4" /> Liste
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ============================================
// Compact Version for Embedded Use
// ============================================

interface SearchResultsMetaCompactProps extends Omit<SearchResultsMetaProps, "onToggleFilters"> {
  showViewToggle?: boolean;
}

export function SearchResultsMetaCompact({
  totalResults,
  searchQuery,
  currentSort,
  viewMode,
  onSortChange,
  onViewModeChange,
  isLoading,
  showViewToggle = true,
}: SearchResultsMetaCompactProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b">
      <p className="text-sm text-muted-foreground">
        {isLoading ? (
          <span className="inline-block w-32 h-4 bg-muted animate-pulse rounded" />
        ) : (
          <>
            <strong className="text-foreground">{formatResultCount(totalResults)}</strong> résultats
            {searchQuery && <> pour &quot;<span className="text-green-600">{searchQuery}</span>&quot;</>}
          </>
        )}
      </p>

      <div className="flex items-center gap-2">
        <Select value={currentSort} onValueChange={onSortChange}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showViewToggle && (
          <div className="hidden sm:flex border rounded overflow-hidden">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`p-1.5 transition-colors ${
                viewMode === "grid" ? "bg-green-600 text-white" : "hover:bg-muted"
              }`}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`p-1.5 transition-colors ${
                viewMode === "list" ? "bg-green-600 text-white" : "hover:bg-muted"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResultsMeta;
