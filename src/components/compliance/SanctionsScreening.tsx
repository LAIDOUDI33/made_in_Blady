'use client';

/**
 * SanctionsScreening Component - AlgeriaTrade.dz
 * 
 * Features:
 * - Name matching against international sanctions lists (OFAC, EU, UN)
 * - Risk scoring algorithm with configurable thresholds
 * - Investigation workflow for potential matches
 * - Case management UI for screening results
 * - Export and audit trail functionality
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  UserX,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Ban,
  CheckSquare,
  ExternalLink,
  Filter,
  Download,
  RefreshCw,
  FileText,
  Activity,
  Globe,
  Building2,
  User,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Loader2,
  Languages,
} from 'lucide-react';
import { performScreening, DEFAULT_RISK_CONFIG, type ScreeningResult, type ScreeningCase, type RiskLevel, type ScreenedEntityInput } from '@/lib/compliance/rules/sanctions-rules';

// Types
interface ScreeningHistoryEntry {
  id: string;
  timestamp: string;
  entityName: string;
  entityType: 'individual' | 'organization';
  result: ScreeningResult;
  case?: ScreeningCase;
  reviewedBy?: string;
}

// Mock screening history
const MOCK_HISTORY: ScreeningHistoryEntry[] = [
  {
    id: 'hist-001',
    timestamp: '2024-01-15T14:30:00Z',
    entityName: 'Ahmed Ben Hassan',
    entityType: 'individual',
    result: {
      referenceId: 'SCR-LK9X2P-M3KN',
      screenedEntity: { fullName: 'Ahmed Ben Hassan', entityType: 'individual' },
      timestamp: '2024-01-15T14:30:00Z',
      matches: [{
        matchedEntity: {
          id: 'MOCK-001',
          names: [{ fullName: 'Ahmed Ben Hassan' }],
          sanctions: [{ type: 'asset_freeze', listName: 'Internal Watchlist', effectiveDate: '2024-01-01', basis: 'Test entry' }],
          source: 'INTERNAL_WATCH',
          lastUpdated: '2024-01-15',
        },
        matchDetails: [
          { field: 'fullName', screenedValue: 'Ahmed Ben Hassan', matchedValue: 'Ahmed Ben Hassan', similarity: 100, algorithm: 'exact' },
        ],
        confidenceScore: 100,
        riskScore: 90,
        riskLevel: 'critical',
        sources: ['INTERNAL_WATCH'],
      }],
      overallRiskScore: 90,
      riskLevel: 'critical',
      decision: 'BLOCKED',
      recommendations: ['DO NOT PROCEED', 'Escalate to Compliance Officer', 'Consider SAR filing'],
    },
    case: {
      id: 'case-001',
      screeningReferenceId: 'SCR-LK9X2P-M3KN',
      entity: { fullName: 'Ahmed Ben Hassan', entityType: 'individual' },
      result: {} as ScreeningResult,
      status: 'under_review',
      assignedTo: 'compliance@algeriatrade.dz',
      createdAt: '2024-01-15T14:30:00Z',
      updatedAt: '2024-01-15T15:45:00Z',
      reviewerNotes: [{
        author: 'System',
        timestamp: '2024-01-15T14:30:00Z',
        content: 'Auto-generated case due to high-risk match',
      }],
    },
    reviewedBy: 'Auto-Screening',
  },
  {
    id: 'hist-002',
    timestamp: '2024-01-15T13:15:00Z',
    entityName: 'SARL Technologie Plus',
    entityType: 'organization',
    result: {
      referenceId: 'SCR-M7K2XP-9JLN',
      screenedEntity: { fullName: 'SARL Technologie Plus', entityType: 'organization' },
      timestamp: '2024-01-15T13:15:00Z',
      matches: [],
      overallRiskScore: 0,
      riskLevel: 'none',
      decision: 'CLEAR',
      recommendations: ['Standard processing may proceed'],
    },
    reviewedBy: 'Auto-Screening',
  },
  {
    id: 'hist-003',
    timestamp: '2024-01-14T16:45:00Z',
    entityName: 'Mohammed K.',
    entityType: 'individual',
    result: {
      referenceId: 'SCR-P3MN8X-KL2J',
      screenedEntity: { fullName: 'Mohammed K.', entityType: 'individual' },
      timestamp: '2024-01-14T16:45:00Z',
      matches: [{
        matchedEntity: {
          id: 'MOCK-003',
          names: [{ fullName: 'Mohammed El Amine Khelifi' }],
          sanctions: [{ type: 'asset_freeze', listName: 'Internal Watchlist', effectiveDate: '2024-03-01', basis: 'Suspicious activity' }],
          source: 'INTERNAL_WATCH',
          lastUpdated: '2024-03-10',
        },
        matchDetails: [
          { field: 'fullName', screenedValue: 'Mohammed K.', matchedValue: 'Mohammed El Amine Khelifi', similarity: 55, algorithm: 'fuzzy' },
        ],
        confidenceScore: 55,
        riskScore: 41,
        riskLevel: 'low',
        sources: ['INTERNAL_WATCH'],
        falsePositiveIndicators: ['Common name component', 'Single partial match only'],
      }],
      overallRiskScore: 41,
      riskLevel: 'low',
      decision: 'FALSE_POSITIVE',
      recommendations: ['Document reasons for false positive', 'Add to approved entities list'],
    },
    reviewedBy: 'Manual Review - Compliance Team',
  },
];

// Risk level configurations
const RISK_LEVEL_CONFIG: Record<RiskLevel, { color: string; bgColor: string; icon: typeof Shield; label: string; labelAr: string }> = {
  critical: { color: 'text-red-700', bgColor: 'bg-red-100 border-red-300', icon: XCircle, label: 'Critique', labelAr: 'حرج' },
  high: { color: 'text-orange-700', bgColor: 'bg-orange-100 border-orange-300', icon: AlertTriangle, label: 'Élevé', labelAr: 'عالي' },
  medium: { color: 'text-amber-700', bgColor: 'bg-amber-100 border-amber-300', icon: Clock, label: 'Moyen', labelAr: 'متوسط' },
  low: { color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-300', icon: Shield, label: 'Faible', labelAr: 'منخفض' },
  none: { color: 'text-emerald-700', bgColor: 'bg-emerald-100 border-emerald-300', icon: CheckCircle2, label: 'Aucun', labelAr: 'لا يوجد' },
};

const DECISION_CONFIG: Record<string, { color: string; bgColor: string; icon: typeof Shield; label: string }> = {
  CLEAR: { color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: CheckCircle2, label: 'Approuvé' },
  FALSE_POSITIVE: { color: 'text-blue-700', bgColor: 'bg-blue-100', icon: CheckSquare, label: 'Faux Positif' },
  PENDING_REVIEW: { color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Clock, label: 'En Attente' },
  APPROVED_WITH_COND: { color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Shield, label: 'Approuvé avec Conditions' },
  BLOCKED: { color: 'text-red-700', bgColor: 'bg-red-100', icon: Ban, label: 'Bloqué' },
};

interface SanctionsScreeningProps {
  embedded?: boolean;
}

export default function SanctionsScreening({ embedded = false }: SanctionsScreeningProps) {
  const [searchForm, setSearchForm] = useState<ScreenedEntityInput>({
    fullName: '',
    entityType: 'individual',
  });
  const [isScreening, setIsScreening] = useState(false);
  const [currentResult, setCurrentResult] = useState<ScreeningResult | null>(null);
  const [history, setHistory] = useState<ScreeningHistoryEntry[]>(MOCK_HISTORY);
  const [selectedCase, setSelectedCase] = useState<ScreeningCase | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [filters, setFilters] = useState({
    decision: 'all',
    riskLevel: 'all',
    dateRange: '30d',
  });
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

  const handleScreening = useCallback(async () => {
    if (!searchForm.fullName.trim()) return;

    setIsScreening(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = performScreening(searchForm);
      setCurrentResult(result);

      // Add to history
      const newEntry: ScreeningHistoryEntry = {
        id: `hist-${Date.now()}`,
        timestamp: new Date().toISOString(),
        entityName: searchForm.fullName,
        entityType: searchForm.entityType,
        result,
        reviewedBy: 'Current Session',
      };
      setHistory(prev => [newEntry, ...prev]);
    } catch (error) {
      console.error('Screening error:', error);
    } finally {
      setIsScreening(false);
    }
  }, [searchForm]);

  const handleResolveCase = (decision: string) => {
    if (!currentResult) return;

    const updatedCase: ScreeningCase = {
      id: `case-${Date.now()}`,
      screeningReferenceId: currentResult.referenceId,
      entity: searchForm,
      result: currentResult,
      status: decision === 'BLOCKED' ? 'resolved_blocked' : 
             decision === 'CLEAR' ? 'resolved_cleared' :
             decision === 'FALSE_POSITIVE' ? 'resolved_false_positive' : 'open',
      reviewerNotes: reviewNote ? [{
        author: 'Current User',
        timestamp: new Date().toISOString(),
        content: reviewNote,
      }] : [],
      resolution: {
        resolvedBy: 'Current User',
        resolvedAt: new Date().toISOString(),
        decision: decision as any,
        justification: reviewNote || 'No additional notes provided',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSelectedCase(updatedCase);
    setReviewNote('');
  };

  const filteredHistory = history.filter(entry => {
    if (filters.decision !== 'all' && entry.result.decision !== filters.decision) return false;
    if (filters.riskLevel !== 'all' && entry.result.riskLevel !== filters.riskLevel) return false;
    return true;
  });

  const stats = {
    total: history.length,
    cleared: history.filter(h => h.result.decision === 'CLEAR').length,
    blocked: history.filter(h => h.result.decision === 'BLOCKED').length,
    pending: history.filter(h => h.result.decision === 'PENDING_REVIEW').length,
    falsePositive: history.filter(h => h.result.decision === 'FALSE_POSITIVE').length,
  };

  const isRTL = language === 'ar';

  if (embedded) {
    return (
      <div className={isRTL ? 'rtl' : 'ltr'} dir={isRTL ? 'rtl' : 'ltr'}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserX className="h-5 w-5" />
              {language === 'fr' ? 'Vérification Sanctions' : 'فحص العقوبات'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder={language === 'fr' ? 'Nom ou entreprise...' : 'اسم أو شركة...'}
                value={searchForm.fullName}
                onChange={(e) => setSearchForm(prev => ({ ...prev, fullName: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleScreening()}
              />
              <Select
                value={searchForm.entityType}
                onValueChange={(val) => setSearchForm(prev => ({ ...prev, entityType: val as any }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">
                    <User className="h-4 w-4 mr-1" /> {language === 'fr' ? 'Personne' : 'شخص'}
                  </SelectItem>
                  <SelectItem value="organization">
                    <Building2 className="h-4 w-4 mr-1" /> {language === 'fr' ? 'Organisation' : 'منظمة'}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleScreening} disabled={isScreening || !searchForm.fullName.trim()}>
                {isScreening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {currentResult && (
              <ScreeningResultMini result={currentResult} language={language} />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={isRTL ? 'rtl' : 'ltr'} dir={isRTL ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-6 w-6" />
                {language === 'fr' ? 'Vérification des Sanctions' : 'فحص العقوبات'}
              </CardTitle>
              <CardDescription>
                {language === 'fr'
                  ? 'Screening contre les listes OFAC, UE, ONU et nationales'
                  : 'فحص ضد قوائم أوفاك، الاتحاد الأوروبي، الأمم المتحدة والوطنية'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
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
                {language === 'fr' ? 'Exporter' : 'تصدير'}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-4 mt-4">
            <StatCard label={language === 'fr' ? 'Total' : 'المجموع'} value={stats.total} icon={<Activity className="h-4 w-4" />} />
            <StatCard label={language === 'fr' ? 'Approuvés' : 'موافق عليها'} value={stats.cleared} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} color="text-emerald-600" />
            <StatCard label={language === 'fr' ? 'Bloqués' : 'محظورة'} value={stats.blocked} icon={<Ban className="h-4 w-4 text-red-600" />} color="text-red-600" />
            <StatCard label={language === 'fr' ? 'En Attente' : 'قيد الانتظار'} value={stats.pending} icon={<Clock className="h-4 w-4 text-amber-600" />} color="text-amber-600" />
            <StatCard label={language === 'fr' ? 'Faux Positifs' : 'إيجابيات كاذبة'} value={stats.falsePositive} icon={<CheckSquare className="h-4 w-4 text-blue-600" />} color="text-blue-600" />
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="screen">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="screen" className="gap-2">
                <Search className="h-4 w-4" />
                {language === 'fr' ? 'Nouveau Screening' : 'فحص جديد'}
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-2 relative">
                <Globe className="h-4 w-4" />
                {language === 'fr' ? 'Résultats' : 'النتائج'}
                {stats.pending > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                    {stats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="cases" className="gap-2">
                <FileText className="h-4 w-4" />
                {language === 'fr' ? 'Gestion des Cas' : 'إدارة الحالات'}
              </TabsTrigger>
            </TabsList>

            {/* New Screening Tab */}
            <TabsContent value="screen" className="mt-6 space-y-6">
              {/* Search Form */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {language === 'fr' ? 'Informations de l\'Entité' : 'معلومات الكيان'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === 'fr' ? 'Nom Complet / Raison Sociale' : 'الاسم الكامل / الاسم التجاري'} *</Label>
                      <Input
                        placeholder={language === 'fr' ? 'Ex: Ahmed Ben Mohamed ou SARL Example' : 'مثال: أحمد بن محمد أو شركة مثال'}
                        value={searchForm.fullName}
                        onChange={(e) => setSearchForm(prev => ({ ...prev, fullName: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleScreening()}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'fr' ? 'Type d\'Entité' : 'نوع الكيان'}</Label>
                      <Select
                        value={searchForm.entityType}
                        onValueChange={(val) => setSearchForm(prev => ({ ...prev, entityType: val as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">
                            <User className="h-4 w-4 mr-2" />
                            {language === 'fr' ? 'Personne Physique' : 'شخص طبيعي'}
                          </SelectItem>
                          <SelectItem value="organization">
                            <Building2 className="h-4 w-4 mr-2" />
                            {language === 'fr' ? 'Personne Morale' : 'شخص معنوي'}
                          </SelectItem>
                          <SelectItem value="sole_proprietorship">
                            <User className="h-4 w-4 mr-2" />
                            {language === 'fr' ? 'Entreprise Individuelle' : 'منشأة فردية'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'fr' ? 'Date de Naissance (optionnel)' : 'تاريخ الميلاد (اختياري)'}</Label>
                      <Input
                        type="date"
                        value={searchForm.dateOfBirth || ''}
                        onChange={(e) => setSearchForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'fr' ? 'Nationalité' : 'الجنسية'}</Label>
                      <Select onValueChange={(val) => setSearchForm(prev => ({ ...prev, nationality: val }))}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'fr' ? 'Sélectionner...' : 'اختر...'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DZ">🇩🇿 {language === 'fr' ? 'Algérie' : 'الجزائر'}</SelectItem>
                          <SelectItem value="FR">🇫🇷 France</SelectItem>
                          <SelectItem value="TN">🇹🇳 Tunisie</SelectItem>
                          <SelectItem value="MA">🇲🇦 Maroc</SelectItem>
                          <SelectItem value="OTHER">{language === 'fr' ? 'Autre' : 'أخرى'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'fr' ? 'Numéro d\'Identité (optionnel)' : 'رقم الهوية (اختياري)'}</Label>
                      <Input
                        placeholder={language === 'fr' ? 'CIN, Passeport, NIF...' : 'بطاقة تعريف، جواز، رقم ضريبي...'}
                        value={searchForm.idNumber || ''}
                        onChange={(e) => setSearchForm(prev => ({ ...prev, idNumber: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'fr' ? 'Adresse (optionnel)' : 'العنوان (اختياري)'}</Label>
                      <Input
                        placeholder={language === 'fr' ? 'Ville, Pays...' : 'مدينة، دولة...'}
                        value={searchForm.address || ''}
                        onChange={(e) => setSearchForm(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button
                      size="lg"
                      onClick={handleScreening}
                      disabled={isScreening || !searchForm.fullName.trim()}
                      className="min-w-48"
                    >
                      {isScreening ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {language === 'fr' ? 'Analyse en cours...' : 'جارٍ التحليل...'}
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          {language === 'fr' ? 'Lancer le Screening' : 'تشغيل الفحص'}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Current Result */}
              {currentResult && (
                <ScreeningResultFull
                  result={currentResult}
                  language={language}
                  expandedMatch={expandedMatch}
                  setExpandedMatch={setExpandedMatch}
                  onResolve={handleResolveCase}
                  reviewNote={reviewNote}
                  setReviewNote={setReviewNote}
                />
              )}
            </TabsContent>

            {/* Results History Tab */}
            <TabsContent value="results" className="mt-6 space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-center">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filters.decision} onValueChange={(v) => setFilters(f => ({ ...f, decision: v }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'fr' ? 'Toutes décisions' : 'جميع القرارات'}</SelectItem>
                    <SelectItem value="CLEAR">{DECISION_CONFIG.CLEAR.label}</SelectItem>
                    <SelectItem value="BLOCKED">{DECISION_CONFIG.BLOCKED.label}</SelectItem>
                    <SelectItem value="PENDING_REVIEW">{DECISION_CONFIG.PENDING_REVIEW.label}</SelectItem>
                    <SelectItem value="FALSE_POSITIVE">{DECISION_CONFIG.FALSE_POSITIVE.label}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.riskLevel} onValueChange={(v) => setFilters(f => ({ ...f, riskLevel: v }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'fr' ? 'Tous niveaux' : 'جميع المستويات'}</SelectItem>
                    <SelectItem value="critical">{RISK_LEVEL_CONFIG.critical.label}</SelectItem>
                    <SelectItem value="high">{RISK_LEVEL_CONFIG.high.label}</SelectItem>
                    <SelectItem value="medium">{RISK_LEVEL_CONFIG.medium.label}</SelectItem>
                    <SelectItem value="low">{RISK_LEVEL_CONFIG.low.label}</SelectItem>
                    <SelectItem value="none">{RISK_LEVEL_CONFIG.none.label}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setHistory(MOCK_HISTORY)}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  {language === 'fr' ? 'Actualiser' : 'تحديث'}
                </Button>
              </div>

              {/* Results Table */}
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-2">
                  {filteredHistory.map(entry => {
                    const riskConfig = RISK_LEVEL_CONFIG[entry.result.riskLevel];
                    const decisionConfig = DECISION_CONFIG[entry.result.decision] || DECISION_CONFIG.PENDING_REVIEW;
                    const DecisionIcon = decisionConfig.icon;

                    return (
                      <Card key={entry.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${riskConfig.bgColor}`}>
                              <DecisionIcon className={`h-5 w-5 ${decisionConfig.color}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium truncate">{entry.entityName}</p>
                                <Badge variant="outline" className={riskConfig.color}>
                                  {language === 'fr' ? riskConfig.label : riskConfig.labelAr}
                                </Badge>
                                <Badge className={decisionConfig.bgColor + ' ' + decisionConfig.color + ' border-0'}>
                                  {decisionConfig.label}
                                </Badge>
                                <Badge variant="secondary">
                                  {entry.entityType === 'individual' ? <User className="h-3 w-3 mr-1" /> : <Building2 className="h-3 w-3 mr-1" />}
                                  {entry.entityType}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <span>Ref: {entry.result.referenceId}</span>
                                <span>{new Date(entry.timestamp).toLocaleString(isRTL ? 'ar-DZ' : 'fr-DZ')}</span>
                                <span>{entry.result.matches.length} correspondance(s)</span>
                                <span>Risque: {entry.result.overallRiskScore}%</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => setCurrentResult(entry.result)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle>
                                      {language === 'fr' ? 'Détails du Screening' : 'تفاصيل الفحص'}
                                    </DialogTitle>
                                    <DialogDescription>
                                      {entry.result.referenceId}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <ScreeningResultFull
                                    result={entry.result}
                                    language={language}
                                    expandedMatch={expandedMatch}
                                    setExpandedMatch={setExpandedMatch}
                                    readOnly
                                  />
                                </DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {filteredHistory.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">
                        {language === 'fr' ? 'Aucun résultat trouvé' : 'لا توجد نتائج'}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Case Management Tab */}
            <TabsContent value="cases" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {language === 'fr' ? 'Cas en Cours' : 'الحالات الجارية'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCase ? (
                    <CaseDetailView
                      caseData={selectedCase}
                      language={language}
                      onClose={() => setSelectedCase(null)}
                    />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">
                        {language === 'fr' ? 'Sélectionnez un cas à examiner' : 'اختر حالة لفحصها'}
                      </p>
                      <p className="text-sm">
                        {language === 'fr'
                          ? 'Les cas sont créés automatiquement lors des screenings à risque'
                          : 'يتم إنشاء الحالات تلقائيًا أثناء الفحوصات عالية المخاطر'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-components
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color?: string }) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className={`text-2xl font-bold ${color || ''}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ScreeningResultMini({ result, language }: { result: ScreeningResult; language: 'fr' | 'ar' }) {
  const riskConfig = RISK_LEVEL_CONFIG[result.riskLevel];
  const RiskIcon = riskConfig.icon;

  return (
    <div className={`p-3 rounded-lg border ${riskConfig.bgColor}`}>
      <div className="flex items-center gap-2">
        <RiskIcon className={`h-5 w-5 ${riskConfig.color}`} />
        <div className="flex-1">
          <p className={`font-medium ${riskConfig.color}`}>
            {language === 'fr' ? riskConfig.label : riskConfig.labelAr}
          </p>
          <p className="text-xs text-muted-foreground">
            Risque: {result.overallRiskScore}% • Ref: {result.referenceId}
          </p>
        </div>
        <Badge variant={result.decision === 'BLOCKED' ? 'destructive' : 'default'}>
          {result.decision}
        </Badge>
      </div>
    </div>
  );
}

function ScreeningResultFull({
  result,
  language,
  expandedMatch,
  setExpandedMatch,
  onResolve,
  reviewNote,
  setReviewNote,
  readOnly = false,
}: {
  result: ScreeningResult;
  language: 'fr' | 'ar';
  expandedMatch: number | null;
  setExpandedMatch: (idx: number | null) => void;
  onResolve?: (decision: string) => void;
  reviewNote?: string;
  setReviewNote?: (note: string) => void;
  readOnly?: boolean;
}) {
  const riskConfig = RISK_LEVEL_CONFIG[result.riskLevel];
  const decisionConfig = DECISION_CONFIG[result.decision] || DECISION_CONFIG.PENDING_REVIEW;

  return (
    <Card className={riskConfig.bgColor}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${decisionConfig.bgColor}`}>
              {(decisionConfig.icon)({ className: `h-8 w-8 ${decisionConfig.color}` })}
            </div>
            <div>
              <CardTitle className="text-lg">
                {language === 'fr' ? 'Résultat du Screening' : 'نتيجة الفحص'}
              </CardTitle>
              <CardDescription>
                Référence: {result.referenceId} • {new Date(result.timestamp).toLocaleString()}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-sm ${riskConfig.color}`}>
              {language === 'fr' ? riskConfig.label : riskConfig.labelAr}
            </Badge>
            <Badge className={`${decisionConfig.bgColor} ${decisionConfig.color} border-0`}>
              {decisionConfig.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Risk Score Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>{language === 'fr' ? 'Score de Risque' : 'نتيجة المخاطر'}</span>
            <span className="font-bold">{result.overallRiskScore}%</span>
          </div>
          <Progress value={result.overallRiskScore} className="h-3" />
        </div>

        {/* Entity Screened */}
        <div className="p-3 bg-background/50 rounded-lg">
          <p className="text-sm font-medium mb-1">
            {language === 'fr' ? 'Entité Vérifiée' : 'الكيان المفحوص'}
          </p>
          <p className="text-lg font-bold">{result.screenedEntity.fullName}</p>
          <p className="text-sm text-muted-foreground">
            {result.screenedEntity.entityType === 'individual' ? 'Personne physique' : 'Personne morale'}
          </p>
        </div>

        {/* Matches */}
        {result.matches.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              {language === 'fr' ? `Correspondances (${result.matches.length})` : `التطابقات (${result.matches.length})`}
            </h4>

            {result.matches.map((match, idx) => (
              <Card key={idx} className="overflow-hidden">
                <CardContent className="p-0">
                  <button
                    className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedMatch(expandedMatch === idx ? null : idx)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${
                          match.confidenceScore >= 85 ? 'bg-red-100' :
                          match.confidenceScore >= 70 ? 'bg-amber-100' : 'bg-blue-100'
                        }`}>
                          <UserX className={`h-5 w-5 ${
                            match.confidenceScore >= 85 ? 'text-red-600' :
                            match.confidenceScore >= 70 ? 'text-amber-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">
                            {match.matchedEntity.names[0]?.fullName || 'Unknown Entity'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Confiance: {match.confidenceScore}% • Risque: {match.riskScore}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{match.sources.join(', ')}</Badge>
                        {expandedMatch === idx ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </button>

                  {expandedMatch === idx && (
                    <div className="px-4 pb-4 border-t space-y-3">
                      {/* Match Details */}
                      <div>
                        <p className="text-sm font-medium mb-2">Détails de Correspondance</p>
                        <div className="space-y-1">
                          {match.matchDetails.map((detail, i) => (
                            <div key={i} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                              <span className="text-muted-foreground">{detail.field}</span>
                              <div className="flex items-center gap-2">
                                <span className="line-through text-muted-foreground">{detail.screenedValue}</span>
                                <ArrowRight className="h-3 w-3" />
                                <span className="font-medium">{detail.matchedValue}</span>
                                <Badge variant="outline" className="text-xs">
                                  {detail.similarity}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* False Positive Indicators */}
                      {match.falsePositiveIndicators && match.falsePositiveIndicators.length > 0 && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-800 mb-1">
                            ℹ️ Indicateurs Faux Positif Potentiel
                          </p>
                          <ul className="text-sm text-blue-700 space-y-1">
                            {match.falsePositiveIndicators.map((ind, i) => (
                              <li key={i}>• {ind}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommendations */}
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <p className="text-sm font-medium text-amber-800 mb-1">
                          ⚠️ Recommandations
                        </p>
                        <ul className="text-sm text-amber-700 space-y-1">
                          {match.recommendations.map((rec, i) => (
                            <li key={i}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-emerald-600">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2" />
            <p className="font-medium">
              {language === 'fr' ? 'Aucune correspondance trouvée' : 'لم يتم العثور على تطابق'}
            </p>
            <p className="text-sm text-muted-foreground">
              {language === 'fr'
                ? 'L\'entité ne figure pas sur les listes de sanctions surveillées'
                : 'الكيان غير موجود في قوائم العقوبات المراقبة'}
            </p>
          </div>
        )}

        {/* Resolution Actions (if not read-only) */}
        {!readOnly && onResolve && result.matches.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium">
              {language === 'fr' ? 'Résolution du Cas' : 'حل الحالة'}
            </h4>
            
            <Textarea
              placeholder={language === 'fr' ? 'Notes de revue (obligatoire pour blocage)...' : 'ملاحظات المراجعة (إلزامية للحظر)...'}
              value={reviewNote}
              onChange={(e) => setReviewNote?.(e.target.value)}
              rows={3}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                variant="destructive"
                onClick={() => onResolve('BLOCKED')}
                disabled={!reviewNote?.trim() && result.decision !== 'BLOCKED'}
              >
                <Ban className="h-4 w-4 mr-1" />
                {language === 'fr' ? 'Bloquer' : 'حظر'}
              </Button>
              <Button
                variant="outline"
                onClick={() => onResolve('PENDING_REVIEW')}
              >
                <Clock className="h-4 w-4 mr-1" />
                {language === 'fr' ? 'En Attente' : 'قيد الانتظار'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => onResolve('FALSE_POSITIVE')}
              >
                <CheckSquare className="h-4 w-4 mr-1" />
                {language === 'fr' ? 'Faux Positif' : 'إيجابي كاذب'}
              </Button>
              <Button
                onClick={() => onResolve('CLEAR')}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {language === 'fr' ? 'Approuver' : 'موافقة'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CaseDetailView({ caseData, language, onClose }: { caseData: ScreeningCase; language: 'fr' | 'ar'; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h3 className="font-semibold">Cas #{caseData.id.slice(-6)}</h3>
          <p className="text-sm text-muted-foreground">
            Créé: {new Date(caseData.createdAt).toLocaleString()}
          </p>
        </div>
        <Badge variant="outline">{caseData.status.replace(/_/g, ' ')}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">{language === 'fr' ? 'Entité' : 'الكيان'}</p>
          <p className="font-medium">{caseData.entity.fullName}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{language === 'fr' ? 'Assigné à' : 'مسند إلى'}</p>
          <p className="font-medium">{caseData.assignedTo || '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{language === 'fr' ? 'Décision' : 'القرار'}</p>
          <Badge>{caseData.resolution?.decision || '-'}</Badge>
        </div>
        <div>
          <p className="text-muted-foreground">{language === 'fr' ? 'Résolu par' : 'تم الحل بواسطة'}</p>
          <p className="font-medium">{caseData.resolution?.resolvedBy || '-'}</p>
        </div>
      </div>

      {caseData.reviewerNotes && caseData.reviewerNotes.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">{language === 'fr' ? 'Notes de Revue' : 'ملاحظات المراجعة'}</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {caseData.reviewerNotes.map((note, i) => (
              <div key={i} className="p-3 bg-muted rounded text-sm">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{note.author}</span>
                  <span>{new Date(note.timestamp).toLocaleString()}</span>
                </div>
                <p>{note.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {caseData.resolution?.justification && (
        <div>
          <h4 className="font-medium mb-2">{language === 'fr' ? 'Justification' : 'مبرر'}</h4>
          <p className="text-sm p-3 bg-muted rounded">{caseData.resolution.justification}</p>
        </div>
      )}

      <Button variant="outline" onClick={onClose} className="w-full">
        {language === 'fr' ? 'Fermer' : 'إغلاق'}
      </Button>
    </div>
  );
}

export type { ScreeningHistoryEntry, ScreeningCase };
