'use client';

/**
 * Admin Compliance Dashboard - AlgeriaTrade.dz
 * 
 * Comprehensive admin interface for managing marketplace compliance:
 * - Compliance dashboard with entity scores
 * - Violation management queue
 * - Rule configuration editor
 * - Screening results review
 * - Regulatory update notifications
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  UserX,
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Ban,
  CheckSquare,
  ChevronRight,
  Activity,
  Globe,
  Scale,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
  PieChart,
  Languages,
} from 'lucide-react';

// Types
interface ComplianceMetric {
  label: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface ViolationItem {
  id: string;
  entityId: string;
  entityName: string;
  module: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  ruleCode: string;
  title: string;
  detectedAt: string;
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  assignedTo?: string;
}

interface ScreeningCase {
  id: string;
  referenceId: string;
  entityName: string;
  entityType: 'individual' | 'organization';
  riskLevel: string;
  decision: string;
  createdAt: string;
  status: string;
}

interface RegulatoryUpdate {
  id: string;
  title: string;
  effectiveDate: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  read: boolean;
}

// Mock Data
const MOCK_METRICS: ComplianceMetric[] = [
  {
    label: 'Score Moyen Conformité',
    value: 78,
    change: 2.5,
    icon: <Shield className="h-6 w-6" />,
    color: 'text-emerald-600',
  },
  {
    label: 'Entités Monitorées',
    value: 15420,
    change: 3.2,
    icon: <Users className="h-6 w-6" />,
    color: 'text-blue-600',
  },
  {
    label: 'Violations Actives',
    value: 456,
    change: -12.8,
    icon: <AlertTriangle className="h-6 w-6" />,
    color: 'text-orange-600',
  },
  {
    label: 'Screenings Aujourd\'hui',
    value: 342,
    change: 15.4,
    icon: <UserX className="h-6 w-6" />,
    color: 'text-purple-600',
  },
];

const MOCK_VIOLATIONS: ViolationItem[] = [
  {
    id: 'v1',
    entityId: 'e001',
    entityName: 'Entreprise Example SPA',
    module: 'trade',
    severity: 'high',
    ruleCode: 'IMP-LIC-001',
    title: "Licence d'importation expirée",
    detectedAt: '2024-03-18T10:30:00Z',
    status: 'open',
    assignedTo: 'compliance@algeriatrade.dz',
  },
  {
    id: 'v2',
    entityId: 'e002',
    entityName: 'SARL Technologie Plus',
    module: 'commercial',
    severity: 'critical',
    ruleCode: 'RC-REG-001',
    title: 'RCC expiré depuis plus de 6 mois',
    detectedAt: '2024-03-17T14:15:00Z',
    status: 'in_progress',
    assignedTo: 'legal@algeriatrade.dz',
  },
  {
    id: 'v3',
    entityId: 'e003',
    entityName: 'Ets Import-Export Algérie',
    module: 'tax',
    severity: 'medium',
    ruleCode: 'FAC-TVA-001',
    title: 'Non-conformité facturation TVA détectée',
    detectedAt: '2024-03-16T09:45:00Z',
    status: 'open',
  },
  {
    id: 'v4',
    entityId: 'e004',
    entityName: 'EURL Commerce Moderne',
    module: 'privacy',
    severity: 'medium',
    ruleCode: 'CONSENT-EXP-001',
    title: 'Déclaration APN non déposée',
    detectedAt: '2024-03-15T16:20:00Z',
    status: 'resolved',
  },
  {
    id: 'v5',
    entityId: 'e005',
    entityName: 'Groupement Commercial Nord',
    module: 'commercial',
    severity: 'low',
    ruleCode: 'COMPT-AUDIT-001',
    title: 'Audit comptable en retard',
    detectedAt: '2024-03-14T11:00:00Z',
    status: 'open',
  },
];

const MOCK_SCREENING_CASES: ScreeningCase[] = [
  {
    id: 'sc1',
    referenceId: 'SCR-LK9X2P-M3KN',
    entityName: 'Ahmed Ben Hassan',
    entityType: 'individual',
    riskLevel: 'critical',
    decision: 'BLOCKED',
    createdAt: '2024-03-18T14:30:00Z',
    status: 'under_review',
  },
  {
    id: 'sc2',
    referenceId: 'SCR-M7K2XP-9JLN',
    entityName: 'Global Trading Corp Ltd',
    entityType: 'organization',
    riskLevel: 'high',
    decision: 'PENDING_REVIEW',
    createdAt: '2024-03-18T13:15:00Z',
    status: 'pending_info',
  },
  {
    id: 'sc3',
    referenceId: 'SCR-P3MN8X-KL2J',
    entityName: 'Mohammed K.',
    entityType: 'individual',
    riskLevel: 'low',
    decision: 'FALSE_POSITIVE',
    createdAt: '2024-03-17T16:45:00Z',
    status: 'resolved_cleared',
  },
];

const MOCK_REGULATORY_UPDATES: RegulatoryUpdate[] = [
  {
    id: 'ru1',
    title: 'Mise à jour barème IRG 2024 - Nouveaux seuils',
    effectiveDate: '2024-04-01',
    impact: 'high',
    category: 'fiscal',
    description: "Modification des tranches d'imposition IRG et augmentation du abattement fiscal pour les revenus moyens.",
    read: false,
  },
  {
    id: 'ru2',
    title: 'Nouveaux contrôles douaniers imports électroniques',
    effectiveDate: '2024-03-25',
    impact: 'high',
    category: 'commerce_exterieur',
    description: 'Obligation de déclaration préalable via le système Algernet pour toutes les importations > 1000 EUR.',
    read: false,
  },
  {
    id: 'ru3',
    title: 'Renforcement protection données personnelles',
    effectiveDate: '2024-04-15',
    impact: 'medium',
    category: 'protection_donnees',
    description: 'Nouvelles exigences pour les transferts de données vers les pays tiers non-adéquats.',
    read: true,
  },
  {
    id: 'ru4',
    title: 'Mise à jour liste produits prohibés import',
    effectiveDate: '2024-05-01',
    impact: 'medium',
    category: 'commerce_exterieur',
    description: 'Ajout de nouvelles catégories de produits soumis à restrictions d\'importation.',
    read: true,
  },
];

const MODULE_CONFIG = [
  { id: 'commercial', nameFr: 'Droit Commercial', nameAr: 'القانون التجاري', icon: <Scale className="h-5 w-5" />, color: 'bg-blue-500', activeRules: 9 },
  { id: 'tax', nameFr: 'Fiscalité TVA/IRG', nameAr: 'الضرائب', icon: <FileText className="h-5 w-5" />, color: 'bg-emerald-500', activeRules: 7 },
  { id: 'trade', nameFr: 'Commerce Extérieur', nameAr: 'التجارة الخارجية', icon: <Globe className="h-5 w-5" />, color: 'bg-orange-500', activeRules: 6 },
  { id: 'privacy', nameFr: 'Protection Données', nameAr: 'حماية البيانات', icon: <Lock className="h-5 w-5" />, color: 'bg-purple-500', activeRules: 7 },
  { id: 'sanctions', nameFr: 'Sanctions & Listes', nameAr: 'العقوبات والقوائم', icon: <UserX className="h-5 w-5" />, color: 'bg-red-500', activeRules: 5 },
];

export default function AdminCompliancePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [selectedViolation, setSelectedViolation] = useState<ViolationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter violations
  const filteredViolations = MOCK_VIOLATIONS.filter(v => {
    if (severityFilter !== 'all' && v.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (searchQuery && !v.entityName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !v.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const isRTL = language === 'ar';

  return (
    <div className={isRTL ? 'rtl' : 'ltr'} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            {language === 'fr' ? 'Tableau de Bord Conformité' : 'لوحة تحكم المطابقة'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'fr'
              ? 'Gestion de la conformité réglementaire AlgeriaTrade.dz'
              : 'إدارة المطابقة التنظيمية لمنصة الجزائر للتجارة'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'fr' ? 'ar' : 'fr')}
          >
            <Languages className="h-4 w-4 mr-1" />
            {language === 'fr' ? 'عربي' : 'Français'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            {language === 'fr' ? 'Exporter Rapport' : 'تصدير التقرير'}
          </Button>
          <Button size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            {language === 'fr' ? 'Actualiser' : 'تحديث'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            {language === 'fr' ? 'Dashboard' : 'لوحة التحكم'}
          </TabsTrigger>
          <TabsTrigger value="violations" className="gap-2 relative">
            <AlertTriangle className="h-4 w-4" />
            {language === 'fr' ? 'Violations' : 'المخالفات'}
            {MOCK_VIOLATIONS.filter(v => v.status === 'open').length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                {MOCK_VIOLATIONS.filter(v => v.status === 'open').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="screening" className="gap-2">
            <UserX className="h-4 w-4" />
            {language === 'fr' ? 'Screening' : 'الفحص'}
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Settings className="h-4 w-4" />
            {language === 'fr' ? 'Règles' : 'القواعد'}
          </TabsTrigger>
          <TabsTrigger value="updates" className="gap-2 relative">
            <Bell className="h-4 w-4" />
            {language === 'fr' ? 'Mises à Jour' : 'التحديثات'}
            {MOCK_REGULATORY_UPDATES.filter(u => !u.read).length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                {MOCK_REGULATORY_UPDATES.filter(u => !u.read).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOCK_METRICS.map((metric, idx) => (
              <Card key={idx}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="text-3xl font-bold mt-1">{metric.value.toLocaleString()}</p>
                      <div className={`flex items-center mt-2 text-sm ${metric.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {metric.change >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 mr-1" />
                        )}
                        {Math.abs(metric.change)}%
                      </div>
                    </div>
                    <div className={`p-3 rounded-full ${metric.color} bg-opacity-10`}>
                      {metric.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Module Overview + Recent Activity */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Module Scores */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  {language === 'fr' ? 'Scores par Module' : 'النتائج حسب الوحدة'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {MODULE_CONFIG.map(module => (
                    <div key={module.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-lg ${module.color} text-white`}>
                        {module.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">
                            {language === 'fr' ? module.nameFr : module.nameAr}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {module.activeRules} règles
                          </span>
                        </div>
                        <Progress
                          value={[85, 90, 71, 76, 99][MODULE_CONFIG.indexOf(module)]}
                          className="h-2"
                        />
                      </div>
                      <span className="font-bold text-lg min-w-[50px] text-right">
                        {[85, 90, 71, 76, 99][MODULE_CONFIG.indexOf(module)]}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions & Alerts */}
            <div className="space-y-6">
              {/* Critical Alerts */}
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-red-800 flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    {language === 'fr' ? 'Alertes Critiques' : 'التنبيهات الحرجة'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {MOCK_VIOLATIONS.filter(v => v.severity === 'critical').map(v => (
                    <div key={v.id} className="p-2 rounded bg-white/70 border border-red-200">
                      <p className="font-medium text-sm truncate">{v.title}</p>
                      <p className="text-xs text-red-700">{v.entityName}</p>
                    </div>
                  ))}
                  {MOCK_VIOLATIONS.filter(v => v.severity === 'critical').length === 0 && (
                    <p className="text-sm text-green-700 text-center py-2">
                      ✓ {language === 'fr' ? 'Aucune alerte critique' : 'لا توجد تنبيهات حرجة'}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Today's Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {language === 'fr' ? "Résumé du Jour" : 'ملخص اليوم'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Screenings</span>
                    <Badge variant="secondary">342</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Violations Nouvelles</span>
                    <Badge variant="destructive">12</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cas Résolus</span>
                    <Badge className="bg-emerald-600">28</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Documents Expirant</span>
                    <Badge variant="outline">5</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Regulatory Updates Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    {language === 'fr' ? 'Mises à Jour Réglementaires' : 'التحديثات التنظيمية'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {MOCK_REGULATORY_UPDATES.slice(0, 2).map(update => (
                    <div key={update.id} className="p-2 rounded border hover:bg-muted/50 cursor-pointer">
                      <div className="flex items-start gap-2">
                        {!update.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                        <div>
                          <p className="font-medium text-sm line-clamp-2">{update.title}</p>
                          <p className="text-xs text-muted-foreground">
                            📅 {new Date(update.effectiveDate).toLocaleDateString(isRTL ? 'ar-DZ' : 'fr-DZ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === 'fr' ? 'Rechercher entité ou violation...' : 'البحث عن كيان أو مخالفة...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={language === 'fr' ? 'Sévérité' : 'الخطورة'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'fr' ? 'Toutes' : 'الكل'}</SelectItem>
                    <SelectItem value="critical">{language === 'fr' ? 'Critique' : 'حرج'}</SelectItem>
                    <SelectItem value="high">{language === 'fr' ? 'Élevée' : 'عالية'}</SelectItem>
                    <SelectItem value="medium">{language === 'fr' ? 'Moyenne' : 'متوسطة'}</SelectItem>
                    <SelectItem value="low">{language === 'fr' ? 'Faible' : 'منخفضة'}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={language === 'fr' ? 'Statut' : 'الحالة'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'fr' ? 'Tous' : 'الكل'}</SelectItem>
                    <SelectItem value="open">{language === 'fr' ? 'Ouvert' : 'مفتوح'}</SelectItem>
                    <SelectItem value="in_progress">{language === 'fr' ? 'En cours' : 'قيد التنفيذ'}</SelectItem>
                    <SelectItem value="resolved">{language === 'fr' ? 'Résolu' : 'تم الحل'}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Violations List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {language === 'fr' ? `File des Violations (${filteredViolations.length})` : `قائمة المخالفات (${filteredViolations.length})`}
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Exporter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-2">
                  {filteredViolations.map(violation => {
                    const severityColors = {
                      critical: 'border-l-red-500 bg-red-50',
                      high: 'border-l-orange-500 bg-orange-50',
                      medium: 'border-l-amber-500 bg-amber-50',
                      low: 'border-l-blue-500 bg-blue-50',
                    };
                    const statusBadges = {
                      open: { label: language === 'fr' ? 'Ouvert' : 'مفتوح', variant: 'destructive' as const },
                      in_progress: { label: language === 'fr' ? 'En cours' : 'قيد التنفيذ', variant: 'default' as const },
                      resolved: { label: language === 'fr' ? 'Résolu' : 'تم الحل', variant: 'secondary' as const },
                      dismissed: { label: language === 'fr' ? 'Rejeté' : 'مرفوض', variant: 'outline' as const },
                    };

                    return (
                      <div
                        key={violation.id}
                        className={`p-4 rounded-lg border-l-4 ${severityColors[violation.severity]} hover:shadow-md transition-shadow cursor-pointer`}
                        onClick={() => setSelectedViolation(violation)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-medium">{violation.title}</span>
                              <Badge variant={statusBadges[violation.status].variant} className="text-xs">
                                {statusBadges[violation.status].label}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {violation.ruleCode}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {violation.entityName} • {violation.module.toUpperCase()}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Détecté: {new Date(violation.detectedAt).toLocaleString(isRTL ? 'ar-DZ' : 'fr-DZ')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {violation.assignedTo && (
                              <span className="text-xs text-muted-foreground max-w-[120px] truncate">
                                → {violation.assignedTo.split('@')[0]}
                              </span>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredViolations.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
                      <p className="text-lg font-medium">
                        {language === 'fr' ? 'Aucune violation trouvée' : 'لم يتم العثور على مخالفات'}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Screening Tab */}
        <TabsContent value="screening" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Screening Cases */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {language === 'fr' ? 'Cas Récents' : 'الحالات الأخيرة'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-3">
                    {MOCK_SCREENING_CASES.map(case_ => {
                      const riskColors: Record<string, string> = {
                        critical: 'text-red-600 bg-red-100',
                        high: 'text-orange-600 bg-orange-100',
                        medium: 'text-amber-600 bg-amber-100',
                        low: 'text-blue-600 bg-blue-100',
                        none: 'text-emerald-600 bg-emerald-100',
                      };
                      const decisionConfig: Record<string, { label: string; color: string }> = {
                        BLOCKED: { label: 'Bloqué', color: 'bg-red-100 text-red-700' },
                        PENDING_REVIEW: { label: 'En attente', color: 'bg-amber-100 text-amber-700' },
                        FALSE_POSITIVE: { label: 'Faux positif', color: 'bg-blue-100 text-blue-700' },
                        CLEAR: { label: 'Approuvé', color: 'bg-emerald-100 text-emerald-700' },
                      };

                      return (
                        <div key={case_.id} className="p-3 rounded-lg border hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{case_.entityName}</span>
                            <Badge className={decisionConfig[case_.decision]?.color || ''}>
                              {decisionConfig[case_.decision]?.label || case_.decision}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className={riskColors[case_.riskLevel]}>
                              Risque: {case_.riskLevel}
                            </Badge>
                            <span>Ref: {case_.referenceId}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(case_.createdAt).toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Screening Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {language === 'fr' ? 'Statistiques Screening' : 'إحصائيات الفحص'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-emerald-50">
                      <p className="text-2xl font-bold text-emerald-600">94.6%</p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'fr' ? 'Taux d\'approbation' : 'نسبة الموافقة'}
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-50">
                      <p className="text-2xl font-bold text-red-600">0.43%</p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'fr' ? 'Taux de blocage' : 'نسبة الحظر'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{language === 'fr' ? 'Approuvés (CLEAR)' : 'موافق عليها'}</span>
                      <span className="font-medium">11,894</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{language === 'fr' ? 'Faux positifs' : 'إيجابيات كاذبة'}</span>
                      <span className="font-medium">318</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{language === 'fr' ? 'En attente de revue' : 'قيد المراجعة'}</span>
                      <span className="font-medium">278</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{language === 'fr' ? 'Bloqués' : 'محظورة'}</span>
                      <span className="font-medium text-red-600">54</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {language === 'fr' ? 'Actions Rapides' : 'إجراءات سريعة'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <UserX className="h-4 w-4 mr-2" />
                    {language === 'fr' ? 'Nouveau Screening' : 'فحص جديد'}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    {language === 'fr' ? 'Exporter l\'historique' : 'تصدير السجل'}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    {language === 'fr' ? 'Configurer les listes' : 'إعداد القوائم'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Rules Configuration Tab */}
        <TabsContent value="rules" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {MODULE_CONFIG.map(module => (
              <Card key={module.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className={`inline-flex p-3 rounded-xl ${module.color} text-white mb-3`}>
                    {module.icon}
                  </div>
                  <h3 className="font-semibold text-sm">
                    {language === 'fr' ? module.nameFr : module.nameAr}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {module.activeRules} {language === 'fr' ? 'règles actives' : 'قواعد نشطة'}
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    {language === 'fr' ? 'Configurer' : 'إعداد'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Rules Detail Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {language === 'fr' ? 'Règles Actives' : 'القواعد النشطة'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[400px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">{language === 'fr' ? 'Code' : 'الرمز'}</th>
                      <th className="text-left p-2">{language === 'fr' ? 'Règle' : 'القاعدة'}</th>
                      <th className="text-left p-2">{language === 'fr' ? 'Module' : 'الوحدة'}</th>
                      <th className="text-left p-2">{language === 'fr' ? 'Sévérité' : 'الخطورة'}</th>
                      <th className="text-left p-2">{language === 'fr' ? 'Statut' : 'الحالة'}</th>
                      <th className="text-right p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { code: 'RC-REG-001', name: 'Inscription RCC', module: 'Commercial', severity: 'Critical', active: true },
                      { code: 'NIF-REQ-001', name: 'Exigence NIF', module: 'Tax', severity: 'Critical', active: true },
                      { code: 'IMP-LIC-001', name: 'Licence Import', module: 'Trade', severity: 'High', active: true },
                      { code: 'CONSENT-EXP-001', name: 'Consentement Exprès', module: 'Privacy', severity: 'High', active: true },
                      { code: 'TVA-DEC-001', name: 'Déclaration TVA Mensuelle', module: 'Tax', severity: 'Medium', active: true },
                    ].map((rule, i) => (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono text-xs">{rule.code}</td>
                        <td className="p-2">{rule.name}</td>
                        <td className="p-2"><Badge variant="outline">{rule.module}</Badge></td>
                        <td className="p-2">
                          <Badge variant={rule.severity === 'Critical' ? 'destructive' : 'secondary'}>
                            {rule.severity}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" />
                        </td>
                        <td className="p-2 text-right">
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regulatory Updates Tab */}
        <TabsContent value="updates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {language === 'fr'
                    ? `Notifications Réglementaires (${MOCK_REGULATORY_UPDATES.filter(u => !u.read).length} non lues)`
                    : `إشعارات تنظيمية (${MOCK_REGULATORY_UPDATES.filter(u => !u.read).length} غير مقروءة)`}
                </CardTitle>
                <Button variant="outline" size="sm">
                  {language === 'fr' ? 'Tout marquer lu' : 'تحديد الكل كمقروء'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-4">
                  {MOCK_REGULATORY_UPDATES.map(update => (
                    <div
                      key={update.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        !update.read ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {!update.read && (
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className={`font-medium ${!update.read ? '' : 'text-muted-foreground'}`}>
                              {update.title}
                            </h3>
                            <Badge
                              variant={
                                update.impact === 'high'
                                  ? 'destructive'
                                  : update.impact === 'medium'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className="text-xs"
                            >
                              {update.impact === 'high'
                                ? language === 'fr'
                                  ? 'Impact élevé'
                                  : 'تأثير عالي'
                                : update.impact === 'medium'
                                ? language === 'fr'
                                  ? 'Impact moyen'
                                  : 'تأثير متوسط'
                                : language === 'fr'
                                ? 'Impact faible'
                                : 'تأثير منخفض'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {update.category.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {update.description}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {language === 'fr' ? 'Effective le' : 'ساري المفعول في'}{' '}
                              {new Date(update.effectiveDate).toLocaleDateString(isRTL ? 'ar-DZ' : 'fr-DZ')}
                            </span>
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                              {language === 'fr' ? 'Voir les détails' : 'عرض التفاصيل'}
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Violation Detail Dialog */}
      <Dialog open={!!selectedViolation} onOpenChange={() => setSelectedViolation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedViolation?.title || 'Détails de la Violation'}
            </DialogTitle>
            <DialogDescription>
              {selectedViolation?.ruleCode} • {selectedViolation?.entityId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedViolation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{language === 'fr' ? 'Entité' : 'الكيان'}</p>
                  <p className="font-medium">{selectedViolation.entityName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === 'fr' ? 'Module' : 'الوحدة'}</p>
                  <p className="font-medium capitalize">{selectedViolation.module}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === 'fr' ? 'Sévérité' : 'الخطورة'}</p>
                  <Badge variant={selectedViolation.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {selectedViolation.severity}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === 'fr' ? 'Statut' : 'الحالة'}</p>
                  <Badge variant="outline">{selectedViolation.status}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === 'fr' ? 'Détecté le' : 'اكتشف في'}</p>
                  <p className="font-medium">
                    {new Date(selectedViolation.detectedAt).toLocaleString(isRTL ? 'ar-DZ' : 'fr-DZ')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{language === 'fr' ? 'Assigné à' : 'مسند إلى'}</p>
                  <p className="font-medium">{selectedViolation.assignedTo || '-'}</p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">
                  {language === 'fr' ? 'Référence Légale' : 'المرجع القانوني'}
                </h4>
                <p className="text-sm">
                  {selectedViolation.ruleCode === 'IMP-LIC-001' && 'Loi 03-01 du 17 février 2003 - Art. 5'}
                  {selectedViolation.ruleCode === 'RC-REG-001' && 'Code de Commerce - Art. 60 bis (Ordonnance 75-59)'}
                  {selectedViolation.ruleCode === 'FAC-TVA-001' && 'Article 14 du Code TVA et Arrêté interministériel'}
                  {!['IMP-LIC-001', 'RC-REG-001', 'FAC-TVA-001'].includes(selectedViolation.ruleCode) &&
                    'Référence légale spécifique au type de violation'}
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => setSelectedViolation(null)}>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  {language === 'fr' ? 'Marquer Résolu' : 'تحديد كمحلول'}
                </Button>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-1" />
                  {language === 'fr' ? 'Voir Entité' : 'عرض الكيان'}
                </Button>
                <Button variant="outline" className="ml-auto">
                  <Ban className="h-4 w-4 mr-1" />
                  {language === 'fr' ? 'Escalader' : 'تصعيد'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserX(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <line x1="17" y1="11" x2="22" y2="11"></line>
    </svg>
  );
}
