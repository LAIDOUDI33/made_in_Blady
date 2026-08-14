"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  X,
  SlidersHorizontal,
  MapPin,
  Shield,
  Package,
  Star,
  Clock,
  Building2,
  DollarSign,
  Filter,
} from "lucide-react";
import { ALGERIAN_WILAYAS, AVAILABILITY_OPTIONS, SORT_OPTIONS } from "@/types/product";

// ============================================
// Types
// ============================================

export interface AdvancedFilterState {
  // Product filters
  categories: string[];
  wilayas: string[];
  minPrice: number;
  maxPrice: number;
  minMoq: number;
  maxMoq: number;
  verifiedOnly: boolean;
  availability: string[];
  countryOfOrigin: string;
  minRating: number;
  datePosted: string;
  leadTime: string;

  // Supplier filters
  businessTypes: string[];
  supplierWilayas: string[];
  supplierVerifiedOnly: boolean;
  minProductsCount: number;
  supplierMinRating: number;
  minResponseRate: number;
  yearsInBusiness: string;

  // RFQ filters
  rfqCategories: string[];
  rfqQuantityRange: [number, number];
  rfqBudgetRange: [number, number];
  rfqLocation: string;
  rfqStatus: string[];

  // Common
  sortBy: string;
}

export const defaultAdvancedFilters: AdvancedFilterState = {
  categories: [],
  wilayas: [],
  minPrice: 0,
  maxPrice: 10000000,
  minMoq: 0,
  maxMoq: 100000,
  verifiedOnly: false,
  availability: [],
  countryOfOrigin: "",
  minRating: 0,
  datePosted: "",
  leadTime: "",
  businessTypes: [],
  supplierWilayas: [],
  supplierVerifiedOnly: false,
  minProductsCount: 0,
  supplierMinRating: 0,
  minResponseRate: 0,
  yearsInBusiness: "",
  rfqCategories: [],
  rfqQuantityRange: [0, 1000000],
  rfqBudgetRange: [0, 100000000],
  rfqLocation: "",
  rfqStatus: [],
  sortBy: "relevance",
};

interface AdvancedFiltersProps {
  filterType?: "products" | "suppliers" | "rfqs" | "all";
  onFiltersChange: (filters: AdvancedFilterState) => void;
  currentFilters: AdvancedFilterState;
  categories?: { id: string; name: string; slug: string; productCount?: number; subcategories?: any[] }[];
}

// ============================================
// Business types for Algerian companies
// ============================================

const BUSINESS_TYPES = [
  { value: "SARL", label: "SARL" },
  { value: "EURL", label: "EURL" },
  { value: "SPA", label: "SPA" },
  { value: "SNC", label: "SNC" },
  { value: "SAS", label: "SAS" },
  { value: "Artisan", label: "Artisan / Individuel" },
];

const COUNTRIES_OF_ORIGIN = [
  { value: "DZ", label: "Algérie 🇩🇿" },
  { value: "CN", label: "Chine 🇨🇳" },
  { value: "FR", label: "France 🇫🇷" },
  { value: "TR", label: "Turquie 🇹🇷" },
  { value: "IT", label: "Italie 🇮🇹" },
  { value: "ES", label: "Espagne 🇪🇸" },
  { value: "DE", label: "Allemagne 🇩🇪" },
  { value: "TN", label: "Tunisie 🇹🇳" },
  { value: "MA", label: "Maroc 🇲🇦" },
  { value: "EG", label: "Égypte 🇪🇬" },
  { value: "IN", label: "Inde 🇮🇳" },
  { value: "OTHER", label: "Autre" },
];

const DATE_POSTED_OPTIONS = [
  { value: "", label: "Toutes les dates" },
  { value: "last24h", label: "Dernières 24h" },
  { value: "lastWeek", label: "Dernière semaine" },
  { value: "lastMonth", label: "Dernier mois" },
  { value: "last3months", label: "Derniers 3 mois" },
];

const LEAD_TIME_OPTIONS = [
  { value: "", label: "Tous les délais" },
  { value: "stock", label: "En stock immédiat" },
  { value: "1-3", label: "1-3 jours" },
  { value: "1-2", label: "1-2 semaines" },
  { value: "2-4", label: "2-4 semaines" },
  { value: "1-2m", label: "1-2 mois" },
  { value: "2m+", label: "+2 mois" },
];

const RATING_OPTIONS = [
  { value: "0", label: "Tous" },
  { value: "3", label: "3+ ⭐" },
  { value: "3.5", label: "3.5+ ⭐" },
  { value: "4", label: "4+ ⭐⭐" },
  { value: "4.5", label: "4.5+ ⭐⭐⭐" },
];

const YEARS_IN_BUSINESS_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "1", label: "+1 an" },
  { value: "3", label: "+3 ans" },
  { value: "5", label: "+5 ans" },
  { value: "10", label: "+10 ans" },
  { value: "20", label: "+20 ans" },
];

const RFQ_STATUS_OPTIONS = [
  { value: "open", label: "Ouvert" },
  { value: "closing_soon", label: "Clôture proche" },
  { value: "awarded", label: "Attribué" },
];

// ============================================
// Helper Components (defined outside main component)
// ============================================

function FilterSectionTitle({ icon: Icon, title, active }: { icon: React.ElementType; title: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-semibold">{title}</span>
      {active && <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700">Actif</Badge>}
    </div>
  );
}

function ActiveFilterCount({ count }: { count: number }) {
  if (count === 0) return null;
  return <Badge className="bg-green-600 text-white ml-2">{count}</Badge>;
}

function getActiveFilterCount(currentFilters: AdvancedFilterState): number {
  let count = 0;
  if (currentFilters.categories.length > 0) count++;
  if (currentFilters.wilayas.length > 0) count++;
  if (currentFilters.minPrice > 0 || currentFilters.maxPrice < 10000000) count++;
  if (currentFilters.minMoq > 0 || currentFilters.maxMoq < 100000) count++;
  if (currentFilters.verifiedOnly) count++;
  if (currentFilters.availability.length > 0) count++;
  if (currentFilters.countryOfOrigin) count++;
  if (currentFilters.minRating > 0) count++;
  if (currentFilters.datePosted) count++;
  if (currentFilters.leadTime) count++;
  if (currentFilters.businessTypes.length > 0) count++;
  if (currentFilters.supplierWilayas.length > 0) count++;
  if (currentFilters.supplierVerifiedOnly) count++;
  if (currentFilters.yearsInBusiness) count++;
  if (currentFilters.rfqStatus.length > 0) count++;
  return count;
}

// ============================================
// Main Advanced Filters Component
// ============================================

export function AdvancedFilters({
  filterType = "all",
  onFiltersChange,
  currentFilters,
  categories = [],
}: AdvancedFiltersProps) {
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([
    currentFilters.minPrice || 0,
    currentFilters.maxPrice || 10000000,
  ]);
  const [localMoqRange, setLocalMoqRange] = useState<[number, number]>([
    currentFilters.minMoq || 0,
    currentFilters.maxMoq || 100000,
  ]);

  const formatPrice = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${Math.round(value / 1000)}K`;
    return value.toString();
  };

  const updateFilter = useCallback((updates: Partial<AdvancedFilterState>) => {
    onFiltersChange({ ...currentFilters, ...updates });
  }, [currentFilters, onFiltersChange]);

  const toggleArrayFilter = useCallback((key: keyof AdvancedFilterState, value: string) => {
    const currentArray = (currentFilters[key] as string[]) || [];
    const updated = currentArray.includes(value)
      ? currentArray.filter((v) => v !== value)
      : [...currentArray, value];
    updateFilter({ [key]: updated });
  }, [currentFilters, updateFilter]);

  const clearAllFilters = () => {
    onFiltersChange(defaultAdvancedFilters);
    setLocalPriceRange([0, 10000000]);
    setLocalMoqRange([0, 100000]);
  };

  const activeCount = getActiveFilterCount(currentFilters);

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">
        <Card className="sticky top-24">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                Filtres Avancés
                <ActiveFilterCount count={activeCount} />
              </CardTitle>
              {activeCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-red-500 hover:text-red-600 h-8">
                  <X className="h-4 w-4 mr-1" />
                  Tout effacer
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={["categories", "price"]}>
              {/* ==================== PRODUCT FILTERS ==================== */}
              {(filterType === "all" || filterType === "products") && (
                <>
                  {/* Categories - Multi-select Tree */}
                  <AccordionItem value="categories" className="border-none">
                    <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
                      <FilterSectionTitle 
                        icon={Package} 
                        title="Catégories" 
                        active={currentFilters.categories.length > 0}
                      />
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {categories.map((category) => (
                          <div key={category.id} className="space-y-1">
                            <label className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors">
                              <Checkbox
                                checked={currentFilters.categories.includes(category.id)}
                                onCheckedChange={() => toggleArrayFilter("categories", category.id)}
                                className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                              />
                              <span className="text-sm flex-1">{category.name}</span>
                              {category.productCount !== undefined && (
                                <span className="text-xs text-muted-foreground">({category.productCount})</span>
                              )}
                            </label>

                            {/* Subcategories */}
                            {category.subcategories && category.subcategories.length > 0 &&
                              currentFilters.categories.includes(category.id) && (
                                <div className="ml-6 space-y-1 border-l-2 border-green-100 pl-3">
                                  {category.subcategories.map((sub: any) => (
                                    <label key={sub.id} className="flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-muted transition-colors">
                                      <Checkbox
                                        checked={currentFilters.categories.includes(sub.id)}
                                        onCheckedChange={() => toggleArrayFilter("categories", sub.id)}
                                        className="h-4 w-4 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                      />
                                      <span className="text-sm">{sub.name}</span>
                                    </label>
                                  ))}
                                </div>
                              )
                            }
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Price Range Slider */}
                  <AccordionItem value="price" className="border-none">
                    <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
                      <FilterSectionTitle 
                        icon={DollarSign} 
                        title="Fourchette de Prix"
                        active={currentFilters.minPrice > 0 || currentFilters.maxPrice < 10000000}
                      />
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                      <div className="space-y-4">
                        <Slider
                          value={localPriceRange}
                          min={0}
                          max={10000000}
                          step={10000}
                          onValueChange={(value) => setLocalPriceRange(value as [number, number])}
                          onValueCommit={(value) => updateFilter({ minPrice: value[0], maxPrice: value[1] })}
                          className="[&_[role=slider]]:bg-green-600 [&_[role=slider]]:border-green-600"
                        />
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Min (DZD)</Label>
                            <Input
                              type="number"
                              value={localPriceRange[0]}
                              onChange={(e) => setLocalPriceRange([parseInt(e.target.value) || 0, localPriceRange[1]])}
                              onBlur={() => updateFilter({ minPrice: localPriceRange[0], maxPrice: localPriceRange[1] })}
                              className="h-8 text-sm"
                            />
                          </div>
                          <span className="mt-5 text-muted-foreground">-</span>
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Max (DZD)</Label>
                            <Input
                              type="number"
                              value={localPriceRange[1]}
                              onChange={(e) => setLocalPriceRange([localPriceRange[0], parseInt(e.target.value) || 10000000])}
                              onBlur={() => updateFilter({ minPrice: localPriceRange[0], maxPrice: localPriceRange[1] })}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          {formatPrice(localPriceRange[0])} DZD - {formatPrice(localPriceRange[1])} DZD
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Wilaya/Location - Multi-select */}
                  <AccordionItem value="location" className="border-none">
                    <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
                      <FilterSectionTitle 
                        icon={MapPin} 
                        title="Localisation (Wilaya)"
                        active={currentFilters.wilayas.length > 0}
                      />
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                      <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-1">
                          {ALGERIAN_WILAYAS.map((wilaya) => (
                            <button
                              key={wilaya.code}
                              onClick={() => toggleArrayFilter("wilayas", wilaya.name)}
                              className={`text-left px-2 py-1.5 rounded text-xs transition-colors ${
                                currentFilters.wilayas.includes(wilaya.name)
                                  ? "bg-green-600 text-white"
                                  : "hover:bg-muted"
                              }`}
                            >
                              {wilaya.code} - {wilaya.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Supplier Verification */}
                  <AccordionItem value="verification" className="border-none">
                    <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
                      <FilterSectionTitle 
                        icon={Shield} 
                        title="Fournisseur Vérifié"
                        active={currentFilters.verifiedOnly}
                      />
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                      <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors">
                        <Checkbox
                          checked={currentFilters.verifiedOnly}
                          onCheckedChange={(checked) => updateFilter({ verifiedOnly: !!checked })}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <div>
                          <p className="text-sm font-medium">Uniquement vérifiés</p>
                          <p className="text-xs text-muted-foreground">Entreprises avec documents vérifiés</p>
                        </div>
                      </label>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Availability */}
                  <AccordionItem value="availability" className="border-none">
                    <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
                      <FilterSectionTitle 
                        icon={Package} 
                        title="Disponibilité"
                        active={currentFilters.availability.length > 0}
                      />
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                      <div className="space-y-2">
                        {AVAILABILITY_OPTIONS.map((option) => (
                          <label key={option.value} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted transition-colors">
                            <Checkbox
                              checked={currentFilters.availability.includes(option.value)}
                              onCheckedChange={() => toggleArrayFilter("availability", option.value)}
                            />
                            <Badge variant="outline" className={`${option.color} border-0`}>{option.label}</Badge>
                          </label>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* MOQ Range */}
                  <AccordionItem value="moq" className="border-none">
                    <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
                      <FilterSectionTitle 
                        icon={Package} 
                        title="Quantité Minimale (MOQ)"
                        active={currentFilters.minMoq > 0 || currentFilters.maxMoq < 100000}
                      />
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                      <div className="space-y-4">
                        <Slider
                          value={localMoqRange}
                          min={0}
                          max={100000}
                          step={100}
                          onValueChange={(value) => setLocalMoqRange(value as [number, number])}
                          onValueCommit={(value) => updateFilter({ minMoq: value[0], maxMoq: value[1] })}
                          className="[&_[role=slider]]:bg-green-600 [&_[role=slider]]:border-green-600"
                        />
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Min</Label>
                            <Input
                              type="number"
                              value={localMoqRange[0]}
                              onChange={(e) => setLocalMoqRange([parseInt(e.target.value) || 0, localMoqRange[1]])}
                              onBlur={() => updateFilter({ minMoq: localMoqRange[0], maxMoq: localMoqRange[1] })}
                              className="h-8 text-sm"
                            />
                          </div>
                          <span className="mt-5 text-muted-foreground">-</span>
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Max</Label>
                            <Input
                              type="number"
                              value={localMoqRange[1]}
                              onChange={(e) => setLocalMoqRange([localMoqRange[0], parseInt(e.target.value) || 100000])}
                              onBlur={() => updateFilter({ minMoq: localMoqRange[0], maxMoq: localMoqRange[1] })}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Lead Time */}
                  <AccordionItem value="leadTime" className="border-none">
                    <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
                      <FilterSectionTitle 
                        icon={Clock} 
                        title="Délai de Livraison"
                        active={!!currentFilters.leadTime}
                      />
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                      <Select value={currentFilters.leadTime} onValueChange={(val) => updateFilter({ leadTime: val })}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner un délai" />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_TIME_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Country of Origin */}
                  <AccordionItem value="origin" className="border-none">
                    <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
                      <FilterSectionTitle 
                        icon={MapPin} 
                        title="Origine"
                        active={!!currentFilters.countryOfOrigin}
                      />
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                      <Select value={currentFilters.countryOfOrigin} onValueChange={(val) => updateFilter({ countryOfOrigin: val })}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tous les pays" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES_OF_ORIGIN.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Rating */}
                  <AccordionItem value="rating" className="border-none">
                    <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
                      <FilterSectionTitle 
                        icon={Star} 
                        title="Note Minimum"
                        active={currentFilters.minRating > 0}
                      />
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                      <div className="space-y-2">
                        {RATING_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => updateFilter({ minRating: parseFloat(opt.value) })}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              currentFilters.minRating === parseFloat(opt.value)
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                                : "hover:bg-muted"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Date Posted */}
                  <AccordionItem value="datePosted" className="border-none">
                    <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
                      <FilterSectionTitle 
                        icon={Clock} 
                        title="Date de Publication"
                        active={!!currentFilters.datePosted}
                      />
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                      <Select value={currentFilters.datePosted} onValueChange={(val) => updateFilter({ datePosted: val })}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Toutes les dates" />
                        </SelectTrigger>
                        <SelectContent>
                          {DATE_POSTED_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </AccordionContent>
                  </AccordionItem>
                </>
              )}

              {/* ==================== SUPPLIER FILTERS ==================== */}
              {(filterType === "all" || filterType === "suppliers") && (
                <>
                  <Separator className="my-2" />

                  {/* Business Type */}
                  <AccordionItem value="businessType" className="border-none">
                    <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
                      <FilterSectionTitle 
                        icon={Building2} 
                        title="Type d'Entreprise"
                        active={currentFilters.businessTypes.length > 0}
                      />
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                      <div className="space-y-2">
                        {BUSINESS_TYPES.map((type) => (
                          <label key={type.value} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted transition-colors">
                            <Checkbox
                              checked={currentFilters.businessTypes.includes(type.value)}
                              onCheckedChange={() => toggleArrayFilter("businessTypes", type.value)}
                            />
                            <span className="text-sm">{type.label}</span>
                          </label>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Supplier Location */}
                  <AccordionItem value="supplierLocation" className="border-none">
                    <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
                      <FilterSectionTitle 
                        icon={MapPin} 
                        title="Localisation Fournisseur"
                        active={currentFilters.supplierWilayas.length > 0}
                      />
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                      <div className="max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-1">
                          {ALGERIAN_WILAYAS.slice(0, 20).map((wilaya) => (
                            <button
                              key={`sw-${wilaya.code}`}
                              onClick={() => toggleArrayFilter("supplierWilayas", wilaya.name)}
                              className={`text-left px-2 py-1.5 rounded text-xs transition-colors ${
                                currentFilters.supplierWilayas.includes(wilaya.name)
                                  ? "bg-blue-600 text-white"
                                  : "hover:bg-muted"
                              }`}
                            >
                              {wilaya.code} - {wilaya.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Years in Business */}
                  <AccordionItem value="yearsInBusiness" className="border-none">
                    <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
                      <FilterSectionTitle 
                        icon={Clock} 
                        title="Ancienneté"
                        active={!!currentFilters.yearsInBusiness}
                      />
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                      <div className="space-y-2">
                        {YEARS_IN_BUSINESS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => updateFilter({ yearsInBusiness: opt.value })}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              currentFilters.yearsInBusiness === opt.value
                                ? "bg-blue-100 text-blue-800 border border-blue-300"
                                : "hover:bg-muted"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </>
              )}

              {/* ==================== RFQ FILTERS ==================== */}
              {(filterType === "all" || filterType === "rfqs") && (
                <>
                  <Separator className="my-2" />

                  {/* RFQ Status */}
                  <AccordionItem value="rfqStatus" className="border-none">
                    <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
                      <FilterSectionTitle 
                        icon={Clock} 
                        title="Statut RFQ"
                        active={currentFilters.rfqStatus.length > 0}
                      />
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-0">
                      <div className="space-y-2">
                        {RFQ_STATUS_OPTIONS.map((status) => (
                          <label key={status.value} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted transition-colors">
                            <Checkbox
                              checked={currentFilters.rfqStatus.includes(status.value)}
                              onCheckedChange={() => toggleArrayFilter("rfqStatus", status.value)}
                            />
                            <span className="text-sm">{status.label}</span>
                          </label>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </>
              )}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Mobile - Sheet */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
              {activeCount > 0 && (
                <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-green-600 text-white text-[10px]">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                Filtres Avancés
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold">Filtres Avancés</span>
                    {activeCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-red-500 h-7 text-xs">
                        Effacer
                      </Button>
                    )}
                  </div>
                  
                  <Accordion type="multiple" defaultValue={["categories", "price"]}>
                    {(filterType === "all" || filterType === "products") && (
                      <>
                        <AccordionItem value="categories" className="border-none">
                          <AccordionTrigger className="py-2 text-sm"><FilterSectionTitle icon={Package} title="Catégories" /></AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-1">
                              {categories.map((cat) => (
                                <label key={cat.id} className="flex items-center gap-2 p-1.5 text-sm">
                                  <Checkbox checked={currentFilters.categories.includes(cat.id)} onCheckedChange={() => toggleArrayFilter("categories", cat.id)} />
                                  {cat.name}
                                </label>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="price" className="border-none">
                          <AccordionTrigger className="py-2 text-sm"><FilterSectionTitle icon={DollarSign} title="Prix" /></AccordionTrigger>
                          <AccordionContent>
                            <Slider value={localPriceRange} min={0} max={10000000} step={1000} onValueChange={(v) => setLocalPriceRange(v as [number, number])} onValueCommit={(v) => updateFilter({ minPrice: v[0], maxPrice: v[1] })} />
                            <p className="text-xs text-center mt-2">{formatPrice(localPriceRange[0])} - {formatPrice(localPriceRange[1])} DZD</p>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="location" className="border-none">
                          <AccordionTrigger className="py-2 text-sm"><FilterSectionTitle icon={MapPin} title="Wilaya" /></AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                              {ALGERIAN_WILAYAS.slice(0, 16).map((w) => (
                                <button key={w.code} onClick={() => toggleArrayFilter("wilayas", w.name)} className={`text-xs p-1 rounded ${currentFilters.wilayas.includes(w.name) ? 'bg-green-600 text-white' : 'hover:bg-muted'}`}>
                                  {w.code}-{w.name}
                                </button>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </>
                    )}
                    
                    {(filterType === "all" || filterType === "suppliers") && (
                      <>
                        <Separator className="my-2" />
                        <AccordionItem value="businessType" className="border-none">
                          <AccordionTrigger className="py-2 text-sm"><FilterSectionTitle icon={Building2} title="Type Entreprise" /></AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-1">
                              {BUSINESS_TYPES.map((t) => (
                                <label key={t.value} className="flex items-center gap-2 p-1.5 text-sm">
                                  <Checkbox checked={currentFilters.businessTypes.includes(t.value)} onCheckedChange={() => toggleArrayFilter("businessTypes", t.value)} />
                                  {t.label}
                                </label>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </>
                    )}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

export default AdvancedFilters;
