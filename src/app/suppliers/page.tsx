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
import {
  Search,
  MapPin,
  Factory,
  Star,
  Shield,
  CheckCircle,
  Users,
  Package,
  TrendingUp,
} from "lucide-react";

const mockSuppliers = [
  {
    id: 1,
    name: "Groupe Industriel Algérien (GIA)",
    slug: "groupe-industriel-algerien",
    description: "Leader algérien dans la fabrication d'équipements industriels. Plus de 25 ans d'expérience au service de l'industrie nationale et internationale.",
    category: "Équipement Industriel",
    subcategories: ["Machines CNC", "Pompes Industrielles", "Compresseurs"],
    location: "Alger",
    logo: null,
    productsCount: 245,
    rating: 4.8,
    reviewCount: 156,
    responseRate: 95,
    responseTime: "< 2h",
    yearEstablished: 1998,
    employees: "500-1000",
    verified: true,
    premium: true,
    exportMarkets: ["France", "Tunisie", "Maroc", "Afrique de l'Ouest"],
    certifications: ["ISO 9001", "ISO 14001", "CE"],
  },
  {
    id: 2,
    name: "AgriTech Solutions",
    slug: "agritech-solutions",
    description: "Spécialiste des solutions agricoles modernes. Irrigation, serres intelligentes, équipements pour l'agriculture de précision.",
    category: "Agriculture & Agroalimentaire",
    subcategories: ["Irrigation", "Serres", "Équipement Agricole"],
    location: "Sidi Bel Abbès",
    logo: null,
    productsCount: 128,
    rating: 4.6,
    reviewCount: 89,
    responseRate: 89,
    responseTime: "< 4h",
    yearEstablished: 2010,
    employees: "50-100",
    verified: true,
    premium: true,
    exportMarkets: ["Tunisie", "Libye", "Mauritanie"],
    certifications: ["ISO 9001", "Organic Certified"],
  },
  {
    id: 3,
    name: "SolarEnergy Algeria",
    slug: "solarenergy-algeria",
    description: "Votre partenaire énergie solaire. Panneaux photovoltaïques, onduleurs, batteries de stockage, installations clés en main.",
    category: "Énergie Renouvelable",
    subcategories: ["Panneaux Solaires", "Onduleurs", "Batteries", "Installation"],
    location: "Oran",
    logo: null,
    productsCount: 87,
    rating: 4.9,
    reviewCount: 234,
    responseRate: 98,
    responseTime: "< 1h",
    yearEstablished: 2015,
    employees: "100-250",
    verified: true,
    premium: false,
    exportMarkets: ["Niger", "Mali", "Tchad"],
    certifications: ["IEC Certified", "TÜV Rheinland"],
  },
  {
    id: 4,
    name: "CableAlger Industrie",
    slug: "cablealger-industrie",
    description: "Fabricant algérien de câbles électriques et télécoms. Normes internationales, qualité premium.",
    category: "Électricité & Câblage",
    subcategories: ["Câbles Électriques", "Fibre Optique", "Accessoires"],
    location: "Skikda",
    logo: null,
    productsCount: 167,
    rating: 4.7,
    reviewCount: 112,
    responseRate: 92,
    responseTime: "< 3h",
    yearEstablished: 2005,
    employees: "250-500",
    verified: true,
    premium: true,
    exportMarkets: ["France", "Italie", "Allemagne"],
    certifications: ["CE", "NF", "VDE"],
  },
  {
    id: 5,
    name: "MetalPro Algérie",
    slug: "metalpro-algerie",
    description: "Spécialiste du métal et de l'acier pour le BTP. Barres, poutres, tôles sur mesure.",
    category: "Métallurgie & Acier",
    subcategories: ["Acier Construction", "Tôles", "Profilés"],
    location: "Constantine",
    logo: null,
    productsCount: 98,
    rating: 4.3,
    reviewCount: 67,
    responseRate: 85,
    responseTime: "< 4h",
    yearEstablished: 2008,
    employees: "100-250",
    verified: false,
    premium: false,
    exportMarkets: [],
    certifications: ["NA 16002"],
  },
  {
    id: 6,
    name: "BatiConfort Matériaux",
    slug: "baticonfort-materiaux",
    description: "Tout pour votre chantier: ciment, blocs, carrelages, peintures. Prix compétitifs et livraison rapide.",
    category: "Matériaux de Construction",
    subcategories: ["Ciment & Blocs", "Carrelage", "Peinture", "Isolation"],
    location: "Blida",
    logo: null,
    productsCount: 312,
    rating: 4.5,
    reviewCount: 198,
    responseRate: 90,
    responseTime: "< 3h",
    yearEstablished: 2012,
    employees: "50-100",
    verified: true,
    premium: false,
    exportMarkets: ["Tunisie", "Libye"],
    certifications: ["Quality Assured"],
  },
];

const categories = [
  "Toutes les catégories",
  "Équipement Industriel",
  "Agriculture",
  "Énergie Renouvelable",
  "Construction",
  "ICT & Télécoms",
  "Automobile",
];

const wilayas = [
  "Toutes les wilayas",
  "Alger", "Oran", "Constantine", "Annaba", "Blida", 
  "Sétif", "Skikda", "Tlemcen"
];

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toutes les catégories");
  const [selectedWilaya, setSelectedWilaya] = useState("Toutes les wilayas");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyExport, setOnlyExport] = useState(false);

  // Filter suppliers
  const filteredSuppliers = mockSuppliers.filter((supplier) => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "Toutes les catégories" || supplier.category === selectedCategory;
    
    const matchesWilaya = selectedWilaya === "Toutes les wilayas" || supplier.location === selectedWilaya;
    
    const matchesVerified = !onlyVerified || supplier.verified;
    
    const matchesExport = !onlyExport || supplier.exportMarkets.length > 0;
    
    return matchesSearch && matchesCategory && matchesWilaya && matchesVerified && matchesExport;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold">
              Fournisseurs Vérifiés
            </h1>
            <p className="text-green-100 text-lg">
              Connectez-vous avec plus de 2,500 entreprises algériennes fiables
            </p>
            
            {/* Search */}
            <div className="relative mt-6 max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-200" />
              <Input
                type="text"
                placeholder="Rechercher un fournisseur par nom ou activité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-base h-auto border-white/20 bg-white/10 text-white placeholder:text-green-200 focus-visible:ring-white/30"
              />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 pt-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span>2,500+ Fournisseurs</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-300" />
                <span>Vérifiés</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-300" />
                <span>Tous Secteurs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedWilaya} onValueChange={setSelectedWilaya}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Wilaya" />
                </SelectTrigger>
                <SelectContent>
                  {wilayas.map((wilaya) => (
                    <SelectItem key={wilaya} value={wilaya}>{wilaya}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm flex items-center gap-1">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Vérifiés uniquement
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyExport}
                  onChange={(e) => setOnlyExport(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm">Exportateurs</span>
              </label>

              <span className="ml-auto text-sm text-muted-foreground">
                {filteredSuppliers.length} fournisseurs trouvés
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <Link key={supplier.id} href={`/suppliers/${supplier.slug}`}>
              <Card className="group hover:shadow-lg transition-all duration-300 h-full overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    {/* Logo Placeholder */}
                    <div className={`h-16 w-16 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 ${
                      supplier.premium 
                        ? "bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-700" 
                        : "bg-gradient-to-br from-green-100 to-green-200 text-green-700"
                    }`}>
                      {supplier.name.charAt(0)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate group-hover:text-green-600 transition-colors">
                          {supplier.name}
                        </h3>
                        {supplier.verified && (
                          <Shield className="h-4 w-4 text-blue-500 shrink-0" title="Fournisseur vérifié" />
                        )}
                        {supplier.premium && (
                          <Badge className="bg-yellow-100 text-yellow-700 text-[10px] shrink-0">Premium</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{supplier.category}</p>
                      
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{supplier.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {supplier.description}
                  </p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-muted/50 rounded-lg p-2">
                      <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                        <Package className="h-4 w-4 text-green-600" />
                        {supplier.productsCount}
                      </div>
                      <p className="text-[10px] text-muted-foreground">Produits</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        {supplier.rating}
                      </div>
                      <p className="text-[10px] text-muted-foreground">Note</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <div className="flex items-center justify-center gap-1 text-sm font-semibold text-blue-600">
                        {supplier.responseRate}%
                      </div>
                      <p className="text-[10px] text-muted-foreground">Réponse</p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Réponse moyenne:</span>
                      <span className="font-medium">{supplier.responseTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Fondée en:</span>
                      <span className="font-medium">{supplier.yearEstablished}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Employés:</span>
                      <span className="font-medium">{supplier.employees}</span>
                    </div>
                  </div>

                  {/* Export Markets (if any) */}
                  {supplier.exportMarkets.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Marchés d&apos;exportation:</p>
                      <div className="flex flex-wrap gap-1">
                        {supplier.exportMarkets.map((market) => (
                          <Badge key={market} variant="secondary" className="text-[10px]">
                            {market}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
                    Voir le Profil Complet
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredSuppliers.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <Factory className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Aucun fournisseur trouvé</h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos critères de recherche.
            </p>
          </div>
        )}

        {/* Load More */}
        {filteredSuppliers.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              Charger plus de fournisseurs
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
