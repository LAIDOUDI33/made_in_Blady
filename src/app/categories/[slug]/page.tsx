"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters, FilterState, defaultFilters } from "@/components/products/ProductFilters";
import { SearchBar } from "@/components/products/SearchBar";
import { CategoryInfo, ProductListResponse, Product } from "@/types/product";
import {
  FolderOpen,
  Package,
  ChevronRight,
  Grid3X3,
  List,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";

// Default category icons
const CATEGORY_ICONS: Record<string, string> = {
  agriculture: "🌾",
  construction: "🏗️",
  industrial: "⚙️",
  energy: "☀️",
  ict: "💻",
  automotive: "🚗",
  textile: "👕",
  chemical: "🧪",
  health: "🏥",
  furniture: "🪑",
  packaging: "📦",
  logistics: "🚚",
  food: "🍽️",
};

function CategoryDetailContent() {
  const params = useParams();
  const slug = params.slug as string;
  
  // State
  const [category, setCategory] = useState<CategoryInfo | null>(null);
  const [parentCategory, setParentCategory] = useState<CategoryInfo | null>(null);
  const [subcategories, setSubcategories] = useState<CategoryInfo[]>([]);
  const [productsData, setProductsData] = useState<ProductListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("");
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    category: slug,
  });

  // Fetch category data and products
  useEffect(() => {
    async function fetchCategoryData() {
      try {
        setIsLoading(true);
        
        // Fetch categories to find current one
        const catResponse = await fetch("/api/categories?counts=true");
        const catData = await catResponse.json();
        
        if (catData.success) {
          // Find current category in flat list
          const allCategories = catData.data.flatList;
          const currentCat = allCategories.find((c: CategoryInfo) => c.slug === slug);
          
          if (currentCat) {
            setCategory(currentCat);
            
            // Find parent if exists
            if (currentCat.parentId) {
              const parent = allCategories.find((c: CategoryInfo) => c.id === currentCat.parentId);
              if (parent) setParentCategory(parent);
            }
            
            // Get subcategories from tree
            const categoryTree = catData.data.categories;
            let foundSubcategories: CategoryInfo[] = [];
            
            for (const parent of categoryTree) {
              if (parent.slug === slug && parent.subcategories) {
                foundSubcategories = parent.subcategories;
                break;
              }
              
              // Also check subcategories of parents
              if (parent.subcategories) {
                const found = parent.subcategories.find((s: CategoryInfo) => s.slug === slug);
                if (found) {
                  setParentCategory(parent);
                  break;
                }
              }
            }
            
            setSubcategories(foundSubcategories);
          }

          // Fetch products for this category
          await fetchProducts();
        }
      } catch (error) {
        console.error("Error fetching category:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      fetchCategoryData();
    }
  }, [slug]);

  // Fetch products with filters
  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      
      params.set("page", "1");
      params.set("limit", "20");
      params.set("category", slug);
      
      if (activeSubcategory) {
        params.set("subcategory", activeSubcategory);
      }
      
      params.set("sortBy", sortBy);

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setProductsData(data.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }, [slug, activeSubcategory, sortBy]);

  useEffect(() => {
    if (!isLoading) {
      fetchProducts();
    }
  }, [fetchProducts, isLoading]);

  // Handle subcategory click
  const handleSubcategoryClick = useCallback((subcatSlug: string) => {
    setActiveSubcategory((prev) => prev === subcatSlug ? "" : subcatSlug);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
  }, []);

  // Handle add to RFQ
  const handleAddToRFQ = useCallback((product: Product) => {
    alert(`Produit "${product.name}" ajouté au devis!`);
  }, []);

  // Handle toggle favorite
  const handleToggleFavorite = useCallback((product: Product) => {
    // TODO: Implement favorites
  }, []);

  // Get icon for category
  const getCategoryIcon = () => {
    if (category?.icon) return category.icon;
    
    const slugLower = slug.toLowerCase();
    for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
      if (slugLower.includes(key)) return icon;
    }
    
    return "📁";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-10 w-96 bg-gray-200 rounded" />
            <div className="h-64 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-8">
          <FolderOpen className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Catégorie non trouvée</h2>
          <p className="text-muted-foreground mb-4">
            La catégorie que vous recherchez n&apos;existe pas.
          </p>
          <Button asChild>
            <Link href="/categories">Voir toutes les catégories</Link>
          </Button>
        </Card>
      </div>
    );
  }

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
                <BreadcrumbLink href="/categories">Catégories</BreadcrumbLink>
              </BreadcrumbItem>
              {parentCategory && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/categories/${parentCategory.slug}`}>
                      {parentCategory.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{category.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shrink-0">
                <span className="text-3xl">{getCategoryIcon()}</span>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="mt-2 text-muted-foreground max-w-2xl">
                    {category.description}
                  </p>
                )}
                {category.productCount !== undefined && (
                  <div className="flex items-center gap-4 mt-3">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <Package className="h-3 w-3 mr-1" />
                      {category.productCount.toLocaleString()} produits
                    </Badge>
                    {subcategories.length > 0 && (
                      <Badge variant="outline">
                        <FolderOpen className="h-3 w-3 mr-1" />
                        {subcategories.length} sous-catégories
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Search */}
            <div className="hidden md:block max-w-md">
              <SearchBar 
                placeholder={`Rechercher dans ${category.name}...`} 
                showShortcuts={false} 
              />
            </div>
          </div>

          {/* Subcategories */}
          {subcategories.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Sous-catégories
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveSubcategory("")}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    !activeSubcategory
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-foreground"
                  }`}
                >
                  Tous les produits
                </button>
                {subcategories.map((subcat) => (
                  <button
                    key={subcat.id}
                    onClick={() => handleSubcategoryClick(subcat.slug)}
                    className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-1 ${
                      activeSubcategory === subcat.slug
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-foreground"
                    }`}
                  >
                    {subcat.name}
                    {subcat.productCount !== undefined && (
                      <span className={`text-xs ${
                        activeSubcategory === subcat.slug
                          ? "text-green-100"
                          : "text-muted-foreground"
                      }`}>
                        ({subcat.productCount})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-72 shrink-0">
            <ProductFilters
              categories={[{ ...category, subcategories }]}
              onFiltersChange={(newFilters) => {
                setFilters({ ...filters, ...newFilters });
              }}
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
                categories={[{ ...category, subcategories }]}
                onFiltersChange={(newFilters) => {
                  setFilters({ ...filters, ...newFilters });
                }}
                currentFilters={filters}
                priceRange={productsData?.filters.priceRange as [number, number]}
                moqRange={productsData?.filters.moqRange as [number, number]}
              />
              
              {/* View Mode Toggle */}
              <div className="flex border rounded-md overflow-hidden ml-auto">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${
                    viewMode === "grid"
                      ? "bg-green-600 text-white"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors ${
                    viewMode === "list"
                      ? "bg-green-600 text-white"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Products Grid/List */}
            <Suspense fallback={<ProductGrid isLoading />}>
              <ProductGrid
                data={productsData || undefined}
                isLoading={isLoading}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onSortChange={handleSortChange}
                currentSort={sortBy}
                onAddToRFQ={handleAddToRFQ}
                onToggleFavorite={handleToggleFavorite}
              />
            </Suspense>
          </main>
        </div>
      </div>

      {/* Related Categories */}
      {!isLoading && (
        <section className="bg-white border-t mt-12">
          <div className="container mx-auto px-4 py-8">
            <h2 className="text-lg font-semibold mb-4">Autres Catégories Populaires</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {["construction", "industrial", "energy", "agriculture", "automotive", "ict"].map(
                (catKey) => (
                  <Link
                    key={catKey}
                    href={`/categories/${catKey}`}
                    className="group p-4 border rounded-lg hover:border-green-200 hover:shadow-md transition-all text-center"
                  >
                    <span className="text-2xl block mb-2">{CATEGORY_ICONS[catKey] || "📁"}</span>
                    <span className="text-sm font-medium group-hover:text-green-600 capitalize">
                      {catKey === "ict" ? "ICT & Télécoms" : catKey === "energy" ? "Énergie" : catKey}
                    </span>
                  </Link>
                )
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function CategoryDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
      </div>
    }>
      <CategoryDetailContent />
    </Suspense>
  );
}
