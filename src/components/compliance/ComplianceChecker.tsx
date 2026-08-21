'use client';

/**
 * ComplianceChecker Component - AlgeriaTrade.dz
 * 
 * Real-time compliance status indicator with:
 * - Overall compliance score visualization
 * - Module-by-module breakdown (Commercial, Tax, Trade, Privacy, Sanctions)
 * - Rule violation alerts with explanations (French/Arabic)
 * - Required documents checklist
 * - Recommended actions prioritized
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Scale,
  Globe,
  Lock,
  UserX,
  ChevronRight,
  RefreshCw,
  Download,
  ExternalLink,
  Info,
} from 'lucide-react';

// Types
interface ComplianceStatusProps {
  entityId?: string;
  entityName?: string;
  compact?: boolean;
}

interface ComplianceData {
  overallScore: number;
  overallStatus: 'fully_compliant' | 'minor_issues' | 'needs_attention' | 'non_compliant' | 'critical_violation';
  modules: ModuleScore[];
  violations: Violation[];
  documents: DocumentItem[];
  lastUpdated: string;
}

interface ModuleScore {
  id: string;
  nameFr: string;
  nameAr: string;
  icon: React.ReactNode;
  score: number;
  status: 'pass' | 'warning' | 'fail' | 'critical';
  issuesCount: number;
}

interface Violation {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  module: string;
  titleFr: string;
  titleAr: string;
  descriptionFr: string;
  descriptionAr: string;
  remediationFr: string;
  remediationAr: string;
  legalReference: string;
}

interface DocumentItem {
  id: string;
  nameFr: string;
  nameAr: string;
  status: 'valid' | 'expired' | 'missing' | 'pending_verification';
  expiryDate?: string;
}

// Mock data for demonstration
const MOCK_COMPLIANCE_DATA: ComplianceData = {
  overallScore: 72,
  overallStatus: 'needs_attention',
  modules: [
    {
      id: 'commercial',
      nameFr: 'Droit Commercial',
      nameAr: 'القانون التجاري',
      icon: <Scale className="h-5 w-5" />,
      score: 85,
      status: 'warning',
      issuesCount: 1,
    },
    {
      id: 'tax',
      nameFr: 'Fiscalité (TVA/IRG)',
      nameAr: 'الضرائب',
      icon: <FileText className="h-5 w-5" />,
      score: 90,
      status: 'pass',
      issuesCount: 0,
    },
    {
      id: 'trade',
      nameFr: 'Commerce Extérieur',
      nameAr: 'التجارة الخارجية',
      icon: <Globe className="h-5 w-5" />,
      score: 60,
      status: 'fail',
      issuesCount: 2,
    },
    {
      id: 'privacy',
      nameFr: 'Protection des Données',
      nameAr: 'حماية البيانات',
      icon: <Lock className="h-5 w-5" />,
      score: 75,
      status: 'warning',
      issuesCount: 1,
    },
    {
      id: 'sanctions',
      nameFr: 'Sanctions & Listes',
      nameAr: 'العقوبات والقوائم',
      icon: <UserX className="h-5 w-5" />,
      score: 100,
      status: 'pass',
      issuesCount: 0,
    },
  ],
  violations: [
    {
      id: 'v1',
      severity: 'high',
      module: 'trade',
      titleFr: "Licence d'Importation Expirée",
      titleAr: 'انتهاء صلاحية ترخيص الاستيراد',
      descriptionFr: "Votre licence d'importation Algemex a expiré le 15 mars 2024.",
      descriptionAr: 'انتهت صلاحية ترخيص الاستيراد من الجيمكس في 15 مارس 2024.',
      remediationFr: "Renouveler immédiatement auprès du CNAC avec les documents à jour.",
      remediationAr: 'تجديد فوراً لدى اللجنة الوطنية مع المستندات المحدثة.',
      legalReference: 'Loi 03-01 du 17 février 2003 - Art. 5',
    },
    {
      id: 'v2',
      severity: 'medium',
      module: 'trade',
      titleFr: 'Certificat de Conformité QAI Requis',
      titleAr: 'شهادة المطابقة مطلوبة',
      descriptionFr: "Les produits importés nécessitent un certificat QAI valide.",
      descriptionAr: 'المنتجات المستوردة تتطلب شهادة مطابقة سارية.',
      remediationFr: "Contacter un organisme agréé pour obtenir le certificat avant importation.",
      remediationAr: 'التواصل مع جهة معتمدة للحصول على الشهادة قبل الاستيراد.',
      legalReference: 'Décret exécutif 05-135 du 15 mai 2005',
    },
    {
      id: 'v3',
      severity: 'medium',
      module: 'privacy',
      titleFr: 'Déclaration APN en Attente',
      titleAr: 'إعلان الهيئة الوطنية قيد الانتظار',
      descriptionFr: "La déclaration de traitement des données n'a pas été validée par l'APN.",
      descriptionAr: 'لم يتم التحقق من إعلان معالجة البيانات من قبل الهيئة الوطنية.',
      remediationFr: "Suivre le statut de votre déclaration sur www.apn.dz",
      remediationAr: 'متابعة حالة إعلانك على موقع apn.dz',
      legalReference: 'Loi 18-07 du 10 juin 2018 - Art. 15-16',
    },
    {
      id: 'v4',
      severity: 'low',
      module: 'commercial',
      titleFr: 'RCC - Renouvellement dans 3 mois',
      titleAr: 'تجديد السجل التجاري خلال 3 أشهر',
      descriptionFr: "Votre inscription au RCC arrive à échéance le 15 juin 2024.",
      descriptionAr: 'تسجيلك في السجل التجاري ينتهي في 15 يونيو 2024.',
      remediationFr: "Préparer les documents pour renouvellement anticipé.",
      remediationAr: 'تحضير المستندات للتجديد المبكر.',
      legalReference: 'Code de Commerce - Art. 60 bis',
    },
  ],
  documents: [
    { id: 'd1', nameFr: 'Registre du Commerce (RCC)', nameAr: 'السجل التجاري', status: 'valid', expiryDate: '2024-06-15' },
    { id: 'd2', nameFr: 'Numéro d\'Identification Fiscale (NIF)', nameAr: 'الرقم التعريفي الضريبي', status: 'valid' },
    { id: 'd3', nameFr: 'Identifiant Statistique (AIS)', nameAr: 'المعرف الإحصائي', status: 'valid' },
    { id: 'd4', nameFr: 'Licence d\'Importation', nameAr: 'ترخيص الاستيراد', status: 'expired', expiryDate: '2024-03-15' },
    { id: 'd5', nameFr: 'Certificat de Conformité QAI', nameAr: 'شهادة المطابقة', status: 'missing' },
    { id: 'd6', nameFr: 'Statuts de la Société', nameAr: 'النظام الأساسي', status: 'pending_verification' },
  ],
  lastUpdated: new Date().toISOString(),
};

// Status color mappings
const STATUS_COLORS = {
  fully_compliant: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'default' },
  minor_issues: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'secondary' },
  needs_attention: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'outline' },
  non_compliant: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'destructive' },
  critical_violation: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'destructive' },
};

const SEVERITY_CONFIG = {
  critical: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Critique', labelAr: 'حرج' },
  high: { icon: AlertTriangle, color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Élevé', labelAr: 'عالي' },
  medium: { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-100', label: 'Moyen', labelAr: 'متوسط' },
  low: { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Faible', labelAr: 'منخفض' },
};

const DOC_STATUS_CONFIG = {
  valid: { icon: CheckCircle2, color: 'text-emerald-600', label: 'Valide', labelAr: 'ساري' },
  expired: { icon: XCircle, color: 'text-red-600', label: 'Expiré', labelAr: 'منتهي' },
  missing: { icon: AlertTriangle, color: 'text-orange-600', label: 'Manquant', labelAr: 'مفقود' },
  pending_verification: { icon: Clock, color: 'text-amber-600', label: 'En attente', labelAr: 'قيد الانتظار' },
};

export default function ComplianceChecker({ entityId, entityName = 'Entité', compact = false }: ComplianceStatusProps) {
  const [data, setData] = useState<ComplianceData>(MOCK_COMPLIANCE_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');

  const fetchComplianceData = useCallback(async () => {
    setIsLoading(true);
    try {
      // In production, this would call the API
      // const response = await fetch(`/api/compliance/check?entityId=${entityId}`);
      // const result = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setData(MOCK_COMPLIANCE_DATA);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [entityId]);

  useEffect(() => {
    fetchComplianceData();
  }, [fetchComplianceData]);

  const statusConfig = STATUS_COLORS[data.overallStatus];
  const isRTL = language === 'ar';

  if (compact) {
    return (
      <Card className={`${statusConfig.bg} ${statusConfig.border}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className={`h-8 w-8 ${statusConfig.text}`} />
              <div>
                <p className={`text-sm font-medium ${statusConfig.text}`}>
                  {language === 'fr' ? 'Conformité' : 'المطابقة'}
                </p>
                <p className="text-2xl font-bold">{data.overallScore}%</p>
              </div>
            </div>
            <Badge variant={statusConfig.badge as any}>
              {data.violations.length} {language === 'fr' ? 'alertes' : 'تنبيهات'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={isRTL ? 'rtl' : 'ltr'} dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="overflow-hidden">
        {/* Header */}
        <CardHeader className={`${statusConfig.bg} border-b`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className={`h-10 w-10 ${statusConfig.text}`} />
              <div>
                <CardTitle className={`text-xl ${statusConfig.text}`}>
                  {language === 'fr' ? 'Tableau de Bord Conformité' : 'لوحة تحكم المطابقة'}
                </CardTitle>
                <CardDescription>
                  {entityName} • {language === 'fr' ? 'Mis à jour le' : 'تحديث في'}{' '}
                  {new Date(data.lastUpdated).toLocaleDateString(isRTL ? 'ar-DZ' : 'fr-DZ')}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'fr' ? 'ar' : 'fr')}
              >
                {language === 'fr' ? 'عربي' : 'Français'}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchComplianceData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {language === 'fr' ? 'Actualiser' : 'تحديث'}
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                {language === 'fr' ? 'Rapport PDF' : 'تقرير PDF'}
              </Button>
            </div>
          </div>

          {/* Score Display */}
          <div className="mt-6 flex items-center gap-8">
            <div className="relative">
              <svg className="h-32 w-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  className={statusConfig.text}
                  strokeDasharray={`${(data.overallScore / 100) * 352} 352`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${statusConfig.text}`}>{data.overallScore}</span>
                <span className={`text-xs ${statusConfig.text}/70`}>/ 100</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-4">
              {data.modules.map((module) => (
                <ModuleScoreCard key={module.id} module={module} language={language} />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
              <TabsTrigger value="overview" className="gap-2">
                <Info className="h-4 w-4" />
                {language === 'fr' ? 'Aperçu' : 'نظرة عامة'}
              </TabsTrigger>
              <TabsTrigger value="violations" className="gap-2 relative">
                <AlertTriangle className="h-4 w-4" />
                {language === 'fr' ? 'Violations' : 'المخالفات'}
                {data.violations.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                    {data.violations.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-2">
                <FileText className="h-4 w-4" />
                {language === 'fr' ? 'Documents' : 'المستندات'}
              </TabsTrigger>
              <TabsTrigger value="actions" className="gap-2">
                <ChevronRight className="h-4 w-4" />
                {language === 'fr' ? 'Actions' : 'الإجراءات'}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {language === 'fr' ? 'Statut Global' : 'الحالة العامة'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>{language === 'fr' ? 'Règles vérifiées' : 'القواعد المحققة'}</span>
                        <span className="font-semibold">42</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-600">{language === 'fr' ? 'Règles conformes' : 'القواعد المتوافقة'}</span>
                        <span className="font-semibold text-emerald-600">36</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-red-600">{language === 'fr' ? 'Violations actives' : 'المخالفات النشطة'}</span>
                        <span className="font-semibold text-red-600">{data.violations.length}</span>
                      </div>
                      <Progress value={data.overallScore} className="mt-4 h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {language === 'fr' ? 'Prochaine Échéance' : 'الموعد القادم'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Licence Import • 15 Mar 2024</p>
                          <p className="text-xs text-muted-foreground">
                            {language === 'fr' ? 'EXPIRÉ - Renouvellement requis' : 'منتهي - تجديد مطلوب'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <Clock className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">RCC Renouvellement • 15 Juin 2024</p>
                          <p className="text-xs text-muted-foreground">
                            {language === 'fr' ? 'Dans 3 mois - Préparer documents' : 'خلال 3 أشهر - تحضير المستندات'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Legal References */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    {language === 'fr' ? 'Références Légales Applicables' : 'المراجع القانونية المطبقة'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <LegalRef
                      title="Code de Commerce"
                      refCode="Ordonnance 75-59"
                      joRef="J.O N° 78 du 30/09/1975"
                    />
                    <LegalRef
                      title="Code TVA"
                      refCode="Ordonnance 76-147"
                      joRef="J.O N° 87 du 24/11/1976"
                    />
                    <LegalRef
                      title="Loi 18-07 Protection Données"
                      refCode="J.O N° 44 du 13/06/2018"
                      joRef="APN - Autorité de Protection"
                    />
                    <LegalRef
                      title="Loi Commerce Extérieur"
                      refCode="Loi 03-01 du 17/02/2003"
                      joRef="Algemex / CNAC"
                    />
                    <LegalRef
                      title="CIDTA (Impôts)"
                      refCode="J.O N° 84 du 20/12/1991"
                      joRef="Direction des Impôts"
                    />
                    <LegalRef
                      title="Loi Concurrence"
                      refCode="Ordonnance 03-03"
                      joRef="Conseil de la Concurrence"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Violations Tab */}
            <TabsContent value="violations" className="p-6">
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-4">
                  {data.violations.map((violation) => {
                    const config = SEVERITY_CONFIG[violation.severity];
                    const Icon = config.icon;
                    
                    return (
                      <Alert key={violation.id} className={`${config.bgColor} border-l-4 border-l-current`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                        <AlertTitle className="flex items-center gap-2 mb-2">
                          <span className={config.color}>{violation.titleFr}</span>
                          <Badge variant="outline" className="text-xs">
                            {config.label} / {config.labelAr}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription className="space-y-2">
                          <p>{language === 'fr' ? violation.descriptionFr : violation.descriptionAr}</p>
                          
                          <div className={`p-3 rounded-md bg-white/50 mt-2`}>
                            <p className="font-medium text-sm mb-1">
                              💡 {language === 'fr' ? 'Action requise :' : 'الإجراء المطلوب:'}
                            </p>
                            <p className="text-sm">
                              {language === 'fr' ? violation.remediationFr : violation.remediationAr}
                            </p>
                          </div>
                          
                          <p className="text-xs text-muted-foreground pt-2 border-t border-gray-300/30">
                            📋 {violation.legalReference}
                          </p>
                        </AlertDescription>
                      </Alert>
                    );
                  })}
                  
                  {data.violations.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
                      <p className="text-lg font-medium">
                        {language === 'fr' ? 'Aucune violation détectée !' : 'لم يتم اكتشاف أي مخالفة!'}
                      </p>
                      <p className="text-sm">
                        {language === 'fr'
                          ? 'Votre entité est conforme aux réglementations algériennes.'
                          : 'كيانك متوافق مع اللوائح الجزائرية.'}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="p-6">
              <div className="grid md:grid-cols-2 gap-4">
                {data.documents.map((doc) => {
                  const config = DOC_STATUS_CONFIG[doc.status];
                  const Icon = config.icon;
                  
                  return (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Icon className={`h-6 w-6 ${config.color} shrink-0 mt-0.5`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {language === 'fr' ? doc.nameFr : doc.nameAr}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {config.label} / {config.labelAr}
                              </Badge>
                              {doc.expiryDate && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(doc.expiryDate).toLocaleDateString(isRTL ? 'ar-DZ' : 'fr-DZ')}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            {doc.status === 'missing' ? (
                              language === 'fr' ? 'Téléverser' : 'رفع'
                            ) : doc.status === 'expired' ? (
                              language === 'fr' ? 'Renouveler' : 'تجديد'
                            ) : (
                              language === 'fr' ? 'Voir' : 'عرض'
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">
                  <strong>ℹ️ {language === 'fr' ? 'Note :' : 'ملاحظة:'}</strong>{' '}
                  {language === 'fr'
                    ? 'Les documents sont stockés de manière sécurisée et chiffrée conformément à la Loi 18-07.'
                    : 'يتم تخزين المستندات بشكل آمن ومشفر وفقًا للقانون 18-07.'}
                </p>
              </div>
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  {language === 'fr' ? 'Actions Recommandées Priorisées' : 'الإجراءات الموصى بها حسب الأولوية'}
                </h3>
                
                {[
                  { priority: 'urgent' as const, action: language === 'fr' ? 'Renouveler la licence d\'importation expirée' : 'تجديد ترخيص الاستيراد المنتهي', deadline: 'Immédiat / فوري' },
                  { priority: 'high' as const, action: language === 'fr' ? 'Obtenir le certificat QAI pour les produits importés' : 'الحصول على شهادة المطابقة للمنتجات المستوردة', deadline: 'Avant prochaine importation / قبل الاستيراد القادم' },
                  { priority: 'high' as const, action: language === 'fr' ? 'Suivre la déclaration APN en cours' : 'متابعة إعلان الهيئة الوطنية الجاري', deadline: 'Sous 30 jours / خلال 30 يوم' },
                  { priority: 'medium' as const, action: language === 'fr' ? 'Préparer le renouvellement RCC (échéance juin)' : 'تحضير تجديد السجل التجاري (استحقاق يونيو)', deadline: 'Sous 60 jours / خلال 60 يوم' },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      item.priority === 'urgent'
                        ? 'bg-red-50 border-red-200'
                        : item.priority === 'high'
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold ${
                        item.priority === 'urgent'
                          ? 'bg-red-500'
                          : item.priority === 'high'
                          ? 'bg-orange-500'
                          : 'bg-amber-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{item.action}</p>
                      <p className="text-sm text-muted-foreground">
                        📅 {language === 'fr' ? 'Échéance' : 'الموعد النهائي'}: {item.deadline}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      {language === 'fr' ? 'Lancer' : 'بدء'}
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-components
function ModuleScoreCard({ module, language }: { module: ModuleScore; language: 'fr' | 'ar' }) {
  const colors = {
    pass: 'text-emerald-600 bg-emerald-50',
    warning: 'text-amber-600 bg-amber-50',
    fail: 'text-orange-600 bg-orange-50',
    critical: 'text-red-600 bg-red-50',
  };

  return (
    <div className={`p-3 rounded-lg ${colors[module.status]} text-center`}>
      <div className="flex justify-center mb-1">{module.icon}</div>
      <p className="text-xs font-medium truncate">{language === 'fr' ? module.nameFr : module.nameAr}</p>
      <p className="text-lg font-bold">{module.score}%</p>
      {module.issuesCount > 0 && (
        <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
          {module.issuesCount}
        </Badge>
      )}
    </div>
  );
}

function LegalRef({ title, refCode, joRef }: { title: string; refCode: string; joRef: string }) {
  return (
    <div className="p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer">
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{refCode}</p>
      <p className="text-xs text-primary">{joRef}</p>
    </div>
  );
}

export type { ComplianceData, Violation, DocumentItem };
