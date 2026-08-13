"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Slider,
} from "@/components/ui/slider";
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  MapPin,
  Factory,
  Star,
  Shield,
  Heart,
  ChevronDown,
  X,
} from "lucide-react";

const mockProducts = [
  {
    id: 1,
    name: "Panneaux Solaires Monocristallins 550W - Haute Efficacité",
    shortDesc: "Panneaux solaires de qualité premium avec rendement supérieur à 22%. Garantie 25 ans.",
    company: "SolarTech Algeria",
    location: "Alger",
    price: 45000,
    currency: "DZD",
    moq: 10,
    unit: "unités",
    image: "https://images.unsplash.com/photo-1509391366600-2e10622a1a11?w=400&h=300&fit=crop",
    verified: true,
    rating: 4.8,
    reviewCount: 124,
    category: "Énergie Solaire",
    badge: "Meilleure vente",
  },
  {
    id: 2,
    name: "Câble Électrique Cuivre 16mm² - Norme IEC",
    shortDesc: "Câble électrique en cuivre pur pour installations industrielles et résidentielles.",
    company: "CableAlger Industrie",
    location: "Oran",
    price: 850,
    currency: "DZD",
    moq: 100,
    unit: "mètres",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    verified: true,
    rating: 4.6,
    reviewCount: 89,
    category: "Électricité",
    badge: "Certifié ISO",
  },
  {
    id: 3,
    name: "Pompes Submersibles Profondes pour Irrigation",
    shortDesc: "Pompes submersibles haute performance pour l'irrigation agricole. Débit jusqu'à 100m³/h.",
    company: "HydroEquip Spécialistes",
    location: "Sétif",
    price: 125000,
    currency: "DZD",
    moq: 1,
    unit: "unité",
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop",
    verified: true,
    rating: 4.9,
    reviewCount: 67,
    category: "Agriculture",
    badge: "Nouveau",
  },
  {
    id: 4,
    name: "Acier de Construction Fe500 - Barres 12mm",
    shortDesc: "Barres d'acier laminé à chaud pour béton armé. Conforme aux normes algériennes NA16002.",
    company: "MetalPro Algérie",
    location: "Constantine",
    price: 285000,
    currency: "DZD",
    moq: 5,
    unit: "tonnes",
    image: "https://images.unsplash.com/photo-1504917595217-d2dc543e1627?w=400&h=300&fit=crop",
    verified: false,
    rating: 4.3,
    reviewCount: 45,
    category: "Construction",
    badge: null,
  },
  {
    id: 5,
    name: "Onduleur Hybride SolarEdge 10kW avec Optimiseurs",
    shortDesc: "Onduleur hybride intelligent avec monitoring intégré. Compatible avec toutes marques de panneaux.",
    company: "EnergiePlus Solutions",
    location: "Blida",
    price: 385000,
    currency: "DZD",
    moq: 1,
    unit: "unité",
    image: "https://images.unsplash.com/photo-1473341304170-97d111809fae?w=400&h=300&fit=crop",
    verified: true,
    rating: 4.7,
    reviewCount: 92,
    category: "Énergie Solaire",
    badge: "Premium",
  },
  {
    id: 6,
    name: "Machines CNC Multifonctions pour Travail du Bois",
    shortDesc: "Machine CNC 3 axes complète avec table de travail 1300x2500mm. Logiciel inclus.",
    company: "IndustrieMach Algérie",
    location: "Alger",
    price: 2850000,
    currency: "DZD",
    moq: 1,
    unit: "unité",
    image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=300&fit=crop",
    verified: true,
    rating: 4.9,
    reviewCount: 34,
    category: "Équipement Industriel",
    badge: null,
  },
  {
    id: 7,
    name: "Blocs de Construction Béton Cellulaire (20x20x60)",
    shortDesc: "Blocs de construction légers et isolants. Dimensions standards. Résistance thermique excellente.",
    company: "BatiConfort",
    location: "Tlemcen",
    price: 65,
    currency: "DZD",
    moq: 500,
    unit: "unités",
    image: "https://images.unsplash.com/photo-1503387765974-757c56e72e14?w=400&h=300&fit=crop",
    verified: true,
    rating: 4.4,
    reviewCount: 156,
    category: "Construction",
    badge: "Populaire",
  },
  {
    id: 8,
    name: "Système d'Irrigation Goutte à Goutte Automatisé",
    shortDesc: "Système complet d'irrigation goutte à goutte avec contrôleur programmable et capteurs d'humidité.",
    company: "AgriTech Solutions",
    location: "Sidi Bel Abbès",
    price: 185000,
    currency: "DZD",
    moq: 5,
    unit: "kits",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
    verified: true,
    rating: 4.8,
    reviewCount: 78,
    category: "Agriculture",
    badge: null,
  },
];

const categories = [
  "Toutes les catégories",
  "Agriculture & Alimentation",
  "Construction & BTP",
  "Équipement Industriel",
  "Énergie Solaire",
  "ICT & Télécoms",
  "Automobile",
  "Textiles",
  "Chimiques",
];

const wilayas = [
  "Toutes les wilayas",
  "Alger", "Oran", "Constantine", "Annaba", "Blida", "Batna", 
  "Sétif", "Sidi Bel Abbès", "Skikda", "Tlemcen"
];

export default function ProductsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toutes les catégories");
  const [selectedWilaya, setSelectedWilaya] = useState("Toutes les wilayas");
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");

  // Filter products based on search and filters
  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "Toutes les catégories" || product.category === selectedCategory;
    
    const matchesWilaya = selectedWilaya === "Toutes les wilayas" || product.location === selectedWilaya;
    
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    
    const matchesVerified = !onlyVerified || product.verified;
    
    return matchesSearch && matchesCategory && matchesWilaya && matchesPrice && matchesVerified;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-DZ").format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-3xl font-bold">Produits</h1>
            <p className="text-muted-foreground">
              Découvrez des milliers de produits de fournisseurs algériens vérifiés
            </p>
            
            {/* Search Bar */}
            <div className="relative mt-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher des produits... Ex: Panneaux solaires, câbles industriels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-base h-auto"
              />
              <Button className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700">
                Rechercher
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className={`hidden lg:block w-64 shrink-0 ${showFilters ? "" : ""}`}>
            <div className="sticky top-24 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filtres</h3>
                <Button variant="ghost" size="sm" onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("Toutes les catégories");
                  setSelectedWilaya("Toutes les wilayas");
                  setPriceRange([0, 5000000]);
                  setOnlyVerified(false);
                }}>
                  Réinitialiser
                </Button>
              </div>

              {/* Category Filter */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Catégorie</h4>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Wilaya Filter */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Localisation</h4>
                <Select value={selectedWilaya} onValueChange={setSelectedWilaya}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {wilayas.map((wilaya) => (
                      <SelectItem key={wilaya} value={wilaya}>{wilaya}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Fourchette de Prix (DZD)</h4>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={5000000}
                  step={10000}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>

              {/* Verified Only */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified"
                  checked={onlyVerified}
                  onCheckedChange={(checked) => setOnlyVerified(checked === true)}
                />
                <label htmlFor="verified" className="text-sm cursor-pointer flex items-center gap-1">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Fournisseurs vérifiés uniquement
                </label>
              </div>

              <Separator />

              {/* Quick Stats */}
              <div className="bg-green-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-green-800">
                  {filteredProducts.length} produits trouvés
                </p>
                <p className="text-xs text-green-600">
                  De fournisseurs algériens vérifiés
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  {filteredProducts.length} résultats
                </span>
              </div>

              <div className="flex items-center gap-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Pertinence</SelectItem>
                    <SelectItem value="price-low">Prix croissant</SelectItem>
                    <SelectItem value="price-high">Prix décroissant</SelectItem>
                    <SelectItem value="rating">Meilleure note</SelectItem>
                    <SelectItem value="newest">Plus récent</SelectItem>
                  </SelectContent>
                </Select>

                <div className="hidden sm:flex border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    className="rounded-r-none"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    className="rounded-l-none"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <Card className="lg:hidden mb-6">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Filtres</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedWilaya} onValueChange={setSelectedWilaya}>
                    <SelectTrigger><SelectValue placeholder="Wilaya" /></SelectTrigger>
                    <SelectContent>
                      {wilayas.map((wilaya) => (
                        <SelectItem key={wilaya} value={wilaya}>{wilaya}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="verified-mobile"
                      checked={onlyVerified}
                      onCheckedChange={(checked) => setOnlyVerified(checked === true)}
                    />
                    <label htmlFor="verified-mobile" className="text-sm cursor-pointer">
                      Fournisseurs vérifiés uniquement
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products Grid/List */}
            {filteredProducts.length > 0 ? (
              <div className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                  : "space-y-4"
              }>
                {filteredProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                      {viewMode === "grid" ? (
                        /* Grid View */
                        <>
                          <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                            />
                            {product.badge && (
                              <Badge className="absolute top-3 left-3 bg-green-600">
                                {product.badge}
                              </Badge>
                            )}
                            {product.verified && (
                              <div className="absolute top-3 right-3 bg-white rounded-full p-1 shadow">
                                <Shield className="h-4 w-4 text-blue-600" />
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute bottom-3 right-3 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.preventDefault()}
                            >
                              <Heart className="h-5 w-5" />
                            </Button>
                          </div>
                          <CardContent className="p-4 space-y-3">
                            <h3 className="font-medium line-clamp-2 group-hover:text-green-600 transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {product.shortDesc}
                            </p>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Factory className="h-3 w-3" />
                                <span>{product.company}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{product.location}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div>
                                <p className="font-bold text-green-600">
                                  {formatPrice(product.price)} {product.currency}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  MOQ: {product.moq} {product.unit}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                <span>{product.rating}</span>
                                <span className="text-muted-foreground">({product.reviewCount})</span>
                              </div>
                            </div>
                          </CardContent>
                        </>
                      ) : (
                        /* List View */
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="relative w-32 h-32 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="object-cover w-full h-full"
                              />
                              {product.badge && (
                                <Badge className="absolute top-2 left-2 bg-green-600 text-[10px]">
                                  {product.badge}
                                </Badge>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                              <h3 className="font-medium line-clamp-1 group-hover:text-green-600 transition-colors">
                                {product.name}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {product.shortDesc}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Factory className="h-3 w-3" />
                                  {product.company}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {product.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  {product.rating}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-green-600">
                                    {formatPrice(product.price)} {product.currency}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    MOQ: {product.moq} {product.unit}
                                  </span>
                                </div>
                                <Button size="sm">Contact</Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Aucun produit trouvé</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Essayez de modifier vos critères de recherche ou de supprimer certains filtres.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("Toutes les catégories");
                    setSelectedWilaya("Toutes les wilayas");
                    setPriceRange([0, 5000000]);
                    setOnlyVerified(false);
                  }}
                >
                  Effacer tous les filtres
                </Button>
              </div>
            )}

            {/* Pagination */}
            {filteredProducts.length > 0 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Précédent
                  </Button>
                  <Button size="sm" className="bg-green-600">1</Button>
                  <Button variant="outline" size="sm">2</Button>
                  <Button variant="outline" size="sm">3</Button>
                  <span className="px-2 text-muted-foreground">...</span>
                  <Button variant="outline" size="sm">12</Button>
                  <Button variant="outline" size="sm">
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
