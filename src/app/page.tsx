"use client";

/**
 * AlgeriaTrade Home Page - Multi-Tenant Aware
 * Main landing page with tenant-specific theming and content
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTranslation, useLanguage } from "@/lib/i18n";
import { useTenant } from "@/hooks/useTenant";
// AI Components
import TrendingProducts from "@/components/ai/TrendingProducts";
import RecommendedProducts from "@/components/ai/RecommendedProducts";
import RecommendedSuppliers from "@/components/ai/RecommendedSuppliers";
import ChatbotWidget from "@/components/ai/ChatbotWidget";
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
  ShieldCheck,
  Lock,
  Key,
  Eye,
  Fingerprint,
  Globe,
  Building2,
} from "lucide-react";

// Default stats (overridden by API on mount)
const defaultStats = [
  { label: "Fournisseurs vérifiés", value: "1,710+", icon: Factory },
  { label: "Produits référencés", value: "50,000+", icon: Package },
  { label: "Appels d'offres", value: "1,200+", icon: Handshake },
  { label: "Transactions", value: "15M+ DZD", icon: TrendingUp },
];

// Dynamic stats state interface
interface PlatformStats {
  companies?: {
    total: number;
    verified: number;
    exportReady: number;
  };
  products?: {
    total: number;
  };
  rfqs?: {
    active: number;
  };
  transactions?: {
    formattedVolume: string;
  };
}

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
    name: "Électronique & Électrique",
    description: "Composants, câbles, équipements électriques",
    icon: "⚡",
    count: "4,100+",
    href: "/categories/electronics-electrical",
    color: "bg-blue-50 border-blue-200 hover:border-blue-400",
  },
  {
    name: "Industrie & Machines",
    description: "Machines-outils, équipements industriels",
    icon: "🏭",
    count: "6,800+",
    href: "/categories/industrial-machinery",
    color: "bg-gray-50 border-gray-200 hover:border-gray-400",
  },
  {
    name: "Textile & Habillement",
    description: "Tissus, vêtements, accessoires mode",
    icon: "👔",
    count: "3,900+",
    href: "/categories/textile-clothing",
    color: "bg-purple-50 border-purple-200 hover:border-purple-400",
  },
  {
    name: "Chimie & Parapharmacie",
    description: "Produits chimiques, pharmaceutiques, cosmétiques",
    icon: "🧪",
    count: "2,700+",
    href: "/categories/chemicals-pharma",
    color: "bg-red-50 border-red-200 hover:border-red-400",
  },
];

export default function HomePage() {
  const { t, isRTL } = useTranslation();
  const { tenant, theme, locale, formatCurrency, features } = useTenant();
  const [mounted, setMounted] = useState(false);
  const [dynamicStats, setDynamicStats] = useState<PlatformStats | null>(null);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Fetch real platform statistics
    fetch('/api/stats/public')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setDynamicStats(data.data);
        }
      })
      .catch(err => console.error('Failed to fetch stats:', err));
  }, []);

  // Get tenant-specific stats (prefer dynamic data)
  const stats = defaultStats.map((stat, index) => {
    let value = stat.value;
    
    // Override with real data if available
    if (dynamicStats) {
      switch(index) {
        case 0: // Fournisseurs vérifiés
          value = `${dynamicStats.companies?.total?.toLocaleString() || stat.value}+`;
          break;
        case 1: // Produits référencés
          value = `${dynamicStats.products?.total?.toLocaleString() || stat.value}+`;
          break;
        case 2: // Appels d'offres
          value = `${dynamicStats.rfqs?.active?.toLocaleString() || stat.value}+`;
          break;
        case 3: // Transactions
          value = dynamicStats.transactions?.formattedVolume || stat.value;
          break;
      }
    }
    
    return { ...stat, value };
  });

  return (
    <div className="min-h-screen" style={{ 
      '--tenant-primary': theme.colors.primary,
      '--tenant-secondary': theme.colors.secondary,
    } as React.CSSProperties}>
      {/* Hero Section - Tenant Branded */}
      <section 
        className="relative overflow-hidden text-white py-20 lg:py-32"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className={isRTL ? "lg:order-2" : ""}>
              <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-0 hover:bg-white/30">
                <Globe className="mr-2 h-4 w-4" />
                {locale.countryName} • N°1 Marketplace B2B
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                {tenant.name}
                <br />
                <span className="text-white/90 text-3xl md:text-4xl">
                  Votre Partenaire B2B de Confiance en {locale.countryName}
                </span>
              </h1>
              
              <p className="text-lg text-white/80 mb-8 max-w-xl">
                Connectez-vous avec des fournisseurs vérifiés, découvrez des milliers de produits 
                et développez votre activité sur la marketplace B2B leader en {locale.countryName}.
                {features.whiteLabel && ' Plateforme white-label 100% personnalisable.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/products">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 shadow-lg">
                    Explorer les produits
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/rfqs/new">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                    Poster un appel d'offres
                    <Handshake className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  <span>Fournisseurs vérifiés</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  <span>Paiements sécurisés</span>
                </div>
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5" />
                  <span>Données protégées</span>
                </div>
              </div>
            </div>

            {/* Right Content - Stats Cards */}
            <div className={`${isRTL ? "lg:order-1" : ""} hidden lg:block`}>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                    <CardContent className="pt-6 pb-6">
                      <stat.icon className="h-8 w-8 mb-3 text-white/80" />
                      <p className="text-3xl font-bold">{stat.value}</p>
                      <p className="text-sm text-white/70">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Floating CTA */}
              <Card className="mt-4 bg-white text-gray-900 shadow-xl">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Rejoignez {stats[0].value} entreprises</p>
                      <p className="text-sm text-gray-500">Inscription gratuite en 2 minutes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="relative -mt-8 z-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder={`Rechercher parmi 50,000+ produits en ${locale.countryName}...`}
                    className="pl-12 py-3 text-base"
                  />
                </div>
                <Button 
                  size="lg" 
                  className="px-8"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  Rechercher
                </Button>
              </div>
              
              {/* Quick Links */}
              <div className="flex flex-wrap gap-2 mt-4 text-sm">
                <span className="text-gray-500">Populaire:</span>
                {['Panneaux solaires', 'Acier construction', 'Huile olive', 'Machines agricoles'].map((term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="text-gray-600 hover:text-[var(--tenant-primary)] transition-colors"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Catégories Populaires en {locale.countryName}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explorez nos catégories principales et trouvez exactement ce dont votre entreprise a besoin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Link key={index} href={category.href}>
                <Card className={`group hover:shadow-lg transition-all duration-300 border-2 ${category.color}`}>
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">{category.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg group-hover:text-[var(--tenant-primary)] transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                        <div className="flex items-center justify-between mt-4">
                          <Badge variant="secondary">{category.count} produits</Badge>
                          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[var(--tenant-primary)] group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/categories">
              <Button variant="outline" size="lg">
                Voir toutes les catégories
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* AI-Powered Recommendations Section */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Trending Products */}
          {mounted && <TrendingProducts limit={12} period={168} />}
          
          {/* AI Recommended Products */}
          {mounted && (
            <RecommendedProducts 
              context="homepage"
              limit={10}
              title="Recommandé pour vous"
            />
          )}
          
          {/* Recommended Suppliers */}
          {mounted && (
            <RecommendedSuppliers 
              limit={6}
              title="Fournisseurs recommandés par l'IA"
            />
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-gray-600">
              Trois étapes simples pour développer votre activité avec {tenant.name}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Créez votre compte",
                description: "Inscription gratuite en quelques minutes. Complétez votre profil entreprise.",
                icon: Users,
              },
              {
                step: "02",
                title: "Trouvez des fournisseurs",
                description: "Parcourez le catalogue ou publiez un appel d'offres pour recevoir des devis.",
                icon: Search,
              },
              {
                step: "03",
                title: "Faites affaire",
                description: "Comparez les offres, négociez et finalisez vos transactions en toute sécurité.",
                icon: Handshake,
              },
            ].map((item, index) => (
              <Card key={index} className="relative overflow-hidden group">
                <div 
                  className="absolute top-0 left-0 w-full h-1"
                  style={{ backgroundColor: theme.colors.primary }}
                ></div>
                <CardContent className="pt-8 pb-8">
                  <span 
                    className="inline-block text-5xl font-bold opacity-10 absolute top-4 right-4"
                    style={{ color: theme.colors.primary }}
                  >
                    {item.step}
                  </span>
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${theme.colors.primary}15` }}
                  >
                    <item.icon 
                      className="h-7 w-7" 
                      style={{ color: theme.colors.primary }}
                    />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Pourquoi choisir {tenant.name} ?
              </h2>
              
              <div className="space-y-4">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Fournisseurs Vérifiés",
                    desc: "Tous nos fournisseurs passent par un processus de vérification rigoureux.",
                  },
                  {
                    icon: Lock,
                    title: "Transactions Sécurisées",
                    desc: "Système de paiement intégré avec protection des transactions.",
                  },
                  {
                    icon: MapPin,
                    title: "Focus {locale.countryCode}",
                    desc: `Spécialisé sur le marché ${locale.countryName} avec une connaissance approfondie des besoins locaux.`,
                  },
                  {
                    icon: Star,
                    title: "Avis & Notations",
                    desc: "Prenez des décisions éclairées grâce aux avis authentiques des acheteurs.",
                  },
                  {
                    icon: Building2,
                    title: "Outils B2B Complets",
                    desc: "RFQ, messagerie, suivi de commandes... tout pour faciliter vos échanges.",
                  },
                  ...(features.apiAccess ? [{
                    icon: Globe,
                    title: "API Disponible",
                    desc: "Intégrez notre plateforme à vos systèmes existants via notre API REST.",
                  }] : []),
                ].map((feature, index) => (
                  <div key={index} className="flex gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${theme.colors.primary}15` }}
                    >
                      <feature.icon 
                        className="h-5 w-5" 
                        style={{ color: theme.colors.primary }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image/Illustration placeholder */}
            <div className="hidden lg:block">
              <div 
                className="rounded-2xl p-8 shadow-xl"
                style={{ background: `linear-gradient(135deg, ${theme.colors.primary}10, ${theme.colors.secondary}10)` }}
              >
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div 
                            className="w-16 h-16 rounded-lg flex-shrink-0"
                            style={{ backgroundColor: `${theme.colors.primary}20` }}
                          ></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                            <div className="flex items-center gap-2 mt-3">
                              <Badge variant="secondary">Vérifié ✓</Badge>
                              <span className="text-sm text-gray-500">{locale.countryName}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold" style={{ color: theme.colors.primary }}>
                              {formatCurrency(Math.random() * 10000 + 1000)}
                            </p>
                            <Star className="h-4 w-4 inline text-yellow-500 fill-yellow-500 ml-1" />
                            <span className="text-sm text-gray-500">(4.8)</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    +{Math.floor(Math.random() * 50000 + 10000).toLocaleString()} produits disponibles
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-16 px-4 text-white"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prêt à développer votre activité en {locale.countryName} ?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers d&apos;entreprises qui font confiance à {tenant.name} 
            pour leurs achats B2B.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 shadow-lg">
                Créer un compte gratuit
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/suppliers">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                Devenir fournisseur
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-white/20">
            <div className="text-center">
              <p className="text-2xl font-bold">98%</p>
              <p className="text-sm text-white/70">Clients satisfaits</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">&lt;24h</p>
              <p className="text-sm text-white/70">Délai de réponse moyen</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-sm text-white/70">Support disponible</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{locale.currencySymbol}</p>
              <p className="text-sm text-white/70">Devise locale</p>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Link (if not on main platform) */}
      {tenant.slug !== 'algeriatrade' && (
        <section className="py-8 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-600">
              Vous cherchez d&apos;autres marchés ?{' '}
              <Link href="/marketplace" className="font-medium hover:underline" style={{ color: theme.colors.primary }}>
                Découvrez toutes nos plateformes →
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* AI Chatbot Widget - Always visible */}
      {mounted && <ChatbotWidget />}
    </div>
  );
}
