'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code2, BookOpen, Key, BarChart3, Plug, Zap, Shield, FileText,
  Copy, ExternalLink, CheckCircle, ArrowRight, Globe, Lock,
  Server, Clock, Users, Star, ChevronRight
} from 'lucide-react';

export default function ApiPortalPage() {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string>('');
  const [activeTab, setActiveTab] = useState('endpoints');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-r from-[#006233] via-[#007a40] to-[#006233] text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="container relative mx-auto px-4 py-20 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30 px-4 py-1.5 text-sm font-medium">
              🚀 Developer Portal v1.0
            </Badge>
            <h1 className="mb-6 bg-gradient-to-r from-white to-green-100 bg-clip-text text-5xl font-bold tracking-tight lg:text-7xl">
              AlgeriaTrade API
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-green-100/90">
              Intégrez le plus grand marché B2B d&apos;Algérie dans vos applications.
              Accédez à des milliers de produits, fournisseurs et données commerciales
              via notre API RESTful complète.
            </p>
            
            {/* Quick Stats */}
            <div className="mb-10 grid grid-cols-2 gap-6 md:grid-cols-4">
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">12+</div>
                <div className="text-sm text-green-100">Endpoints</div>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">99.9%</div>
                <div className="text-sm text-green-100">Uptime SLA</div>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">&lt;50ms</div>
                <div className="text-sm text-green-100">Avg Response</div>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-sm text-green-100">Support Pro</div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-[#006233] hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all">
                <Key className="mr-2 h-5 w-5" />
                Obtenir une Clé API
              </Button>
              <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10 backdrop-blur-sm">
                <BookOpen className="mr-2 h-5 w-5" />
                Documentation Complète
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mx-auto max-w-6xl">
          <TabsList className="grid h-auto w-full grid-cols-4 gap-2 rounded-xl bg-gray-100 p-2">
            <TabsTrigger 
              value="endpoints" 
              className="rounded-lg py-3 data-[state=active]:bg-white data-[state=active]:shadow-md"
            >
              <Plug className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Points de Terminaison</span>
              <span className="sm:hidden">API</span>
            </TabsTrigger>
            <TabsTrigger 
              value="quickstart"
              className="rounded-lg py-3 data-[state=active]:bg-white data-[state=active]:shadow-md"
            >
              <Zap className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Démarrage Rapide</span>
              <span className="sm:hidden">Start</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sdks"
              className="rounded-lg py-3 data-[state=active]:bg-white data-[state=active]:shadow-md"
            >
              <Code2 className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">SDK & Exemples</span>
              <span className="sm:hidden">SDK</span>
            </TabsTrigger>
            <TabsTrigger 
              value="console"
              className="rounded-lg py-3 data-[state=active]:bg-white data-[state=active]:shadow-md"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Console</span>
              <span className="sm:hidden">Test</span>
            </TabsTrigger>
          </TabsList>

          {/* Endpoints Tab */}
          <TabsContent value="endpoints" className="mt-8 space-y-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">API Endpoints</h2>
                <p className="mt-1 text-gray-600">Tous les endpoints disponibles pour intégrer AlgeriaTrade</p>
              </div>
              <Badge variant="outline" className="px-3 py-1">
                Version 1.0.0
              </Badge>
            </div>

            {/* Products Section */}
            <div className="space-y-4">
              <h3 className="flex items-center text-lg font-semibold text-gray-800">
                <Badge className="mr-2 bg-green-100 text-green-700">Produits</Badge>
                Product Management
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* List Products Endpoint */}
                <Card className="group hover:border-[#006233]/30 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">GET</Badge>
                      <Badge variant="outline" className="text-xs">Cost: 1</Badge>
                    </div>
                    <CardTitle className="text-base mt-2">Lister les Produits</CardTitle>
                    <CardDescription className="text-xs">
                      Récupérer tous les produits avec filtres avancés
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <code className="block rounded-lg bg-gray-900 p-3 text-sm text-green-400 overflow-x-auto">
                      /api/v1/products
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-3 w-full justify-center text-xs"
                      onClick={() => copyToClipboard('/api/v1/products', 'products')}
                    >
                      {copiedEndpoint === 'products' ? (
                        <><CheckCircle className="mr-1 h-3 w-3 text-green-500" /> Copié!</>
                      ) : (
                        <><Copy className="mr-1 h-3 w-3" /> Copier l&apos;URL</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Get Product Endpoint */}
                <Card className="group hover:border-[#006233]/30 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">GET</Badge>
                      <Badge variant="outline" className="text-xs">Cost: 1</Badge>
                    </div>
                    <CardTitle className="text-base mt-2">Détails Produit</CardTitle>
                    <CardDescription className="text-xs">
                      Obtenir les détails d&apos;un produit par slug
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <code className="block rounded-lg bg-gray-900 p-3 text-sm text-green-400 overflow-x-auto">
                      /api/v1/products/{'{slug}'}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-3 w-full justify-center text-xs"
                      onClick={() => copyToClipboard('/api/v1/products/{slug}', 'product-detail')}
                    >
                      {copiedEndpoint === 'product-detail' ? (
                        <><CheckCircle className="mr-1 h-3 w-3 text-green-500" /> Copié!</>
                      ) : (
                        <><Copy className="mr-1 h-3 w-3" /> Copier l&apos;URL</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Categories Endpoint */}
                <Card className="group hover:border-[#006233]/30 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">GET</Badge>
                      <Badge variant="outline" className="text-xs">Cost: 1</Badge>
                    </div>
                    <CardTitle className="text-base mt-2">Catégories</CardTitle>
                    <CardDescription className="text-xs">
                      Lister toutes les catégories de produits
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <code className="block rounded-lg bg-gray-900 p-3 text-sm text-green-400 overflow-x-auto">
                      /api/v1/categories
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-3 w-full justify-center text-xs"
                      onClick={() => copyToClipboard('/api/v1/categories', 'categories')}
                    >
                      {copiedEndpoint === 'categories' ? (
                        <><CheckCircle className="mr-1 h-3 w-3 text-green-500" /> Copié!</>
                      ) : (
                        <><Copy className="mr-1 h-3 w-3" /> Copier l&apos;URL</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Search Section */}
            <div className="space-y-4 pt-6">
              <h3 className="flex items-center text-lg font-semibold text-gray-800">
                <Badge className="mr-2 bg-blue-100 text-blue-700">Recherche</Badge>
                Search
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Search Endpoint */}
                <Card className="group hover:border-[#006233]/30 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-blue-500 text-white hover:bg-blue-600">GET</Badge>
                      <Badge variant="outline" className="text-xs">Cost: 2</Badge>
                    </div>
                    <CardTitle className="text-base mt-2">Recherche Globale</CardTitle>
                    <CardDescription className="text-xs">
                      Chercher produits et fournisseurs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <code className="block rounded-lg bg-gray-900 p-3 text-sm text-blue-400 overflow-x-auto">
                      /api/v1/search?q=panneau+solaire
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-3 w-full justify-center text-xs"
                      onClick={() => copyToClipboard('/api/v1/search?q=', 'search')}
                    >
                      {copiedEndpoint === 'search' ? (
                        <><CheckCircle className="mr-1 h-3 w-3 text-green-500" /> Copié!</>
                      ) : (
                        <><Copy className="mr-1 h-3 w-3" /> Copier l&apos;URL</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Companies Section */}
            <div className="space-y-4 pt-6">
              <h3 className="flex items-center text-lg font-semibold text-gray-800">
                <Badge className="mr-2 bg-purple-100 text-purple-700">Entreprises</Badge>
                Companies
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Companies Endpoint */}
                <Card className="group hover:border-[#006233]/30 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-purple-500 text-white hover:bg-purple-600">GET</Badge>
                      <Badge variant="outline" className="text-xs">Cost: 1</Badge>
                    </div>
                    <CardTitle className="text-base mt-2">Entreprises Vérifiées</CardTitle>
                    <CardDescription className="text-xs">
                      Liste des fournisseurs certifiés
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <code className="block rounded-lg bg-gray-900 p-3 text-sm text-purple-400 overflow-x-auto">
                      /api/v1/companies?verified=true
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-3 w-full justify-center text-xs"
                      onClick={() => copyToClipboard('/api/v1/companies?verified=true', 'companies')}
                    >
                      {copiedEndpoint === 'companies' ? (
                        <><CheckCircle className="mr-1 h-3 w-3 text-green-500" /> Copié!</>
                      ) : (
                        <><Copy className="mr-1 h-3 w-3" /> Copier l&apos;URL</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* OpenAPI Spec Download */}
            <Card className="mt-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
              <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
                <div className="h-full w-full" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
              </div>
              <CardContent className="relative flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-green-400" />
                    <h3 className="font-semibold text-lg">Spécification OpenAPI 3.0</h3>
                  </div>
                  <p className="text-sm text-gray-400 max-w-md">
                    Téléchargez la spécification complète pour importer dans Postman, Insomnia, 
                    Swagger UI ou tout autre client REST compatible OpenAPI.
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <Button variant="secondary" className="bg-white text-gray-900 hover:bg-gray-100">
                    <FileText className="mr-2 h-4 w-4" />
                    JSON (OpenAPI)
                  </Button>
                  <Button variant="outline" className="border-gray-600 text-white hover:bg-white/10">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Swagger UI
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Start Tab */}
          <TabsContent value="quickstart" className="mt-8">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#006233] to-[#007a40] text-white pb-8">
                <CardTitle className="flex items-center text-2xl">
                  <Zap className="mr-3 h-7 w-7" />
                  Démarrage Rapide en 3 Étapes
                </CardTitle>
                <CardDescription className="text-green-100 mt-2">
                  Commencez à utiliser l&apos;API en moins de 5 minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-10">
                {/* Step 1 */}
                <div className="flex gap-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#006233] to-[#008a45] text-white text-xl font-bold shadow-lg shadow-green-500/25">
                    1
                  </div>
                  <div class="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-[#006233]" />
                      <h3 className="font-bold text-lg text-gray-900">Créez votre Compte Développeur</h3>
                    </div>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Inscrivez-vous gratuitement sur AlgeriaTrade et accédez au portail développeur. 
                      Aucune carte bancaire requise pour le plan gratuit.
                    </p>
                    <Link href="/register">
                      <Button variant="outline" className="group">
                        Créer un Compte Gratuit
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 pl-20">
                  <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#006233] to-[#008a45] text-white text-xl font-bold shadow-lg shadow-green-500/25">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="h-5 w-5 text-[#006233]" />
                      <h3 className="font-bold text-lg text-gray-900">Générez votre Clé API</h3>
                    </div>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Créez une clé API depuis votre tableau de bord développeur. 
                      Choisissez les permissions nécessaires et configurez vos limites de taux.
                    </p>
                    <div className="rounded-xl bg-gray-900 p-5 font-mono text-sm overflow-x-auto">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="h-4 w-4 text-yellow-400" />
                        <span className="text-gray-400 text-xs"># Exemple de clé (affichée une seule fois)</span>
                      </div>
                      <code className="text-green-400 tracking-wider">at_7xK9mP2qR5vW8yB3nF6tJ1hG4cD0eA</code>
                    </div>
                    <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center"><Shield className="mr-1 h-3 w-3" /> SHA-256 hashé</span>
                      <span className="flex items-center"><Clock className="mr-1 h-3 w-3" /> Expiration configurable</span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 pl-20">
                  <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#006233] to-[#008a45] text-white text-xl font-bold shadow-lg shadow-green-500/25">
                    3
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Code2 className="h-5 w-5 text-[#006233]" />
                      <h3 className="font-bold text-lg text-gray-900">Faites votre Premier Appel API</h3>
                    </div>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Utilisez votre clé pour interagir avec l&apos;API et récupérer des données en temps réel.
                    </p>
                    <pre className="rounded-xl bg-gray-900 p-5 text-sm overflow-x-auto border border-gray-800">
<code className="text-green-400">{`curl -X GET "https://api.algeriatrade.dz/api/v1/products" \\
  -H "X-API-Key: at_votre_cle_api" \\
  -H "Accept: application/json"`}</code></pre>
                    
                    <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-green-800">
                          <strong>Réponse attendue:</strong> Liste de produits au format JSON avec pagination, métadonnées et headers de rate limiting.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SDK Tab */}
          <TabsContent value="sdks" className="mt-8 space-y-6">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900">SDK & Bibliothèques Officielles</h2>
              <p className="mt-2 text-gray-600">Intégrez rapidement avec nos SDK maintenus officiellement</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* JavaScript SDK */}
              <Card className="overflow-hidden group hover:shadow-xl transition-shadow duration-300">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">⚡</span>
                    <div>
                      <h3 className="font-bold text-yellow-950">JavaScript / TypeScript</h3>
                      <p className="text-sm text-yellow-800">Node.js, Browser, Deno</p>
                    </div>
                  </div>
                </div>
                <CardContent className="pt-5">
                  <pre className="rounded-lg bg-gray-100 p-4 text-sm overflow-x-auto mb-4">
<code>{`import { AlgeriaTrade } from '@algeriatrade/sdk';

const client = new AlgeriaTrade({
  apiKey: process.env.API_KEY,
});

// Rechercher des produits
const products = await client.products.list({
  search: 'panneau solaire',
  limit: 10,
  wilaya: '16', // Alger
});

// Accéder aux résultats
console.log(products.data);
console.log(products.pagination);`}</code></pre>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" disabled>
                      <Code2 className="mr-2 h-4 w-4" />
                      npm install @algeriatrade/sdk
                    </Button>
                    <Button variant="ghost" size="icon" disabled>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <Badge variant="secondary" className="mt-4 w-full justify-center bg-yellow-50 text-yellow-700 border-yellow-200">
                    🚧 Bientôt disponible - Rejoignez la waitlist
                  </Badge>
                </CardContent>
              </Card>

              {/* Python SDK */}
              <Card className="overflow-hidden group hover:shadow-xl transition-shadow duration-300">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🐍</span>
                    <div>
                      <h3 className="font-bold text-white">Python</h3>
                      <p className="text-sm text-blue-100">Python 3.8+</p>
                    </div>
                  </div>
                </div>
                <CardContent className="pt-5">
                  <pre className="rounded-lg bg-gray-100 p-4 text-sm overflow-x-auto mb-4">
<code>{`from algeriatrade import AlgeriaTradeAPI

client = AlgeriaTradeAPI(
    api_key="your_api_key_here"
)

# Lister les produits
products = client.products.list(
    category="energie-solaire",
    limit=20,
    sort="price_asc"
)

for product in products.data:
    print(f"{product.name}: {product.price} DA")`}</code></pre>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" disabled>
                      <Code2 className="mr-2 h-4 w-4" />
                      pip install algeriatrade
                    </Button>
                    <Button variant="ghost" size="icon" disabled>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <Badge variant="secondary" className="mt-4 w-full justify-center bg-blue-50 text-blue-700 border-blue-200">
                    🚧 Bientôt disponible - Rejoignez la waitlist
                  </Badge>
                </CardContent>
              </Card>

              {/* PHP SDK */}
              <Card className="overflow-hidden group hover:shadow-xl transition-shadow duration-300">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🐘</span>
                    <div>
                      <h3 className="font-bold text-white">PHP</h3>
                      <p className="text-sm text-purple-100">PHP 8.0+</p>
                    </div>
                  </div>
                </div>
                <CardContent className="pt-5">
                  <pre className="rounded-lg bg-gray-100 p-4 text-sm overflow-x-auto mb-4">
<code>{`use AlgeriaTrade\\Client;

$client = new Client([
    'api_key' => 'your_api_key',
]);

$products = $client->products()->list([
    'search' => 'climatiseur',
    'limit' => 15,
]);

foreach ($products->data as $product) {
    echo $product->name . '\\n';
}`}</code></pre>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" disabled>
                      <Code2 className="mr-2 h-4 w-4" />
                      composer require algeriatrade/sdk
                    </Button>
                    <Button variant="ghost" size="icon" disabled>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <Badge variant="secondary" className="mt-4 w-full justify-center bg-purple-50 text-purple-700 border-purple-200">
                    🚧 Roadmap Q2 2025
                  </Badge>
                </CardContent>
              </Card>

              {/* cURL Examples */}
              <Card className="overflow-hidden group hover:shadow-xl transition-shadow duration-300">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🔗</span>
                    <div>
                      <h3 className="font-bold text-white">HTTP / cURL</h3>
                      <p className="text-sm text-gray-400">Tous langages</p>
                    </div>
                  </div>
                </div>
                <CardContent className="pt-5">
                  <pre className="rounded-lg bg-gray-100 p-4 text-sm overflow-x-auto mb-4">
<code>{`# Recherche de produits
curl "https://api.algeriatrade.dz/api/v1/search?q=solaire" \\
  -H "X-API-Key: YOUR_KEY"

# Création RFQ
curl -X POST "https://api.algeriatrade.dz/api/v1/rfqs" \\
  -H "X-API-Key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Besoin panneaux","quantity":100}'`}</code></pre>
                  <Button variant="outline" className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Voir tous les exemples cURL
                  </Button>
                  <Badge variant="secondary" className="mt-4 w-full justify-center bg-gray-100 text-gray-700 border-gray-200">
                    ✅ Disponible maintenant
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Console Tab */}
          <TabsContent value="console" className="mt-8">
            <Card>
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center text-xl">
                      <Server className="mr-3 h-6 w-6" />
                      Console de Test API
                    </CardTitle>
                    <CardDescription className="text-indigo-100 mt-1">
                      Testez les endpoints directement depuis votre navigateur
                    </CardDescription>
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30">
                    Interactive
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                  <Shield className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Authentification Requise</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Connectez-vous à votre compte développeur pour accéder à la console interactive 
                    et tester les endpoints avec votre clé API.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button className="bg-[#006233] hover:bg-[#004d28]">
                      Se Connecter
                    </Button>
                    <Button variant="outline">
                      Créer un Compte
                    </Button>
                  </div>
                  
                  {/* Preview of Console */}
                  <div className="mt-8 rounded-lg bg-gray-900 p-4 text-left max-w-2xl mx-auto opacity-75">
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-700">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs text-gray-500 ml-2">API Console</span>
                    </div>
                    <code className="text-xs text-gray-400">
                      <span className="text-green-400">$</span> GET /api/v1/products?category=energie<br/>
                      <span className="text-gray-500">// Response will appear here...</span>
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Pricing Section */}
      <section className="border-t bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-1.5">Tarification</Badge>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Plans API Adaptés à Vos Besoins</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Du développement au déploiement en production, choisissez le plan qui correspond à votre projet.
            </p>
          </div>
          
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
            {/* Free Tier */}
            <Card className="relative group hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-gray-600" />
                </div>
                <CardTitle className="text-xl">Gratuit</CardTitle>
                <CardDescription>Pour tester et développer</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">0 DA</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-3 h-4 w-4 text-green-500 shrink-0" /> 
                    <span>100 requêtes/jour</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-3 h-4 w-4 text-green-500 shrink-0" /> 
                    <span>Accès Produits &amp; Recherche</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-3 h-4 w-4 text-green-500 shrink-0" /> 
                    <span>Communauté Support</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-3 h-4 w-4 text-green-500 shrink-0" /> 
                    <span>Documentation complète</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-400">
                    <span className="mr-3 h-4 w-4 shrink-0 text-center">✕</span> 
                    <span>Webhooks temps réel</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-400">
                    <span className="mr-3 h-4 w-4 shrink-0 text-center">✕</span> 
                    <span>Analytics avancés</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full" size="lg">
                  Commencer Gratuitement
                </Button>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="relative border-2 border-[#006233] shadow-xl shadow-green-500/10 scale-105 md:-my-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-[#006233] to-[#008a45] px-4 py-1.5 text-sm shadow-lg">
                  ⭐ Populaire
                </Badge>
              </div>
              <CardHeader className="text-center pb-4 pt-6">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gradient-to-br from-[#006233] to-[#008a45] flex items-center justify-center">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Professionnel</CardTitle>
                <CardDescription>Pour les applications en production</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-5xl font-bold text-[#006233]">9,990</span>
                  <span className="text-muted-foreground"> DA/mois</span>
                </div>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-3 h-4 w-4 text-[#006233] shrink-0" /> 
                    <span><strong>10,000 requêtes/jour</strong></span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-3 h-4 w-4 text-[#006233] shrink-0" /> 
                    <span>Tous les endpoints</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-3 h-4 w-4 text-[#006233] shrink-0" /> 
                    <span>Webhooks temps réel</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-3 h-4 w-4 text-[#006233] shrink-0" /> 
                    <span>Support prioritaire</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-3 h-4 w-4 text-[#006233] shrink-0" /> 
                    <span>Analytics avancés</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-3 h-4 w-4 text-[#006233] shrink-0" /> 
                    <span>SLA 99.5%</span>
                  </li>
                </ul>
                <Button className="w-full bg-[#006233] hover:bg-[#004d28]" size="lg">
                  Choisir Pro →
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Tier */}
            <Card className="relative group hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Enterprise</CardTitle>
                <CardDescription>Pour les grandes organisations</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">Sur mesure</span>
                </div>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-3 h-4 w-4 text-green-500 shrink-0" /> 
                    <span>Requêtes illimitées</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-3 h-4 w-4 text-green-500 shrink-0" /> 
                    <span>SLA garanti <strong>99.9%</strong></span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-3 h-4 w-4 text-green-500 shrink-0" /> 
                    <span>Support dédié <strong>24/7</strong></span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-3 h-4 w-4 text-green-500 shrink-0" /> 
                    <span>Déploiement On-premise</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-3 h-4 w-4 text-green-500 shrink-0" /> 
                    <span>Intégrations personnalisées</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-3 h-4 w-4 text-green-500 shrink-0" /> 
                    <span>Account Manager dédié</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full" size="lg">
                  Nous Contacter
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Link */}
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-2">Des questions sur nos tarifs ?</p>
            <Link href="/contact" className="text-[#006233] hover:text-[#004d28] font-medium inline-flex items-center">
              Consultez notre FAQ ou contactez-nous
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-[#006233] py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à construire quelque chose d&apos;incroyable ?
          </h2>
          <p className="text-green-100 mb-8 max-w-2xl mx-auto">
            Rejoignez des centaines de développeurs qui utilisent déjà l&apos;API AlgeriaTrade 
            pour créer des applications innovantes sur le marché algérien.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" className="bg-white text-[#006233] hover:bg-gray-100">
              <Key className="mr-2 h-5 w-5" />
              Commencer Maintenant
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <BookOpen className="mr-2 h-5 w-5" />
              Lire la Documentation
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
