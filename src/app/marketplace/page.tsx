'use client';

/**
 * Marketplace Page
 * Directory of all available white-label platforms
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Globe, 
  Filter,
  Grid3X3,
  List,
  TrendingUp,
  Star,
  ArrowRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TenantShowcase, FeaturedTenantShowcase, PublicTenant } from '@/components/marketplace/TenantShowcase';

export default function MarketplacePage() {
  const [tenants, setTenants] = useState<PublicTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch public tenants
  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/public/tenants');
      if (response.ok) {
        const data = await response.json();
        setTenants(data);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter tenants
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.countryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCountry = selectedCountry === 'all' || tenant.countryCode === selectedCountry;
    
    return matchesSearch && matchesCountry;
  });

  // Get unique countries for filter
  const countries = Array.from(new Set(tenants.map(t => t.countryCode)));

  // Featured tenant (first one or most popular)
  const featuredTenant = tenants.find(t => t.slug === 'algeriatrade') || tenants[0];
  const otherTenants = filteredTenants.filter(t => t.id !== featuredTenant?.id);

  // Country flag mapping for filters
  const countryInfo: Record<string, { name: string; flag: string }> = {
    DZ: { name: 'Algérie', flag: '🇩🇿' },
    TN: { name: 'Tunisie', flag: '🇹🇳' },
    MA: { name: 'Maroc', flag: '🇲🇦' },
    EG: { name: 'Égypte', flag: '🇪🇬' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-secondary text-white py-16 px-4">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-0">
              <Globe className="mr-2 h-4 w-4" />
              Marketplace de Plateformes B2B
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Découvrez Nos Plateformes<br />
              <span className="text-white/80">Multi-Pays</span>
            </h1>
            
            <p className="text-lg text-white/80 mb-8">
              AlgeriaTrade et ses plateformes partenaires connectent des milliers d&apos;entreprises 
              à travers le Maghreb et le Moyen-Orient. Trouvez la plateforme adaptée à votre marché.
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Rechercher une plateforme ou un pays..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 rounded-full text-gray-900 shadow-lg"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 text-center">
            <div>
              <p className="text-3xl font-bold">{tenants.length}+</p>
              <p className="text-sm text-white/70">Plateformes</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{countries.length}</p>
              <p className="text-sm text-white/70">Pays</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {tenants.reduce((acc, t) => acc + (t._count?.companies || 0), 0).toLocaleString()}+
              </p>
              <p className="text-sm text-white/70">Entreprises</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {tenants.reduce((acc, t) => acc + (t._count?.users || 0), 0).toLocaleString()}+
              </p>
              <p className="text-sm text-white/70">Utilisateurs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {/* Filters Bar */}
        <Card className="mb-8">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                
                {/* Country Filter */}
                <Button
                  variant={selectedCountry === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCountry('all')}
                >
                  Tous les pays
                </Button>
                
                {countries.map(code => (
                  <Button
                    key={code}
                    variant={selectedCountry === code ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCountry(code)}
                  >
                    {countryInfo[code]?.flag || '🌐'} {countryInfo[code]?.name || code}
                  </Button>
                ))}
              </div>

              {/* View Toggle */}
              <div className="flex items-center border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured Tenant */}
        {featuredTenant && !searchQuery && selectedCountry === 'all' && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <h2 className="text-xl font-semibold">Plateforme vedette</h2>
            </div>
            <FeaturedTenantShowcase tenant={featuredTenant} />
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {selectedCountry !== 'all' 
              ? `Plateformes en ${countryInfo[selectedCountry]?.name || ''}`
              : 'Toutes les plateformes'
            }
            <span className="text-gray-500 font-normal ml-2">
              ({otherTenants.length + (featuredTenant && !searchQuery && selectedCountry === 'all' ? 1 : 0)})
            </span>
          </h2>
          
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
            >
              Effacer la recherche
            </Button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded"></div>
                    <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTenants.length === 0 && (
          <Card className="text-center py-12">
            <Globe className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune plateforme trouvée
            </h3>
            <p className="text-gray-500 mb-4">
              Essayez de modifier vos critères de recherche
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCountry('all');
              }}
            >
              Réinitialiser les filtres
            </Button>
          </Card>
        )}

        {/* Tenants Grid/List */}
        {!loading && otherTenants.length > 0 && (
          <div className={
            viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }>
            {otherTenants.map(tenant => (
              <TenantShowcase key={tenant.id} tenant={tenant} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Vous souhaitez lancer votre propre plateforme ?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Notre solution white-label vous permet de créer votre marketplace B2B 
            avec votre branding, vos fonctionnalités et votre marché cible.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-gray-900"
              asChild
            >
              <a href="/super-admin/tenants/new">
                Démarrer maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-gray-300 hover:text-white"
              asChild
            >
              <a href="/contact">Nous contacter</a>
            </Button>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-12 border-t border-gray-700">
            <div>
              <TrendingUp className="h-8 w-8 mx-auto mb-3 text-green-400" />
              <h3 className="font-semibold mb-2">Rapide à déployer</h3>
              <p className="text-sm text-gray-400">
                Votre plateforme prête en quelques jours avec nos templates préconfigurés
              </p>
            </div>
            <div>
              <Star className="h-8 w-8 mx-auto mb-3 text-yellow-400" />
              <h3 className="font-semibold mb-2">100% Personnalisable</h3>
              <p className="text-sm text-gray-400">
                Couleurs, logo, fonctionnalités... tout est adaptable à votre marque
              </p>
            </div>
            <div>
              <Globe className="h-8 w-8 mx-auto mb-3 text-blue-400" />
              <h3 className="font-semibold mb-2">Multi-pays</h3>
              <p className="text-sm text-gray-400">
                Support natif pour plusieurs pays avec localisation complète
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
