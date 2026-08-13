"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  ArrowRight,
  Users,
  Package,
  Factory,
  Handshake,
  Star,
  Shield,
  TrendingUp,
  MapPin,
  CheckCircle,
  ChevronRight,
} from "lucide-react";

const stats = [
  { label: "Fournisseurs Vérifiés", value: "2,500+", icon: Factory },
  { label: "Produits Répertoriés", value: "50,000+", icon: Package },
  { label: "Appels d'Offre Actifs", value: "1,200+", icon: Handshake },
  { label: "Transactions Mensuelles", value: "15M+ DZD", icon: TrendingUp },
];

const categories = [
  {
    name: "Agriculture & Alimentation",
    description: "Machines agricoles, engrais, produits alimentaires",
    icon: "🌾",
    count: "3,400+",
    href: "/categories/agriculture-food",
    color: "bg-green-50 border-green-200 hover:border-green-400",
  },
  {
    name: "Construction & BTP",
    description: "Ciment, acier, matériaux de construction",
    icon: "🏗️",
    count: "5,200+",
    href: "/categories/construction",
    color: "bg-orange-50 border-orange-200 hover:border-orange-400",
  },
  {
    name: "Équipement Industriel",
    description: "CNC, compresseurs, pompes, machines",
    icon: "⚙️",
    count: "4,100+",
    href: "/categories/industrial-equipment",
    color: "bg-blue-50 border-blue-200 hover:border-blue-400",
  },
  {
    name: "Énergie Solaire",
    description: "Panneaux solaires, batteries, onduleurs",
    icon: "☀️",
    count: "1,800+",
    href: "/categories/energy-solar",
    color: "bg-yellow-50 border-yellow-200 hover:border-yellow-400",
  },
  {
    name: "ICT & Télécoms",
    description: "Réseaux, serveurs, fibre optique",
    icon: "💻",
    count: "2,600+",
    href: "/categories/ict-telecom",
    color: "bg-purple-50 border-purple-200 hover:border-purple-400",
  },
  {
    name: "Automobile",
    description: "Véhicules, pièces détachées, pneus",
    icon: "🚗",
    count: "3,900+",
    href: "/categories/automotive",
    color: "bg-red-50 border-red-200 hover:border-red-400",
  },
  {
    name: "Textiles & Habillement",
    description: "Tissus, vêtements de travail",
    icon: "👕",
    count: "1,500+",
    href: "/categories/textiles",
    color: "bg-pink-50 border-pink-200 hover:border-pink-400",
  },
  {
    name: "Produits Chimiques",
    description: "Peintures, plastiques, engrais",
    icon: "🧪",
    count: "980+",
    href: "/categories/chemicals",
    color: "bg-cyan-50 border-cyan-200 hover:border-cyan-400",
  },
];

const featuredProducts = [
  {
    id: 1,
    name: "Panneaux Solaires Monocristallins 550W",
    company: "SolarTech Algeria",
    location: "Alger",
    price: "45,000 DZD",
    moq: "10 unités",
    image: "https://images.unsplash.com/photo-1509391366600-2e10622a1a11?w=300&h=200&fit=crop",
    verified: true,
    badge: "Meilleure vente",
  },
  {
    id: 2,
    name: "Câble Industriel Cuivre 16mm²",
    company: "CableAlger",
    location: "Oran",
    price: "850 DZD/m",
    moq: "100m",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=200&fit=crop",
    verified: true,
    badge: "Certifié ISO",
  },
  {
    id: 3,
    name: "Pompes Submersibles pour Irrigation",
    company: "HydroEquip",
    location: "Sétif",
    price: "125,000 DZD",
    moq: "1 unité",
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300&h=200&fit=crop",
    verified: true,
    badge: "Nouveau",
  },
  {
    id: 4,
    name: "Acier de Construction Fe500",
    company: "MetalPro",
    location: "Constantine",
    price: "285,000 DZD/t",
    moq: "5 tonnes",
    image: "https://images.unsplash.com/photo-1504917595217-d2dc543e1627?w=300&h=200&fit=crop",
    verified: false,
    badge: null,
  },
];

const featuredSuppliers = [
  {
    id: 1,
    name: "Groupe Industriel Algérien (GIA)",
    category: "Équipement Industriel",
    location: "Alger",
    products: 245,
    rating: 4.8,
    responseRate: 95,
    verified: true,
    premium: true,
  },
  {
    id: 2,
    name: "AgriTech Solutions",
    category: "Agriculture",
    location: "Sidi Bel Abbès",
    products: 128,
    rating: 4.6,
    responseRate: 89,
    verified: true,
    premium: true,
  },
  {
    id: 3,
    name: "SolarEnergy Algeria",
    category: "Énergie Renouvelable",
    location: "Oran",
    products: 87,
    rating: 4.9,
    responseRate: 98,
    verified: true,
    premium: false,
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Créez Votre Compte",
    description: "Inscription gratuite en quelques minutes. Complétez votre profil entreprise.",
    icon: Users,
  },
  {
    step: "02",
    title: "Recherchez ou Publiez un AO",
    description: "Parcourez des milliers de produits ou publiez votre appel d'offres.",
    icon: Search,
  },
  {
    step: "03",
    title: "Connectez & Négociez",
    description: "Contactez les fournisseurs, comparez les devis et négociez.",
    icon: Handshake,
  },
  {
    step: "04",
    title: "Finalisez la Transaction",
    description: "Acceptez le meilleur offre et finalisez en toute sécurité.",
    icon: Package,
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-600 to-emerald-600 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container mx-auto px-4 py-20 lg:py-28 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-1">
              🇩🇿 La #1 Plateforme B2B en Algérie
            </Badge>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Sourcez depuis l&apos;Algérie.
                <br />
                Achetez auprès de fournisseurs
                <br />
                <span className="text-yellow-300">de confiance.</span>
              </h1>
              <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto">
                Connectez-vous avec plus de 2,500 fournisseurs algériens vérifiés. 
                Trouvez des produits, comparez les prix et développez votre entreprise.
              </p>
            </div>

            {/* Search Box */}
            <div className="max-w-3xl mx-auto">
              <Card className="bg-white shadow-2xl border-0 overflow-hidden">
                <CardContent className="p-2">
                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Que recherchez-vous? Ex: Panneaux solaires, câbles industriels..."
                        className="pl-12 h-14 text-base border-0 focus-visible:ring-0"
                      />
                    </div>
                    <select className="px-4 h-14 border rounded-lg bg-background text-sm min-w-[140px]">
                      <option value="">Toutes catégories</option>
                      <option value="agriculture">Agriculture</option>
                      <option value="construction">Construction</option>
                      <option value="industrial">Industrie</option>
                      <option value="energy">Énergie</option>
                      <option value="ict">ICT</option>
                    </select>
                    <Button size="lg" className="h-14 px-8 bg-green-600 hover:bg-green-700 text-base font-semibold">
                      Rechercher
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 px-2 pb-1">
                    <span className="text-xs text-muted-foreground">Populaire:</span>
                    {["Panneaux solaires", "Câble électrique", "Acier", "Pompes"].map((term) => (
                      <Link
                        key={term}
                        href={`/search?q=${encodeURIComponent(term)}`}
                        className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-green-100 hover:text-green-700 transition-colors"
                      >
                        {term}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="secondary" className="bg-white text-green-700 hover:bg-gray-100 px-8" asChild>
                <Link href="/products">
                  <Package className="mr-2 h-5 w-5" />
                  Explorer les Produits
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8" asChild>
                <Link href="/rfqs/new">
                  <Handshake className="mr-2 h-5 w-5" />
                  Poster un Appel d&apos;Offre
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="currentColor" className="text-background" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl font-bold text-foreground">
              Catégories de Produits
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explorez nos principales catégories et trouvez exactement ce dont vous avez besoin parmi des milliers de produits algériens.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link key={category.name} href={category.href}>
                <Card className={`group transition-all duration-300 hover:shadow-lg ${category.color}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-4xl">{category.icon}</span>
                      <Badge variant="secondary" className="text-xs">
                        {category.count}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-foreground group-hover:text-green-600 transition-colors mb-1">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                    <div className="mt-3 flex items-center text-sm text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Explorer <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" size="lg" asChild>
              <Link href="/categories">
                Voir toutes les catégories
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground">Produits Vedettes</h2>
              <p className="text-muted-foreground">Découvrez les produits les plus demandés par les acheteurs</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/products">
                Voir tous <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
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
                </div>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-green-600 transition-colors">
                    {product.name}
                  </h3>
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
                      <p className="font-bold text-green-600">{product.price}</p>
                      <p className="text-xs text-muted-foreground">MOQ: {product.moq}</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs">
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Suppliers Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground">Fournisseurs Vedettes</h2>
              <p className="text-muted-foreground">Des entreprises algériennes vérifiées et fiables</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/suppliers">
                Tous les fournisseurs <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-xl font-bold text-green-700">
                      {supplier.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{supplier.name}</h3>
                        {supplier.verified && (
                          <Shield className="h-4 w-4 text-blue-500 shrink-0" />
                        )}
                        {supplier.premium && (
                          <Badge className="bg-yellow-100 text-yellow-700 text-[10px] shrink-0">Premium</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{supplier.category}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="font-semibold text-foreground">{supplier.products}</p>
                      <p className="text-xs text-muted-foreground">Produits</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{supplier.rating}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Note</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{supplier.responseRate}%</p>
                      <p className="text-xs text-muted-foreground">Réponse</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{supplier.location}</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Voir Profil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl font-bold text-foreground">
              Comment Ça Marche
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Rejoignez des milliers d&apos;entreprises qui utilisent AlgeriaTrade pour développer leur activité
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center space-y-4">
                <div className="relative inline-flex">
                  <div className="h-20 w-20 rounded-2xl bg-green-100 flex items-center justify-center">
                    <step.icon className="h-10 w-10 text-green-600" />
                  </div>
                  <Badge className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center p-0">
                    {step.step}
                  </Badge>
                </div>
                <h3 className="font-semibold text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Prêt à Développer Votre Entreprise?
            </h2>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              Rejoignez la plus grande plateforme B2B d&apos;Algérie. Inscrivez-vous gratuitement et commencez à trouver de nouveaux clients dès aujourd&apos;hui.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="secondary" className="bg-white text-green-700 hover:bg-gray-100 px-8 text-lg" asChild>
              <Link href="/register?role=buyer">
                Je Veux Acheter
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 text-lg" asChild>
              <Link href="/register?role=supplier">
                Je Veux Vendre
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-green-100">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Inscription Gratuite
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Pas de Carte Bancaire
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Support 24/7
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
