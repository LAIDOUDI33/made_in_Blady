"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CategoryInfo } from "@/types/product";
import {
  Search,
  FolderOpen,
  ChevronRight,
  Grid3X3,
  List,
  Package,
  Star,
} from "lucide-react";

// Default category icons for different categories
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
  mining: "⛏️",
  plastic: "🔬",
};

const FEATURED_CATEGORIES = [
  "construction",
  "industrial",
  "energy",
  "agriculture",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<CategoryInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories?counts=true");
        const data = await response.json();
        
        if (data.success) {
          setCategories(data.data.categories);
          setFeaturedCategories(data.data.featuredCategories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, []);

  // Filter categories based on search
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get icon for category based on slug or name
  const getCategoryIcon = (category: CategoryInfo) => {
    if (category.icon) return category.icon;
    
    // Try to match by slug
    const slugLower = category.slug.toLowerCase();
    for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
      if (slugLower.includes(key)) return icon;
    }
    
    return "📁"; // Default icon
  };

  // Check if category is featured
  const isFeatured = (category: CategoryInfo) => {
    const slugLower = category.slug.toLowerCase();
    return FEATURED_CATEGORIES.some((f) => slugLower.includes(f));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-48 bg-gray-200 rounded" />
              <div className="h-10 w-96 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Catégories</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-6 max-w-2xl">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <FolderOpen className="h-9 w-9 text-green-600" />
              Toutes les Catégories
            </h1>
            <p className="text-muted-foreground mb-6">
              Explorez nos catégories de produits et trouvez exactement ce dont vous avez besoin.
            </p>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher une catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 text-base"
              />
            </div>
          </div>

          {/* View Mode Toggle & Count */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>{filteredCategories.length}</strong> catégories trouvées
            </p>
            
            <div className="flex border rounded-md overflow-hidden">
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
        </div>
      </div>

      {/* Featured Categories */}
      {!searchQuery && featuredCategories.length > 0 && (
        <section className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-300" />
              Catégories Populaires
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {featuredCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all duration-300"
                >
                  <span className="text-3xl block mb-2">{getCategoryIcon(category)}</span>
                  <span className="font-medium text-sm line-clamp-1 group-hover:text-yellow-300 transition-colors">
                    {category.name}
                  </span>
                  {category.productCount !== undefined && (
                    <span className="block text-xs text-white/70 mt-1">
                      {category.productCount.toLocaleString()} produits
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Grid/List */}
      <main className="container mx-auto px-4 py-8">
        {filteredCategories.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  icon={getCategoryIcon(category)}
                  isFeatured={isFeatured(category)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCategories.map((category) => (
                <CategoryListItem
                  key={category.id}
                  category={category}
                  icon={getCategoryIcon(category)}
                />
              ))}
            </div>
          )
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <FolderOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune catégorie trouvée</h3>
            <p className="text-muted-foreground mb-4">
              Essayez une autre recherche ou parcourez toutes les catégories.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Effacer la recherche
            </button>
          </div>
        )}
      </main>

      {/* SEO Content */}
      <section className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto prose prose-sm">
            <h2 className="text-xl font-semibold mb-4">Catégories de Produits sur AlgeriaTrade</h2>
            <p className="text-muted-foreground leading-relaxed">
              AlgeriaTrade.dz propose un large éventail de catégories de produits pour répondre 
              à tous vos besoins professionnels en Algérie. Que vous soyez dans le secteur de 
              la construction, de l&apos;agriculture, de l&apos;industrie ou des services, vous trouverez 
              ici des fournisseurs qualifiés proposant des produits de qualité.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Chaque catégorie est organisée avec des sous-catégories pour faciliter votre 
              recherche. Nos fournisseurs vérifiés garantissent la qualité et la fiabilité 
              des produits proposés.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// Category Card Component (Grid View)
function CategoryCard({
  category,
  icon,
  isFeatured,
}: {
  category: CategoryInfo;
  icon: string;
  isFeatured: boolean;
}) {
  return (
    <Link href={`/categories/${category.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-transparent hover:border-green-200 h-full">
        <CardContent className="p-6 relative">
          {/* Featured Badge */}
          {isFeatured && (
            <Badge className="absolute top-3 right-3 bg-orange-500 text-white">
              <Star className="h-3 w-3 mr-1" />
              Populaire
            </Badge>
          )}

          {/* Icon */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="text-2xl">{icon}</span>
          </div>

          {/* Name */}
          <h3 className="font-semibold text-foreground group-hover:text-green-600 transition-colors mb-1">
            {category.name}
          </h3>

          {/* Description */}
          {category.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {category.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Package className="h-3 w-3" />
              {category.productCount !== undefined
                ? `${category.productCount.toLocaleString()} produits`
                : "Voir les produits"}
            </span>
            
            {category.subcategories && category.subcategories.length > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <FolderOpen className="h-3 w-3" />
                {category.subcategories.length} sous-catégories
              </span>
            )}
          </div>

          {/* Hover indicator */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="h-5 w-5 text-green-600" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Category List Item Component (List View)
function CategoryListItem({
  category,
  icon,
}: {
  category: CategoryInfo;
  icon: string;
}) {
  return (
    <Link href={`/categories/${category.slug}`}>
      <Card className="group hover:border-green-200 hover:shadow-md transition-all duration-200">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shrink-0">
            <span className="text-xl">{icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium group-hover:text-green-600 transition-colors">
              {category.name}
            </h3>
            {category.description && (
              <p className="text-sm text-muted-foreground truncate">
                {category.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {category.productCount !== undefined && (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                <Package className="h-3 w-3 mr-1" />
                {category.productCount.toLocaleString()}
              </Badge>
            )}
            
            {category.subcategories && category.subcategories.length > 0 && (
              <span className="text-xs text-muted-foreground hidden md:inline">
                {category.subcategories.length} sous-catégories
              </span>
            )}

            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-green-600 transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
