"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X,
  MapPin,
  Shield,
  Package,
  Star,
  Clock,
  DollarSign,
  Building2,
  Filter,
} from "lucide-react";
import { AdvancedFilterState, defaultAdvancedFilters } from "./AdvancedFilters";

// ============================================
// Types
// ============================================

interface ActiveFilterTag {
  id: string;
  label: string;
  icon?: React.ElementType;
  value: string;
  category: string;
}

interface ActiveFiltersProps {
  filters: AdvancedFilterState;
  onRemoveFilter: (category: string, value?: string) => void;
  onClearAll: () => void;
  categories?: { id: string; name: string }[];
}

// ============================================
// Helper to get filter display labels
// ============================================

function getFilterLabel(category: string, value: string, categories?: { id: string; name: string }[]): string {
  switch (category) {
    case "categories":
      return categories?.find((c) => c.id === value)?.name || value;
    case "wilayas":
    case "supplierWilayas":
      return value;
    case "availability":
      const availLabels: Record<string, string> = {
        in_stock: "En Stock",
        pre_order: "Pré-commande",
        out_of_stock: "Rupture de Stock",
        discontinued: "Discontinué",
      };
      return availLabels[value] || value;
    case "countryOfOrigin":
      const countryLabels: Record<string, string> = {
        DZ: "Algérie",
        CN: "Chine",
        FR: "France",
        TR: "Turquie",
        IT: "Italie",
        ES: "Espagne",
        DE: "Allemagne",
        TN: "Tunisie",
        MA: "Maroc",
        EG: "Égypte",
        IN: "Inde",
      };
      return countryLabels[value] || value;
    case "datePosted":
      const dateLabels: Record<string, string> = {
        last24h: "24h",
        lastWeek: "1 semaine",
        lastMonth: "1 mois",
        last3months: "3 mois",
      };
      return dateLabels[value] || value;
    case "leadTime":
      const leadLabels: Record<string, string> = {
        stock: "Stock immédiat",
        "1-3": "1-3 jours",
        "1-2": "1-2 semaines",
        "2-4": "2-4 semaines",
        "1-2m": "1-2 mois",
        "2m+": "+2 mois",
      };
      return leadLabels[value] || value;
    case "businessTypes":
      return value;
    case "yearsInBusiness":
      return `+${value} ans`;
    case "rfqStatus":
      const statusLabels: Record<string, string> = {
        open: "Ouvert",
        closing_soon: "Clôture proche",
        awarded: "Attribué",
      };
      return statusLabels[value] || value;
    case "sortBy":
      const sortLabels: Record<string, string> = {
        relevance: "Pertinence",
        price_asc: "Prix croissant",
        price_desc: "Prix décroissant",
        newest: "Plus récent",
        rating: "Mieux notés",
        most_viewed: "Plus vus",
      };
      return sortLabels[value] || value;
    default:
      return value;
  }
}

function getFilterIcon(category: string): React.ElementType | undefined {
  switch (category) {
    case "categories":
      return Package;
    case "wilayas":
    case "supplierWilayas":
    case "rfqLocation":
      return MapPin;
    case "verifiedOnly":
    case "supplierVerifiedOnly":
      return Shield;
    case "availability":
      return Package;
    case "minPrice":
    case "maxPrice":
      return DollarSign;
    case "minMoq":
    case "maxMoq":
      return Package;
    case "minRating":
    case "supplierMinRating":
      return Star;
    case "datePosted":
    case "leadTime":
    case "yearsInBusiness":
      return Clock;
    case "businessTypes":
      return Building2;
    case "countryOfOrigin":
      return MapPin;
    case "sortBy":
      return Filter;
    default:
      return undefined;
  }
}

// ============================================
// Main Component
// ============================================

export function ActiveFilters({ filters, onRemoveFilter, onClearAll, categories }: ActiveFiltersProps) {
  // Generate active filter tags
  const getActiveFilters = (): ActiveFilterTag[] => {
    const tags: ActiveFilterTag[] = [];

    // Category filters
    filters.categories.forEach((catId) => {
      tags.push({
        id: `cat-${catId}`,
        label: getFilterLabel("categories", catId, categories),
        icon: Package,
        value: catId,
        category: "categories",
      });
    });

    // Wilaya filters
    filters.wilayas.forEach((wilaya) => {
      tags.push({
        id: `wilaya-${wilaya}`,
        label: wilaya,
        icon: MapPin,
        value: wilaya,
        category: "wilayas",
      });
    });

    // Price range
    if (filters.minPrice > 0 || filters.maxPrice < 10000000) {
      const priceLabel =
        filters.minPrice > 0 && filters.maxPrice < 10000000
          ? `${(filters.minPrice / 1000).toFixed(0)}K - ${(filters.maxPrice / 1000000).toFixed(1)}M DZD`
          : filters.minPrice > 0
          ? `Min ${(filters.minPrice / 1000).toFixed(0)}K`
          : `Max ${(filters.maxPrice / 1000000).toFixed(1)}M`;
      
      tags.push({
        id: "price-range",
        label: priceLabel,
        icon: DollarSign,
        value: priceLabel,
        category: "priceRange",
      });
    }

    // MOQ range
    if (filters.minMoq > 0 || filters.maxMoq < 100000) {
      const moqLabel =
        filters.minMoq > 0 && filters.maxMoq < 100000
          ? `MOQ: ${filters.minMoq} - ${filters.maxMoq}`
          : filters.minMoq > 0
          ? `MOQ min: ${filters.minMoq}`
          : `MOQ max: ${filters.maxMoq}`;
      
      tags.push({
        id: "moq-range",
        label: moqLabel,
        icon: Package,
        value: moqLabel,
        category: "moqRange",
      });
    }

    // Verified only
    if (filters.verifiedOnly) {
      tags.push({
        id: "verified-only",
        label: "Vérifiés uniquement",
        icon: Shield,
        value: "true",
        category: "verifiedOnly",
      });
    }

    // Availability
    filters.availability.forEach((avail) => {
      tags.push({
        id: `avail-${avail}`,
        label: getFilterLabel("availability", avail),
        icon: Package,
        value: avail,
        category: "availability",
      });
    });

    // Country of origin
    if (filters.countryOfOrigin) {
      tags.push({
        id: "origin",
        label: getFilterLabel("countryOfOrigin", filters.countryOfOrigin),
        icon: MapPin,
        value: filters.countryOfOrigin,
        category: "countryOfOrigin",
      });
    }

    // Min rating
    if (filters.minRating > 0) {
      tags.push({
        id: "min-rating",
        label: `${filters.minRating}+ ⭐`,
        icon: Star,
        value: String(filters.minRating),
        category: "minRating",
      });
    }

    // Date posted
    if (filters.datePosted) {
      tags.push({
        id: "date-posted",
        label: getFilterLabel("datePosted", filters.datePosted),
        icon: Clock,
        value: filters.datePosted,
        category: "datePosted",
      });
    }

    // Lead time
    if (filters.leadTime) {
      tags.push({
        id: "lead-time",
        label: getFilterLabel("leadTime", filters.leadTime),
        icon: Clock,
        value: filters.leadTime,
        category: "leadTime",
      });
    }

    // Business types
    filters.businessTypes.forEach((type) => {
      tags.push({
        id: `biz-${type}`,
        label: type,
        icon: Building2,
        value: type,
        category: "businessTypes",
      });
    });

    // Supplier wilayas
    filters.supplierWilayas.forEach((wilaya) => {
      tags.push({
        id: `swilaya-${wilaya}`,
        label: wilaya,
        icon: MapPin,
        value: wilaya,
        category: "supplierWilayas",
      });
    });

    // Years in business
    if (filters.yearsInBusiness) {
      tags.push({
        id: "years-business",
        label: getFilterLabel("yearsInBusiness", filters.yearsInBusiness),
        icon: Clock,
        value: filters.yearsInBusiness,
        category: "yearsInBusiness",
      });
    }

    // RFQ status
    filters.rfqStatus.forEach((status) => {
      tags.push({
        id: `rfq-status-${status}`,
        label: getFilterLabel("rfqStatus", status),
        icon: Clock,
        value: status,
        category: "rfqStatus",
      });
    });

    // Sort by
    if (filters.sortBy !== "relevance") {
      tags.push({
        id: "sort-by",
        label: `Trier: ${getFilterLabel("sortBy", filters.sortBy)}`,
        icon: Filter,
        value: filters.sortBy,
        category: "sortBy",
      });
    }

    return tags;
  };

  const activeFilters = getActiveFilters();

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Filter Tags */}
      <div className="flex flex-wrap gap-2 flex-1 min-w-0">
        {activeFilters.map((filter) => (
          <Badge
            key={filter.id}
            variant="secondary"
            className="gap-1 pr-1 pl-2 py-1.5 h-auto text-sm bg-green-50 text-green-800 hover:bg-green-100 border border-green-200"
          >
            {filter.icon && <filter.icon className="h-3 w-3" />}
            <span className="truncate max-w-[150px]">{filter.label}</span>
            <button
              onClick={() => onRemoveFilter(filter.category, filter.value)}
              className="ml-1 p-0.5 rounded-full hover:bg-green-200 transition-colors"
              aria-label={`Supprimer le filtre ${filter.label}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Clear All Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
      >
        <X className="h-4 w-4 mr-1" />
        Tout effacer
      </Button>

      {/* Filter Count */}
      <span className="text-sm text-muted-foreground hidden sm:inline">
        {activeFilters.length} filtre{activeFilters.length > 1 ? "s" : ""}
      </span>
    </div>
  );
}

export default ActiveFilters;
