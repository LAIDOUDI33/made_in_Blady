'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  FileText, 
  BarChart3, 
  Calendar, 
  Filter,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Package,
  Users,
  MapPin,
  CreditCard,
  ShoppingCart,
  Building2,
  Eye,
  AlertTriangle,
  ChevronDown,
  RefreshCw,
  Settings,
  FileSpreadsheet,
  FileType,
  Globe,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  period: string;
  formats: string[];
  icon: string;
  category: string;
  estimatedTimeMs?: number;
}

interface ReportGenerationResult {
  success: boolean;
  data?: {
    reportId: string;
    downloadUrl: string;
    format: string;
    filename: string;
    metadata: {
      recordCount: number;
      processingTimeMs: number;
      fileSize: number;
    };
    expiresAt: string;
    summary: Record<string, string | number>;
    insightsCount: number;
  };
  error?: string;
}

// ============================================
// Constants
// ============================================

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'monthly-sales',
    name: 'Rapport de Ventes Mensuel',
    description: "Vue d'ensemble complète des ventes avec tendances et performances",
    type: 'sales_overview',
    period: 'month',
    formats: ['pdf', 'excel', 'csv'],
    icon: '📈',
    category: 'sales',
    estimatedTimeMs: 3000,
  },
  {
    id: 'product-performance',
    name: 'Performance des Produits',
    description: 'Analyse détaillée des produits les plus performants',
    type: 'product_performance',
    period: 'quarter',
    formats: ['pdf', 'excel'],
    icon: '🏆',
    category: 'products',
    estimatedTimeMs: 5000,
  },
  {
    id: 'geographic-analysis',
    name: 'Analyse Géographique',
    description: 'Répartition des ventes par wilaya et région',
    type: 'geographic_distribution',
    period: 'quarter',
    formats: ['pdf', 'html', 'excel'],
    icon: '🗺️',
    category: 'sales',
    estimatedTimeMs: 4000,
  },
  {
    id: 'rfq-summary',
    name: "Synthèse des Appels d'Offres",
    description: 'Statistiques sur les demandes de devis RFQ',
    type: 'rfq_analysis',
    period: 'month',
    formats: ['csv', 'excel', 'pdf'],
    icon: '📋',
    category: 'operations',
    estimatedTimeMs: 2500,
  },
  {
    id: 'user-growth',
    name: 'Croissance des Utilisateurs',
    description: "Évolution des inscriptions et de l'activité utilisateur",
    type: 'user_growth',
    period: 'year',
    formats: ['pdf', 'json'],
    icon: '👥',
    category: 'users',
    estimatedTimeMs: 2000,
  },
  {
    id: 'revenue-by-category',
    name: 'Revenus par Catégorie',
    description: "Chiffre d'affaires par catégorie de produits",
    type: 'revenue_by_category',
    period: 'quarter',
    formats: ['pdf', 'excel'],
    icon: '💰',
    category: 'financial',
    estimatedTimeMs: 3500,
  },
  {
    id: 'payment-methods-report',
    name: 'Analyse des Paiements',
    description: "Statistiques d'utilisation des modes de paiement",
    type: 'payment_methods',
    period: 'month',
    formats: ['pdf', 'csv'],
    icon: '💳',
    category: 'financial',
    estimatedTimeMs: 2000,
  },
  {
    id: 'supplier-analytics',
    name: 'Analyse des Fournisseurs',
    description: 'Performance et activité des fournisseurs',
    type: 'supplier_analytics',
    period: 'quarter',
    formats: ['pdf', 'excel'],
    icon: '🏭',
    category: 'products',
    estimatedTimeMs: 4500,
  },
  {
    id: 'buyer-behavior',
    name: 'Comportement des Acheteurs',
    description: "Patterns d'achat et préférences des acheteurs",
    type: 'buyer_behavior',
    period: 'quarter',
    formats: ['pdf', 'json'],
    icon: '🛒',
    category: 'users',
    estimatedTimeMs: 4000,
  },
  {
    id: 'inventory-status',
    name: 'État des Stocks',
    description: "Niveaux d'inventaire et alertes de réapprovisionnement",
    type: 'inventory_status',
    period: 'today',
    formats: ['excel', 'csv', 'pdf'],
    icon: '📦',
    category: 'operations',
    estimatedTimeMs: 1500,
  },
];

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-4 h-4 text-red-500" />,
  csv: <FileType className="w-4 h-4 text-green-500" />,
  excel: <FileSpreadsheet className="w-4 h-4 text-green-600" />,
  json: <FileType className="w-4 h-4 text-blue-500" />,
  html: <Globe className="w-4 h-4 text-orange-500" />,
};

const CATEGORY_CONFIG = {
  sales: { label: 'Ventes & Revenus', color: 'bg-green-100 text-green-800 border-green-200' },
  products: { label: 'Produits & Catalogue', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  users: { label: 'Utilisateurs', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  financial: { label: 'Financier', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  operations: { label: 'Opérations', color: 'bg-orange-100 text-orange-800 border-orange-200' },
};

// ============================================
// Main Component
// ============================================

export default function ReportsPage() {
  // State
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [generating, setGenerating] = useState<boolean>(false);
  const [result, setResult] = useState<ReportGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  // Fetch templates on mount (could be from API)
  useEffect(() => {
    // Templates are hardcoded for now, could fetch from /api/admin/reports/templates
  }, []);

  // Generate report handler
  const handleGenerateReport = useCallback(async () => {
    if (!selectedTemplate) return;

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedTemplate,
          format: selectedFormat,
          period: selectedPeriod,
          includeCharts: true,
          includeRawData: true,
          limit: 500,
        }),
      });

      const data: ReportGenerationResult = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération du rapport');
      }

      setResult(data);

      // Auto-download if successful
      if (data.success && data.data?.downloadUrl) {
        // Open download in new tab
        window.open(data.data.downloadUrl, '_blank');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setGenerating(false);
    }
  }, [selectedTemplate, selectedFormat, selectedPeriod]);

  // Filter templates by category
  const filteredTemplates = activeCategory === 'all'
    ? REPORT_TEMPLATES
    : REPORT_TEMPLATES.filter(t => t.category === activeCategory);

  // Get current template info
  const currentTemplate = REPORT_TEMPLATES.find(t => t.id === selectedTemplate || t.type === selectedTemplate);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Rapports Avancés
          </h1>
          <p className="text-muted-foreground mt-1">
            Générez et téléchargez des rapports personnalisés pour analyser votre activité
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowCustomBuilder(!showCustomBuilder)}
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          Rapport Personnalisé
        </Button>
      </div>

      {/* Result/Error Display */}
      {result && result.success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">Rapport généré avec succès !</h3>
                <p className="text-sm text-green-700 mt-1">
                  {result.data?.recordCount} enregistrements traités en {result.data?.metadata.processingTimeMs}ms
                </p>
                <div className="flex gap-3 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => result.data?.downloadUrl && window.open(result.data.downloadUrl, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Télécharger ({result.data?.format.toUpperCase()})
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setResult(null)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">Erreur de génération</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <Button size="sm" variant="ghost" className="mt-2" onClick={() => setError(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={activeCategory === 'all' ? 'default' : 'outline'}
          className="cursor-pointer px-4 py-2"
          onClick={() => setActiveCategory('all')}
        >
          Tous ({REPORT_TEMPLATES.length})
        </Badge>
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const count = REPORT_TEMPLATES.filter(t => t.category === key).length;
          return (
            <Badge
              key={key}
              variant={activeCategory === key ? 'default' : 'outline'}
              className={`cursor-pointer px-4 py-2 ${activeCategory === key ? '' : config.color}`}
              onClick={() => setActiveCategory(key)}
            >
              {config.label} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Report Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className={`hover:shadow-lg transition-all cursor-pointer border-2 ${
              selectedTemplate === template.type ? 'border-primary shadow-md' : 'border-transparent hover:border-primary/30'
            }`}
            onClick={() => setSelectedTemplate(template.type)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <span className="text-4xl">{template.icon}</span>
                <Badge 
                  variant="secondary" 
                  className={`${CATEGORY_CONFIG[template.category as keyof typeof CATEGORY_CONFIG]?.color || ''}`}
                >
                  {CATEGORY_CONFIG[template.category as keyof typeof CATEGORY_CONFIG]?.label}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-2">{template.name}</CardTitle>
              <CardDescription className="text-sm">{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {template.formats.map((format) => (
                  <span key={format} className="flex items-center gap-1 text-xs text-muted-foreground">
                    {FORMAT_ICONS[format]}
                    {format.toUpperCase()}
                  </span>
                ))}
              </div>
              
              {/* Quick generate button when template is selected */}
              {selectedTemplate === template.type && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex gap-2">
                    <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                      <SelectTrigger className="flex-1 h-9 text-sm">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent>
                        {template.formats.map((f) => (
                          <SelectItem key={f} value={f}>{f.toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="flex-1 h-9 text-sm">
                        <SelectValue placeholder="Période" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Aujourd'hui</SelectItem>
                        <SelectItem value="week">Semaine</SelectItem>
                        <SelectItem value="month">Mois</SelectItem>
                        <SelectItem value="quarter">Trimestre</SelectItem>
                        <SelectItem value="year">Année</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateReport();
                    }}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Générer le Rapport
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Report Builder */}
      {showCustomBuilder && (
        <Card className="border-dashed border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Constructeur de Rapport Personnalisé
            </CardTitle>
            <CardDescription>
              Créez un rapport avec vos propres critères et filtres avancés
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Report Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de Rapport</label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales_overview">Vue d'ensemble des Ventes</SelectItem>
                    <SelectItem value="product_performance">Performance des Produits</SelectItem>
                    <SelectItem value="supplier_analytics">Analyse des Fournisseurs</SelectItem>
                    <SelectItem value="buyer_behavior">Comportement des Acheteurs</SelectItem>
                    <SelectItem value="rfq_analysis">Appels d'Offres (RFQ)</SelectItem>
                    <SelectItem value="revenue_by_category">Revenus par Catégorie</SelectItem>
                    <SelectItem value="geographic_distribution">Distribution Géographique</SelectItem>
                    <SelectItem value="payment_methods">Méthodes de Paiement</SelectItem>
                    <SelectItem value="user_growth">Croissance Utilisateurs</SelectItem>
                    <SelectItem value="inventory_status">État des Stocks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Export Format */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Format d'Export</label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF (Document)</SelectItem>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (Données brutes)</SelectItem>
                    <SelectItem value="json">JSON (API)</SelectItem>
                    <SelectItem value="html">HTML (Web)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time Period */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Période</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                    <SelectItem value="week">Cette Semaine</SelectItem>
                    <SelectItem value="month">Ce Mois</SelectItem>
                    <SelectItem value="quarter">Ce Trimestre</SelectItem>
                    <SelectItem value="year">Cette Année</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Options */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Options</label>
                <div className="flex gap-2">
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                    📊 Avec Graphiques
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                    📋 Données Brutes
                  </Badge>
                </div>
              </div>
            </div>

            {/* Advanced Filters Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <ChevronDown className="w-4 h-4" />
                Filtres Avancés (Optionnel)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Catégories</label>
                  <select multiple className="w-full p-2 border rounded-md text-sm h-20">
                    <option>Toutes les catégories</option>
                    <option>Électronique</option>
                    <option>Textile</option>
                    <option>Alimentation</option>
                    <option>Bâtiment</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Wilayas</label>
                  <select multiple className="w-full p-2 border rounded-md text-sm h-20">
                    <option>Toutes les wilayas</option>
                    <option>Alger</option>
                    <option>Oran</option>
                    <option>Constantine</option>
                    <option>Sétif</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Plage de Prix</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min (DZD)"
                      className="w-full p-2 border rounded-md text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max (DZD)"
                      className="w-full p-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCustomBuilder(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleGenerateReport}
                disabled={!selectedTemplate || generating}
                className="min-w-[200px]"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Générer le Rapport
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">10</p>
                <p className="text-xs text-muted-foreground">Types de Rapports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-xs text-muted-foreground">Formats d'Export</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">~3s</p>
                <p className="text-xs text-muted-foreground">Temps Moyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <RefreshCw className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">24h</p>
                <p className="text-xs text-muted-foreground">Validité Lien</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Aide & Conseils
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">📌 Comment utiliser :</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Sélectionnez un modèle de rapport dans la grille ci-dessus</li>
                <li>Choisissez le format d&apos;export souhaité (PDF recommandé)</li>
                <li>Définissez la période d&apos;analyse</li>
                <li>Cliquez sur &quot;Générer le Rapport&quot;</li>
                <li>Le téléchargement démarre automatiquement</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">💡 Bonnes pratiques :</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Pour les rapports complets, utilisez le format PDF</li>
                <li>Pour l&apos;analyse de données, préférez Excel ou CSV</li>
                <li>Les rapports trimestriels offrent une bonne vue d&apos;ensemble</li>
                <li>Les liens de téléchargement expirent après 24 heures</li>
                <li>Les rapports sont disponibles uniquement pour les admins</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
