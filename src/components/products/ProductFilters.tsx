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
} from "lucide-react";
import {
  CategoryInfo,
  ALGERIAN_WILAYAS,
  AVAILABILITY_OPTIONS,
} from "@/types/product";

export interface FilterState {
  category: string;
  subcategory: string;
  wilaya: string;
  minPrice: number;
  maxPrice: number;
  minMoq: number;
  maxMoq: number;
  verifiedOnly: boolean;
  availability: string[];
}

interface ProductFiltersProps {
  categories?: CategoryInfo[];
  onFiltersChange: (filters: Partial<FilterState>) => void;
  currentFilters: FilterState;
  priceRange?: [number, number];
  moqRange?: [number, number];
}

const defaultFilters: FilterState = {
  category: "",
  subcategory: "",
  wilaya: "",
  minPrice: 0,
  maxPrice: 10000000,
  minMoq: 0,
  maxMoq: 100000,
  verifiedOnly: false,
  availability: [],
};

// Extracted inner components to avoid "component created during render" warning
function DesktopSidebarContent({
  categories,
  onFiltersChange,
  currentFilters,
  priceRange,
  moqRange,
}: ProductFiltersProps) {
  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" />
          Filtres
          <FilterActiveCount currentFilters={currentFilters} priceRange={priceRange} moqRange={moqRange} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FilterContentInner
          categories={categories}
          onFiltersChange={onFiltersChange}
          currentFilters={currentFilters}
          priceRange={priceRange}
          moqRange={moqRange}
        />
      </CardContent>
    </Card>
  );
}

function MobileDrawerContent({
  categories,
  onFiltersChange,
  currentFilters,
  priceRange,
  moqRange,
}: ProductFiltersProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
          <FilterBadgeCount currentFilters={currentFilters} priceRange={priceRange} moqRange={moqRange} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Filtres de Recherche
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <FilterContentInner
            categories={categories}
            onFiltersChange={onFiltersChange}
            currentFilters={currentFilters}
            priceRange={priceRange}
            moqRange={moqRange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helper components for filter count badge
function FilterActiveCount({ 
  currentFilters, 
  priceRange = [0, 10000000], 
  moqRange = [0, 100000] 
}: { 
  currentFilters: FilterState; 
  priceRange?: [number, number]; 
  moqRange?: [number, number]; 
}) {
  const count = getActiveFilterCount(currentFilters, priceRange, moqRange);
  
  if (count > 0) {
    return <Badge className="ml-auto bg-green-600 text-white">{count}</Badge>;
  }
  return null;
}

function FilterBadgeCount({ 
  currentFilters, 
  priceRange = [0, 10000000], 
  moqRange = [0, 100000] 
}: { 
  currentFilters: FilterState; 
  priceRange?: [number, number]; 
  moqRange?: [number, number]; 
}) {
  const count = getActiveFilterCount(currentFilters, priceRange, moqRange);
  
  if (count > 0) {
    return (
      <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-green-600 text-white text-[10px]">
        {count}
      </Badge>
    );
  }
  return null;
}

// Main filter content component
function FilterContentInner({
  categories = [],
  onFiltersChange,
  currentFilters,
  priceRange = [0, 10000000],
  moqRange = [0, 100000],
}: ProductFiltersProps) {
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([
    currentFilters.minPrice || priceRange[0],
    currentFilters.maxPrice || priceRange[1],
  ]);
  const [localMoqRange, setLocalMoqRange] = useState<[number, number]>([
    currentFilters.minMoq || moqRange[0],
    currentFilters.maxMoq || moqRange[1],
  ]);

  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${Math.round(value / 1000)}K`;
    }
    return value.toString();
  };

  const handleCategoryChange = (categoryId: string) => {
    onFiltersChange({
      category: categoryId === currentFilters.category ? "" : categoryId,
      subcategory: "",
    });
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    onFiltersChange({
      subcategory:
        subcategoryId === currentFilters.subcategory ? "" : subcategoryId,
    });
  };

  const handleWilayaChange = (wilayaName: string) => {
    onFiltersChange({
      wilaya: wilayaName === currentFilters.wilaya ? "" : wilayaName,
    });
  };

  const handleAvailabilityToggle = (availability: string) => {
    const newAvailability = currentFilters.availability.includes(availability)
      ? currentFilters.availability.filter((a) => a !== availability)
      : [...currentFilters.availability, availability];
    onFiltersChange({ availability: newAvailability });
  };

  const handlePriceCommit = () => {
    onFiltersChange({
      minPrice: localPriceRange[0],
      maxPrice: localPriceRange[1],
    });
  };

  const handleMoqCommit = () => {
    onFiltersChange({
      minMoq: localMoqRange[0],
      maxMoq: localMoqRange[1],
    });
  };

  const clearAllFilters = () => {
    onFiltersChange(defaultFilters);
    setLocalPriceRange([priceRange[0], priceRange[1]]);
    setLocalMoqRange([moqRange[0], moqRange[1]]);
  };

  const activeFilterCount = getActiveFilterCount(currentFilters, priceRange, moqRange);

  return (
    <div className="space-y-4">
      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between pb-2 border-b">
          <span className="text-sm text-muted-foreground">
            {activeFilterCount} filtre(s) actif(s)
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Tout effacer
          </Button>
        </div>
      )}

      {/* Categories */}
      <Accordion type="multiple" defaultValue={["categories"]}>
        <AccordionItem value="categories" className="border-none">
          <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Catégories
              {currentFilters.category && (
                <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">
                  Actif
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-0">
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {categories.map((category) => (
                <div key={category.id} className="space-y-1">
                  <div
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                      currentFilters.category === category.id
                        ? "bg-green-50 border border-green-200"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    <Checkbox
                      checked={currentFilters.category === category.id}
                      readOnly
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <span className="text-sm flex-1">{category.name}</span>
                    {category.icon && <span>{category.icon}</span>}
                    {category.productCount !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        ({category.productCount})
                      </span>
                    )}
                  </div>

                  {category.subcategories &&
                    category.subcategories.length > 0 &&
                    currentFilters.category === category.id && (
                      <div className="ml-6 space-y-1 border-l-2 border-green-100 pl-3">
                        {category.subcategories.map((sub) => (
                          <div
                            key={sub.id}
                            className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                              currentFilters.subcategory === sub.id
                                ? "bg-green-50"
                                : "hover:bg-muted"
                            }`}
                            onClick={() => handleSubcategoryChange(sub.id)}
                          >
                            <Checkbox
                              checked={currentFilters.subcategory === sub.id}
                              readOnly
                              className="h-4 w-4 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                            <span className="text-sm">{sub.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">
                  Aucune catégorie disponible
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range */}
        <AccordionItem value="price" className="border-none">
          <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <span>💰</span>
              Fourchette de Prix
              {(currentFilters.minPrice !== priceRange[0] ||
                currentFilters.maxPrice !== priceRange[1]) && (
                <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">
                  Actif
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-0">
            <div className="space-y-4">
              <Slider
                value={localPriceRange}
                min={priceRange[0]}
                max={priceRange[1]}
                step={1000}
                onValueChange={(value) =>
                  setLocalPriceRange(value as [number, number])
                }
                onValueCommit={handlePriceCommit}
                className="[&_[role=slider]]:bg-green-600 [&_[role=slider]]:border-green-600"
              />
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Min</Label>
                  <Input
                    type="number"
                    value={localPriceRange[0]}
                    onChange={(e) =>
                      setLocalPriceRange([
                        parseInt(e.target.value) || 0,
                        localPriceRange[1],
                      ])
                    }
                    onBlur={handlePriceCommit}
                    className="h-8 text-sm"
                  />
                </div>
                <span className="mt-5 text-muted-foreground">-</span>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Max</Label>
                  <Input
                    type="number"
                    value={localPriceRange[1]}
                    onChange={(e) =>
                      setLocalPriceRange([
                        localPriceRange[0],
                        parseInt(e.target.value) || priceRange[1],
                      ])
                    }
                    onBlur={handlePriceCommit}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {formatPrice(localPriceRange[0])} DZD -{" "}
                {formatPrice(localPriceRange[1])} DZD
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Wilaya/Location */}
        <AccordionItem value="location" className="border-none">
          <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Localisation (Wilaya)
              {currentFilters.wilaya && (
                <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">
                  Actif
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-0">
            <div className="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 gap-1">
                {ALGERIAN_WILAYAS.map((wilaya) => (
                  <button
                    key={wilaya.code}
                    onClick={() => handleWilayaChange(wilaya.name)}
                    className={`text-left px-2 py-1.5 rounded text-xs transition-colors ${
                      currentFilters.wilaya === wilaya.name
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
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Fournisseur Vérifié
              {currentFilters.verifiedOnly && (
                <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-700">
                  Actif
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-0">
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors">
              <Checkbox
                checked={currentFilters.verifiedOnly}
                onCheckedChange={(checked) =>
                  onFiltersChange({ verifiedOnly: !!checked })
                }
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <div>
                <p className="text-sm font-medium">
                  Uniquement les fournisseurs vérifiés
                </p>
                <p className="text-xs text-muted-foreground">
                  Entreprises avec documents vérifiés
                </p>
              </div>
            </label>
          </AccordionContent>
        </AccordionItem>

        {/* Availability */}
        <AccordionItem value="availability" className="border-none">
          <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              📦 Disponibilité
              {currentFilters.availability.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">
                  {currentFilters.availability.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-0">
            <div className="space-y-2">
              {AVAILABILITY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted transition-colors"
                >
                  <Checkbox
                    checked={currentFilters.availability.includes(option.value)}
                    onCheckedChange={() =>
                      handleAvailabilityToggle(option.value)
                    }
                  />
                  <Badge
                    variant="outline"
                    className={`${option.color} border-0`}
                  >
                    {option.label}
                  </Badge>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* MOQ Range */}
        <AccordionItem value="moq" className="border-none">
          <AccordionTrigger className="py-3 px-0 text-sm font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              📊 Quantité Minimale (MOQ)
              {(currentFilters.minMoq !== moqRange[0] ||
                currentFilters.maxMoq !== moqRange[1]) && (
                <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">
                  Actif
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-0">
            <div className="space-y-4">
              <Slider
                value={localMoqRange}
                min={moqRange[0]}
                max={moqRange[1]}
                step={10}
                onValueChange={(value) =>
                  setLocalMoqRange(value as [number, number])
                }
                onValueCommit={handleMoqCommit}
                className="[&_[role=slider]]:bg-green-600 [&_[role=slider]]:border-green-600"
              />
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Min</Label>
                  <Input
                    type="number"
                    value={localMoqRange[0]}
                    onChange={(e) =>
                      setLocalMoqRange([
                        parseInt(e.target.value) || 0,
                        localMoqRange[1],
                      ])
                    }
                    onBlur={handleMoqCommit}
                    className="h-8 text-sm"
                  />
                </div>
                <span className="mt-5 text-muted-foreground">-</span>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Max</Label>
                  <Input
                    type="number"
                    value={localMoqRange[1]}
                    onChange={(e) =>
                      setLocalMoqRange([
                        localMoqRange[0],
                        parseInt(e.target.value) || moqRange[1],
                      ])
                    }
                    onBlur={handleMoqCommit}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Filtres actifs
            </p>
            <div className="flex flex-wrap gap-2">
              {currentFilters.category && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/10"
                  onClick={() => onFiltersChange({ category: "" })}
                >
                  Catégorie:{" "}
                  {categories.find((c) => c.id === currentFilters.category)
                    ?.name || currentFilters.category}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {currentFilters.wilaya && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/10"
                  onClick={() => onFiltersChange({ wilaya: "" })}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {currentFilters.wilaya}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {currentFilters.verifiedOnly && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/10"
                  onClick={() => onFiltersChange({ verifiedOnly: false })}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Vérifié
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {currentFilters.availability.map((avail) => (
                <Badge
                  key={avail}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/10"
                  onClick={() => handleAvailabilityToggle(avail)}
                >
                  {AVAILABILITY_OPTIONS.find((o) => o.value === avail)?.label}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper function to calculate active filter count
function getActiveFilterCount(
  currentFilters: FilterState,
  priceRange: [number, number],
  moqRange: [number, number]
): number {
  let count = 0;
  if (currentFilters.category) count++;
  if (currentFilters.subcategory) count++;
  if (currentFilters.wilaya) count++;
  if (currentFilters.verifiedOnly) count++;
  if (currentFilters.availability.length > 0) count++;
  if (
    currentFilters.minPrice !== priceRange[0] ||
    currentFilters.maxPrice !== priceRange[1]
  )
    count++;
  if (
    currentFilters.minMoq !== moqRange[0] ||
    currentFilters.maxMoq !== moqRange[1]
  )
    count++;
  return count;
}

// Main exported component
export function ProductFilters({
  categories = [],
  onFiltersChange,
  currentFilters,
  priceRange = [0, 10000000],
  moqRange = [0, 100000],
}: ProductFiltersProps) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">
        <DesktopSidebarContent
          categories={categories}
          onFiltersChange={onFiltersChange}
          currentFilters={currentFilters}
          priceRange={priceRange}
          moqRange={moqRange}
        />
      </div>
      
      {/* Mobile Trigger */}
      <MobileDrawerContent
        categories={categories}
        onFiltersChange={onFiltersChange}
        currentFilters={currentFilters}
        priceRange={priceRange}
        moqRange={moqRange}
      />
    </>
  );
}

export default ProductFilters;

// Export default filter state for use in pages
export { defaultFilters };
