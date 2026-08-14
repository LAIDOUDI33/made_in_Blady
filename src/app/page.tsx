"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTranslation, useLanguage } from "@/lib/i18n";
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

export default function HomePage() {
  const { t, isRTL } = useTranslation();

  const stats = [
    { labelKey: "home.stats.suppliers", value: "2,500+", icon: Factory },
    { labelKey: "home.stats.products", value: "50,000+", icon: Package },
    { labelKey: "home.stats.rfqs", value: "1,200+", icon: Handshake },
    { labelKey: "home.stats.transactions", value: "15M+ DZD", icon: TrendingUp },
  ];

  const categories = [
    {
      nameKey: "categories.agriculture",
      nameFr: "Agriculture & Alimentation",
      descriptionKey: "categories.agricultureDesc",
      descriptionFr: "Machines agricoles, engrais, produits alimentaires",
      icon: "🌾",
      count: "3,400+",
      href: "/categories/agriculture-food",
      color: "bg-green-50 border-green-200 hover:border-green-400",
    },
    {
      nameKey: "categories.construction",
      nameFr: "Construction & BTP",
      descriptionKey: "categories.constructionDesc",
      descriptionFr: "Ciment, acier, matériaux de construction",
      icon: "🏗️",
      count: "5,200+",
      href: "/categories/construction",
      color: "bg-orange-50 border-orange-200 hover:border-orange-400",
    },
    {
      nameKey: "categories.industrial",
      nameFr: "Équipement Industriel",
      descriptionKey: "categories.industrialDesc",
      descriptionFr: "CNC, compresseurs, pompes, machines",
      icon: "⚙️",
      count: "4,100+",
      href: "/categories/industrial-equipment",
      color: "bg-blue-50 border-blue-200 hover:border-blue-400",
    },
    {
      nameKey: "categories.energy",
      nameFr: "Énergie Solaire",
      descriptionKey: "categories.energyDesc",
      descriptionFr: "Panneaux solaires, batteries, onduleurs",
      icon: "☀️",
      count: "1,800+",
      href: "/categories/energy-solar",
      color: "bg-yellow-50 border-yellow-200 hover:border-yellow-400",
    },
    {
      nameKey: "categories.ict",
      nameFr: "ICT & Télécoms",
      descriptionKey: "categories.ictDesc",
      descriptionFr: "Réseaux, serveurs, fibre optique",
      icon: "💻",
      count: "2,600+",
      href: "/categories/ict-telecom",
      color: "bg-purple-50 border-purple-200 hover:border-purple-400",
    },
    {
      nameKey: "categories.automobile",
      nameFr: "Automobile",
      descriptionKey: "categories.automobileDesc",
      descriptionFr: "Véhicules, pièces détachées, pneus",
      icon: "🚗",
      count: "3,900+",
      href: "/categories/automotive",
      color: "bg-red-50 border-red-200 hover:border-red-400",
    },
    {
      nameKey: "categories.textiles",
      nameFr: "Textiles & Habillement",
      descriptionKey: "categories.textilesDesc",
      descriptionFr: "Tissus, vêtements de travail",
      icon: "👕",
      count: "1,500+",
      href: "/categories/textiles",
      color: "bg-pink-50 border-pink-200 hover:border-pink-400",
    },
    {
      nameKey: "categories.chemicals",
      nameFr: "Produits Chimiques",
      descriptionKey: "categories.chemicalsDesc",
      descriptionFr: "Peintures, plastiques, engrais",
      icon: "🧪",
      count: "980+",
      href: "/categories/chemicals",
      color: "bg-cyan-50 border-cyan-200 hover:border-cyan-400",
    },
  ];

  const featuredProducts = [
    {
      id: 1,
      nameKey: "home.featured.product1.name",
      nameFr: "Panneaux Solaires Monocristallins 550W",
      company: "SolarTech Algeria",
      location: "Alger",
      price: "45,000 DZD",
      moq: "10 unités",
      image: "https://images.unsplash.com/photo-1509391366600-2e10622a1a11?w=300&h=200&fit=crop",
      verified: true,
      badgeKey: "products.bestSeller",
      badgeFr: "Meilleure vente",
    },
    {
      id: 2,
      nameKey: "home.featured.product2.name",
      nameFr: "Câble Industriel Cuivre 16mm²",
      company: "CableAlger",
      location: "Oran",
      price: "850 DZD/m",
      moq: "100m",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=200&fit=crop",
      verified: true,
      badgeKey: "products.certified",
      badgeFr: "Certifié ISO",
    },
    {
      id: 3,
      nameKey: "home.featured.product3.name",
      nameFr: "Pompes Submersibles pour Irrigation",
      company: "HydroEquip",
      location: "Sétif",
      price: "125,000 DZD",
      moq: "1 unité",
      image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300&h=200&fit=crop",
      verified: true,
      badgeKey: "common.new",
      badgeFr: "Nouveau",
    },
    {
      id: 4,
      nameKey: "home.featured.product4.name",
      nameFr: "Acier de Construction Fe500",
      company: "MetalPro",
      location: "Constantine",
      price: "285,000 DZD/t",
      moq: "5 tonnes",
      image: "https://images.unsplash.com/photo-1504917595217-d2dc543e1627?w=300&h=200&fit=crop",
      verified: false,
      badgeKey: null,
      badgeFr: null,
    },
  ];

  const featuredSuppliers = [
    {
      id: 1,
      name: "Groupe Industriel Algérien (GIA)",
      categoryKey: "categories.industrial",
      categoryFr: "Équipement Industriel",
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
      categoryKey: "categories.agriculture",
      categoryFr: "Agriculture",
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
      categoryKey: "categories.energy",
      categoryFr: "Énergie Renouvelable",
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
      titleKey: "home.howItWorks.step1.title",
      titleFr: "Créez Votre Compte",
      descriptionKey: "home.howItWorks.step1.desc",
      descriptionFr: "Inscription gratuite en quelques minutes. Complétez votre profil entreprise.",
      icon: Users,
    },
    {
      step: "02",
      titleKey: "home.howItWorks.step2.title",
      titleFr: "Recherchez ou Publiez un AO",
      descriptionKey: "home.howItWorks.step2.desc",
      descriptionFr: "Parcourez des milliers de produits ou publiez votre appel d'offres.",
      icon: Search,
    },
    {
      step: "03",
      titleKey: "home.howItWorks.step3.title",
      titleFr: "Connectez & Négociez",
      descriptionKey: "home.howItWorks.step3.desc",
      descriptionFr: "Contactez les fournisseurs, comparez les devis et négociez.",
      icon: Handshake,
    },
    {
      step: "04",
      titleKey: "home.howItWorks.step4.title",
      titleFr: "Finalisez la Transaction",
      descriptionKey: "home.howItWorks.step4.desc",
      descriptionFr: "Acceptez le meilleur offre et finalisez en toute sécurité.",
      icon: Package,
    },
  ];

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
          <div className={`max-w-4xl mx-auto text-center space-y-8 ${isRTL ? 'rtl' : ''}`}>
            {/* Badge */}
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-1">
              🇩🇿 {t('home.hero.badge') || 'La #1 Plateforme B2B en Algérie'}
            </Badge>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {t('home.hero.title') || 'Sourcez depuis l\'Algérie.'}
                <br />
                {t('home.hero.subtitle') || 'Achetez auprès de fournisseurs'}
                <br />
                <span className="text-yellow-300">{t('home.hero.highlight') || 'de confiance.'}</span>
              </h1>
              <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto">
                {t('home.hero.description') || 'Connectez-vous avec plus de 2,500 fournisseurs algériens vérifiés. Trouvez des produits, comparez les prix et développez votre entreprise.'}
              </p>
            </div>

            {/* Search Box */}
            <div className="max-w-3xl mx-auto">
              <Card className="bg-white shadow-2xl border-0 overflow-hidden">
                <CardContent className="p-2">
                  <div className={`flex flex-col md:flex-row gap-2 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                    <div className="relative flex-1">
                      <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                      <Input
                        placeholder={t('home.hero.searchPlaceholder') || 'Que recherchez-vous? Ex: Panneaux solaires, câbles industriels...'}
                        className={`${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} h-14 text-base border-0 focus-visible:ring-0`}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>
                    <select className={`px-4 h-14 border rounded-lg bg-background text-sm min-w-[140px] ${isRTL ? 'text-right' : ''}`}>
                      <option value="">{t('products.filters.allCategories') || 'Toutes catégories'}</option>
                      <option value="agriculture">{t('categories.agriculture') || 'Agriculture'}</option>
                      <option value="construction">{t('categories.construction') || 'Construction'}</option>
                      <option value="industrial">{t('categories.industrial') || 'Industrie'}</option>
                      <option value="energy">{t('categories.energy') || 'Énergie'}</option>
                      <option value="ict">{t('categories.ict') || 'ICT'}</option>
                    </select>
                    <Button size="lg" className="h-14 px-8 bg-green-600 hover:bg-green-700 text-base font-semibold">
                      {t('common.search') || 'Rechercher'}
                    </Button>
                  </div>
                  <div className={`flex flex-wrap gap-2 mt-3 px-2 pb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs text-muted-foreground">{t('home.hero.popular') || 'Populaire:'}</span>
                    {(isRTL ? ['الطاقة الشمسية', 'كابل كهربائي', 'حديد', 'مضخات'] : ["Panneaux solaires", "Câble électrique", "Acier", "Pompes"]).map((term) => (
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
            <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <Button size="lg" variant="secondary" className="bg-white text-green-700 hover:bg-gray-100 px-8" asChild>
                <Link href="/products">
                  <Package className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5`} />
                  {t('home.cta.browseProducts') || 'Explorer les Produits'}
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8" asChild>
                <Link href="/rfqs/new">
                  <Handshake className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5`} />
                  {t('home.cta.postRFQ') || 'Poster un Appel d\'Offre'}
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
              <div key={stat.labelKey} className="text-center space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{t(stat.labelKey)}</p>
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
              {t('home.categories.title') || 'Catégories de Produits'}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('home.categories.description') || 'Explorez nos principales catégories et trouvez exactement ce dont vous avez besoin parmi des milliers de produits algériens.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link key={category.nameKey} href={category.href}>
                <Card className={`group transition-all duration-300 hover:shadow-lg ${category.color}`}>
                  <CardContent className="p-6">
                    <div className={`flex items-start justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-4xl">{category.icon}</span>
                      <Badge variant="secondary" className="text-xs">
                        {category.count}
                      </Badge>
                    </div>
                    <h3 className={`font-semibold text-foreground group-hover:text-green-600 transition-colors mb-1 ${isRTL ? 'text-right' : ''}`}>
                      {t(category.nameKey) || category.nameFr}
                    </h3>
                    <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                      {t(category.descriptionKey) || category.descriptionFr}
                    </p>
                    <div className={`mt-3 flex items-center text-sm text-green-600 opacity-0 group-hover:opacity-100 transition-opacity ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {t('common.explore') || 'Explorer'} 
                      <ChevronRight className={`h-4 w-4 ${isRTL ? 'mr-1 rotate-180' : 'ml-1'}`} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" size="lg" asChild>
              <Link href="/categories">
                {t('home.categories.viewAll') || 'Voir toutes les catégories'}
                <ArrowRight className={`ml-2 h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`space-y-1 ${isRTL ? 'text-right' : ''}`}>
              <h2 className="text-2xl font-bold text-foreground">
                {t('home.products.title') || 'Produits Vedettes'}
              </h2>
              <p className="text-muted-foreground">
                {t('home.products.description') || 'Découvrez les produits les plus demandés par les acheteurs'}
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/products">
                {t('home.products.viewAll') || 'Voir tous'} 
                <ArrowRight className={`ml-1 h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={product.image}
                    alt={t(product.nameKey) || product.nameFr}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.badgeKey && (
                    <Badge className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} bg-green-600 card-badge`}>
                      {t(product.badgeKey) || product.badgeFr}
                    </Badge>
                  )}
                  {product.verified && (
                    <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} bg-white rounded-full p-1 shadow card-verified`}>
                      <Shield className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <h3 className={`font-medium text-sm line-clamp-2 group-hover:text-green-600 transition-colors ${isRTL ? 'text-right' : ''}`}>
                    {t(product.nameKey) || product.nameFr}
                  </h3>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Factory className="h-3 w-3" />
                      <span>{product.company}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <MapPin className="h-3 w-3" />
                      <span>{product.location}</span>
                    </div>
                  </div>
                  <div className={`flex items-center justify-between pt-2 border-t ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-left' : ''}>
                      <p className="font-bold text-green-600">{product.price}</p>
                      <p className="text-xs text-muted-foreground">MOQ: {product.moq}</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs">
                      {t('products.contactSupplier') || 'Contact'}
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
          <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`space-y-1 ${isRTL ? 'text-right' : ''}`}>
              <h2 className="text-2xl font-bold text-foreground">
                {t('home.suppliers.title') || 'Fournisseurs Vedettes'}
              </h2>
              <p className="text-muted-foreground">
                {t('home.suppliers.description') || 'Des entreprises algériennes vérifiées et fiables'}
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/suppliers">
                {t('suppliers.allSuppliers') || 'Tous les fournisseurs'} 
                <ArrowRight className={`ml-1 h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-xl font-bold text-green-700 shrink-0">
                      {supplier.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <h3 className={`font-semibold truncate ${isRTL ? 'text-right' : ''}`}>{supplier.name}</h3>
                        {supplier.verified && (
                          <Shield className="h-4 w-4 text-blue-500 shrink-0" />
                        )}
                        {supplier.premium && (
                          <Badge className="bg-yellow-100 text-yellow-700 text-[10px] shrink-0">Premium</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{t(supplier.categoryKey) || supplier.categoryFr}</p>
                    </div>
                  </div>
                  
                  <div className={`mt-4 grid grid-cols-3 gap-4 text-center`}>
                    <div>
                      <p className="font-semibold text-foreground">{supplier.products}</p>
                      <p className="text-xs text-muted-foreground">{t('suppliers.productsCount') || 'Produits'}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{supplier.rating}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{t('dashboard.stats.rating') || 'Note'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{supplier.responseRate}%</p>
                      <p className="text-xs text-muted-foreground">{t('dashboard.stats.responseRate') || 'Réponse'}</p>
                    </div>
                  </div>

                  <div className={`mt-4 pt-4 border-t flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{supplier.location}</span>
                    </div>
                    <Button size="sm" variant="outline">
                      {t('suppliers.viewProfile') || 'Voir Profil'}
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
              {t('home.howItWorks.title') || 'Comment Ça Marche'}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('home.howItWorks.description') || 'Rejoignez des milliers d\'entreprises qui utilisent AlgeriaTrade pour développer leur activité'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center space-y-4">
                <div className="relative inline-flex">
                  <div className="h-20 w-20 rounded-2xl bg-green-100 flex items-center justify-center">
                    <step.icon className="h-10 w-10 text-green-600" />
                  </div>
                  <Badge className={`absolute -top-2 -${isRTL ? 'left' : 'right'}-2 h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center p-0`}>
                    {step.step}
                  </Badge>
                </div>
                <h3 className="font-semibold text-lg">{t(step.titleKey) || step.titleFr}</h3>
                <p className="text-sm text-muted-foreground">{t(step.descriptionKey) || step.descriptionFr}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment System Showcase - NEW SECTION */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-1.5 border-[#006233] text-[#006233]">
              💳 Système de Paiement Intégré
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Paiements Sécurisés pour l&apos;Algérie
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Acceptez tous les modes de paiement locaux : CIB, CCP, BaridiMob, Virement Bancaire
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto mb-10">
            {[
              { name: 'Carte CIB', icon: '💳', color: 'bg-blue-50 hover:bg-blue-100' },
              { name: 'CCP', icon: '🏦', color: 'bg-green-50 hover:bg-green-100' },
              { name: 'BaridiMob', icon: '📱', color: 'bg-purple-50 hover:bg-purple-100' },
              { name: 'Virement', icon: '🏛️', color: 'bg-orange-50 hover:bg-orange-100' },
              { name: 'COD', icon: '💵', color: 'bg-gray-50 hover:bg-gray-100' },
            ].map((method) => (
              <div key={method.name} className={`${method.color} p-4 rounded-xl text-center transition-colors cursor-pointer`}>
                <span className="text-2xl">{method.icon}</span>
                <p className="text-sm font-medium mt-2">{method.name}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-[#006233] hover:bg-[#004d28] text-white px-8" asChild>
              <Link href="/checkout">
                Essayer la Démo de Paiement
                <ArrowRight className={`ml-2 h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8" asChild>
              <Link href="/payments">
                En savoir plus
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              {t('home.cta.title') || 'Prêt à Développer Votre Entreprise?'}
            </h2>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              {t('home.cta.description') || 'Rejoignez la plus grande plateforme B2B d\'Algérie. Inscrivez-vous gratuitement et commencez à trouver de nouveaux clients dès aujourd\'hui.'}
            </p>
          </div>
          
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <Button size="lg" variant="secondary" className="bg-white text-green-700 hover:bg-gray-100 px-8 text-lg" asChild>
              <Link href="/register?role=buyer">
                {t('home.cta.buyerBtn') || 'Je Veux Acheter'}
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 text-lg" asChild>
              <Link href="/register?role=supplier">
                {t('home.cta.sellerBtn') || 'Je Veux Vendre'}
              </Link>
            </Button>
          </div>

          <div className={`flex items-center justify-center gap-6 text-sm text-green-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              {t('home.cta.freeRegistration') || 'Inscription Gratuite'}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              {t('home.cta.noCreditCard') || 'Pas de Carte Bancaire'}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              {t('home.cta.support247') || 'Support 24/7'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
