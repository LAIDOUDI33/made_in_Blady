'use client';

/**
 * DocumentValidator Component - AlgeriaTrade.dz
 * 
 * Features:
 * - Document upload with drag-and-drop support
 * - OCR validation simulation for document content extraction
 * - Expiry date tracking and alerts
 * - Auto-renewal reminders configuration
 * - Document templates generator for Algerian regulatory forms
 * - Bilingual support (French/Arabic)
 */

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  CalendarDays,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  ScanLine,
  Bell,
  FilePlus,
  CalendarCheck,
  FileSearch,
  Languages,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr, arDZ } from 'date-fns/locale';

// Types
interface DocumentRecord {
  id: string;
  documentType: DocumentType;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  expiryDate?: string;
  status: 'valid' | 'expired' | 'expiring_soon' | 'pending_verification' | 'rejected';
  ocrExtracted?: OCRResult;
  notes?: string;
  reminderSet?: boolean;
  reminderDays?: number;
}

interface DocumentType {
  id: string;
  nameFr: string;
  nameAr: string;
  category: 'registration' | 'tax' | 'trade' | 'legal' | 'quality' | 'other';
  requiredFor: string[];
  validityPeriod?: number; // in months
  templateAvailable?: boolean;
}

interface OCRResult {
  extractedText: string;
  fields: ExtractedField[];
  confidence: number;
  processedAt: string;
}

interface ExtractedField {
  field: string;
  value: string;
  confidence: number;
}

// Document Types Configuration (Algerian Regulatory Documents)
const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'rcc',
    nameFr: 'Registre du Commerce (RCC)',
    nameAr: 'السجل التجاري',
    category: 'registration',
    requiredFor: ['commercial_activity', 'banking', 'government_contracts'],
    validityPeriod: 12,
    templateAvailable: false,
  },
  {
    id: 'nif',
    nameFr: "Numéro d'Identification Fiscale (NIF)",
    nameAr: 'الرقم التعريفي الضريبي',
    category: 'tax',
    requiredFor: ['tax_filing', 'invoicing'],
    validityPeriod: undefined, // No expiry
    templateAvailable: false,
  },
  {
    id: 'ais',
    nameFr: 'Identifiant Statistique (AIS)',
    nameAr: 'المعرف الإحصائي',
    category: 'registration',
    requiredFor: ['statistics', 'public_procurement'],
    validityPeriod: undefined,
    templateAvailable: false,
  },
  {
    id: 'import_license',
    nameFr: "Licence d'Importation",
    nameAr: 'ترخيص الاستيراد',
    category: 'trade',
    requiredFor: ['import_operations'],
    validityPeriod: 24,
    templateAvailable: true,
  },
  {
    id: 'export_license',
    nameFr: "Licence d'Exportation",
    nameAr: 'ترخيص التصدير',
    category: 'trade',
    requiredFor: ['export_operations'],
    validityPeriod: 24,
    templateAvailable: true,
  },
  {
    id: 'qai_certificate',
    nameFr: 'Certificat de Conformité QAI',
    nameAr: 'شهادة المطابقة QAI',
    category: 'quality',
    requiredFor: ['product_imports'],
    validityPeriod: 12,
    templateAvailable: false,
  },
  {
    id: 'statuts',
    nameFr: 'Statuts de la Société',
    nameAr: 'النظام الأساسي للشركة',
    category: 'legal',
    requiredFor: ['corporate_governance'],
    validityPeriod: undefined,
    templateAvailable: true,
  },
  {
    id: 'pv_ag',
    nameFr: 'PV Assemblée Générale',
    nameAr: 'محضر الجمعية العامة',
    category: 'legal',
    requiredFor: ['annual_filing'],
    validityPeriod: undefined,
    templateAvailable: true,
  },
  {
    id: 'bilan',
    nameFr: 'Bilan Comptable Certifié',
    nameAr: 'الميزانية المحاسبية المعتمدة',
    category: 'tax',
    requiredFor: ['annual_tax_filing', 'ibc_declaration'],
    validityPeriod: undefined,
    templateAvailable: true,
  },
  {
    id: 'cin',
    nameFr: 'Carte d\'Identité Nationale (CIN)',
    nameAr: 'بطاقة التعريف الوطنية',
    category: 'registration',
    requiredFor: ['identity_verification'],
    validityPeriod: 60, // CIN validity in months (5 years)
    templateAvailable: false,
  },
  {
    id: 'passport',
    nameFr: 'Passeport',
    nameAr: 'جواز السفر',
    category: 'registration',
    requiredFor: ['international_transactions'],
    validityPeriod: 120, // 10 years typical
    templateAvailable: false,
  },
  {
    id: 'rib',
    nameFr: 'Relevé d\'Identité Bancaire (RIB)',
    nameAr: 'كشف هوية بنكية',
    category: 'banking',
    requiredFor: ['payments', 'bank_transfers'],
    validityPeriod: 12,
    templateAvailable: false,
  },
];

// Mock Documents Data
const MOCK_DOCUMENTS: DocumentRecord[] = [
  {
    id: 'doc-001',
    documentType: DOCUMENT_TYPES[0],
    fileName: 'RCC_2024.pdf',
    fileSize: 245000,
    uploadedAt: '2024-01-15T10:30:00Z',
    expiryDate: '2024-06-15T00:00:00Z',
    status: 'expiring_soon',
    ocrExtracted: {
      extractedText: 'REGISTRE DU COMMERCE...\nN° RCC: 16B0001234567\nForme Juridique: SARL\n...',
      fields: [
        { field: 'rcc_number', value: '16B0001234567', confidence: 98 },
        { field: 'company_name', value: 'ENTREPRISE EXAMPLE SPA', confidence: 95 },
        { field: 'expiry_date', value: '15/06/2024', confidence: 92 },
      ],
      confidence: 95,
      processedAt: '2024-01-15T10:31:00Z',
    },
    reminderSet: true,
    reminderDays: 60,
  },
  {
    id: 'doc-002',
    documentType: DOCUMENT_TYPES[1],
    fileName: 'Attestation_NIF.jpg',
    fileSize: 180000,
    uploadedAt: '2024-01-10T14:20:00Z',
    status: 'valid',
    ocrExtracted: {
      extractedText: 'ATTESTATION D\'IDENTIFICATION FISCALE...\nNIF: 000016001234567...',
      fields: [
        { field: 'nif_number', value: '000016001234567', confidence: 99 },
        { field: 'entity_name', value: 'ENTREPRISE EXAMPLE SPA', confidence: 97 },
      ],
      confidence: 98,
      processedAt: '2024-01-10T14:21:00Z',
    },
  },
  {
    id: 'doc-003',
    documentType: DOCUMENT_TYPES[3],
    fileName: 'Licence_Import_2023.pdf',
    fileSize: 520000,
    uploadedAt: '2023-09-01T09:00:00Z',
    expiryDate: '2024-03-15T00:00:00Z',
    status: 'expired',
    reminderSet: true,
    reminderDays: 90,
  },
  {
    id: 'doc-004',
    documentType: DOCUMENT_TYPES[5],
    fileName: null,
    fileSize: 0,
    uploadedAt: '',
    status: 'rejected',
    notes: 'Document illisible ou format non supporté',
  },
];

// Category icons
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  registration: <FileText className="h-4 w-4" />,
  tax: <FileText className="h-4 w-4" />,
  trade: <Globe className="h-4 w-4" />,
  legal: <Scale className="h-4 w-4" />,
  quality: <CheckCircle2 className="h-4 w-4" />,
  banking: <CreditCardIcon className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />,
};

function CreditCardIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  );
}

function Globe(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  );
}

function Scale(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"></path>
      <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"></path>
      <path d="M7 21h10"></path>
      <path d="M12 3v18"></path>
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path>
    </svg>
  );
}

// Status configurations
const STATUS_CONFIG = {
  valid: { icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-100', label: 'Valide', labelAr: 'ساري' },
  expired: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Expiré', labelAr: 'منتهي' },
  expiring_soon: { icon: AlertTriangle, color: 'text-amber-600', bgColor: 'bg-amber-100', label: 'Expire bientôt', labelAr: 'ينتهي قريبًا' },
  pending_verification: { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'En vérification', labelAr: 'قيد التحقق' },
  rejected: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Rejeté', labelAr: 'مرفوض' },
};

interface DocumentValidatorProps {
  entityId?: string;
  onDocumentUpdate?: (documents: DocumentRecord[]) => void;
}

export default function DocumentValidator({ entityId, onDocumentUpdate }: DocumentValidatorProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>(MOCK_DOCUMENTS);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [showTemplates, setShowTemplates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newDoc: DocumentRecord = {
        id: `doc-${Date.now()}`,
        documentType: DOCUMENT_TYPES[0], // Default to RCC
        fileName: files[0].name,
        fileSize: files[0].size,
        uploadedAt: new Date().toISOString(),
        status: 'pending_verification',
      };

      setDocuments(prev => [...prev, newDoc]);
      onDocumentUpdate?.([...documents, newDoc]);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [documents, onDocumentUpdate]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleOCRScan = async (doc: DocumentRecord) => {
    setIsScanning(true);
    
    // Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockOCRResult: OCRResult = {
      extractedText: `[Simulated OCR extraction for ${doc.fileName}]`,
      fields: [
        { field: 'document_type', value: doc.documentType.nameFr, confidence: 94 },
        { field: 'file_name', value: doc.fileName, confidence: 99 },
        { field: 'upload_date', value: format(new Date(doc.uploadedAt), 'dd/MM/yyyy'), confidence: 98 },
      ],
      confidence: 96,
      processedAt: new Date().toISOString(),
    };

    setDocuments(prev =>
      prev.map(d => d.id === doc.id ? { ...d, ocrExtracted: mockOCRResult, status: 'valid' as const } : d)
    );

    setIsScanning(false);
  };

  const toggleReminder = (docId: string) => {
    setDocuments(prev =>
      prev.map(d => d.id === docId ? { ...d, reminderSet: !d.reminderSet } : d)
    );
  };

  const deleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const getDaysUntilExpiry = (expiryDate?: string): number | null => {
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const stats = {
    total: documents.length,
    valid: documents.filter(d => d.status === 'valid').length,
    expiringSoon: documents.filter(d => d.status === 'expiring_soon').length,
    expired: documents.filter(d => d.status === 'expired').length,
    pending: documents.filter(d => d.status === 'pending_verification').length,
  };

  const isRTL = language === 'ar';

  return (
    <div className={isRTL ? 'rtl' : 'ltr'} dir={isRTL ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="h-5 w-5" />
                {language === 'fr' ? 'Validation des Documents' : 'التحقق من المستندات'}
              </CardTitle>
              <CardDescription>
                {language === 'fr'
                  ? 'Gérez et validez vos documents réglementaires algériens'
                  : 'أدر وتحقق من مستنداتك التنظيمية الجزائرية'}
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
              <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FilePlus className="h-4 w-4 mr-1" />
                    {language === 'fr' ? 'Modèles' : 'نماذج'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {language === 'fr' ? 'Modèles de Documents Algériens' : 'نماذج المستندات الجزائرية'}
                    </DialogTitle>
                    <DialogDescription>
                      {language === 'fr'
                        ? 'Téléchargez des modèles conformes aux exigences réglementaires'
                        : 'حمّل نماذج متوافقة مع المتطلبات التنظيمية'}
                    </DialogDescription>
                  </DialogHeader>
                  <TemplateGallery language={language} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-4 mt-4">
            <StatCard label={language === 'fr' ? 'Total' : 'المجموع'} value={stats.total} icon={<FileText className="h-4 w-4" />} />
            <StatCard label={language === 'fr' ? 'Valides' : 'سارية'} value={stats.valid} icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} color="text-emerald-600" />
            <StatCard label={language === 'fr' ? 'Expirant' : 'منتهية قريبًا'} value={stats.expiringSoon} icon={<AlertTriangle className="h-4 w-4 text-amber-600" />} color="text-amber-600" />
            <StatCard label={language === 'fr' ? 'Expirés' : 'منتهية'} value={stats.expired} icon={<XCircle className="h-4 w-4 text-red-600" />} color="text-red-600" />
            <StatCard label={language === 'fr' ? 'En attente' : 'قيد الانتظار'} value={stats.pending} icon={<Clock className="h-4 w-4 text-blue-600" />} color="text-blue-600" />
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="documents">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="documents" className="gap-2">
                <FileText className="h-4 w-4" />
                {language === 'fr' ? 'Mes Documents' : 'مستنداتي'}
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="h-4 w-4" />
                {language === 'fr' ? 'Ajouter' : 'إضافة'}
              </TabsTrigger>
              <TabsTrigger value="reminders" className="gap-2">
                <Bell className="h-4 w-4" />
                {language === 'fr' ? 'Rappels' : 'التذكيرات'}
              </TabsTrigger>
            </TabsList>

            {/* Documents List Tab */}
            <TabsContent value="documents" className="mt-4">
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  {documents.map(doc => {
                    const statusConfig = STATUS_CONFIG[doc.status];
                    const StatusIcon = statusConfig.icon;
                    const daysUntil = getDaysUntilExpiry(doc.expiryDate);

                    return (
                      <Card key={doc.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-full ${statusConfig.bgColor}`}>
                              <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium truncate">
                                  {doc.fileName || `${language === 'fr' ? doc.documentType.nameFr : doc.documentType.nameAr}`}
                                </p>
                                <Badge variant="outline" className={statusConfig.color}>
                                  {language === 'fr' ? statusConfig.label : statusConfig.labelAr}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {CATEGORY_ICONS[doc.documentType.category]}
                                  <span className="ml-1">
                                    {doc.documentType.category}
                                  </span>
                                </Badge>
                              </div>

                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                                <span>
                                  {language === 'fr' ? 'Ajouté le' : 'تمت الإضافة في'}{' '}
                                  {format(new Date(doc.uploadedAt), 'dd/MM/yyyy')}
                                </span>
                                {daysUntil !== null && (
                                  <span className={
                                    daysUntil <= 0 ? 'text-red-600 font-medium' :
                                    daysUntil <= 30 ? 'text-amber-600 font-medium' :
                                    ''
                                  }>
                                    {daysUntil <= 0
                                      ? language === 'fr' ? 'Expiré' : 'منتهي'
                                      : `${language === 'fr' ? 'Expire dans' : 'ينتهي خلال'} ${daysUntil}j`
                                    }
                                  </span>
                                )}
                              </div>

                              {doc.notes && (
                                <p className="text-sm text-orange-600 mt-1 italic">{doc.notes}</p>
                              )}

                              {doc.ocrExtracted && (
                                <div className="mt-2 p-2 bg-muted rounded text-xs">
                                  <span className="font-medium">🔍 OCR:</span>{' '}
                                  {doc.ocrExtracted.confidence}% confiance • {doc.ocrExtracted.fields.length} champs extraits
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {!doc.ocrExtracted && doc.fileName && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOCRScan(doc)}
                                  disabled={isScanning}
                                >
                                  <ScanLine className="h-4 w-4" />
                                </Button>
                              )}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(doc)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>{doc.fileName || doc.documentType.nameFr}</DialogTitle>
                                  </DialogHeader>
                                  <DocumentDetail doc={doc} language={language} />
                                </DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="sm" onClick={() => toggleReminder(doc.id)}>
                                <Bell className={`h-4 w-4 ${doc.reminderSet ? 'fill-current text-primary' : ''}`} />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteDocument(doc.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {documents.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">
                        {language === 'fr' ? 'Aucun document' : 'لا توجد مستندات'}
                      </p>
                      <p className="text-sm">
                        {language === 'fr'
                          ? 'Commencez par ajouter vos documents réglementaires'
                          : 'ابدأ بإضافة مستنداتك التنظيمية'}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Upload Tab */}
            <TabsContent value="upload" className="mt-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />

                {isUploading ? (
                  <div className="space-y-4">
                    <RefreshCw className="h-12 w-12 mx-auto animate-spin text-primary" />
                    <p className="font-medium">
                      {language === 'fr' ? 'Envoi en cours...' : 'جارٍ الرفع...'}
                    </p>
                    <Progress value={Math.min(uploadProgress, 100)} className="max-w-xs mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      {Math.round(Math.min(uploadProgress, 100))}%
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">
                      {language === 'fr' ? 'Glissez vos fichiers ici' : 'اسحب ملفاتك هنا'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {language === 'fr'
                        ? 'ou cliquez pour parcourir'
                        : 'أو انقر للتصفح'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG, PNG, DOC • Max 10MB par fichier
                    </p>
                  </>
                )}
              </div>

              {/* Document Type Selection */}
              <div className="mt-6">
                <Label className="mb-2 block">
                  {language === 'fr' ? 'Type de document' : 'نوع المستند'}
                </Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'fr' ? 'Sélectionner le type...' : 'اختر النوع...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        <span className="flex items-center gap-2">
                          {CATEGORY_ICONS[type.category]}
                          {language === 'fr' ? type.nameFr : type.nameAr}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Reminders Tab */}
            <TabsContent value="reminders" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarBell className="h-5 w-5" />
                      {language === 'fr' ? 'Configuration des Rappels' : 'إعداد التذكيرات'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {documents.filter(d => d.expiryDate).map(doc => {
                      const daysUntil = getDaysUntilExpiry(doc.expiryDate);
                      return (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={doc.reminderSet}
                              onCheckedChange={() => toggleReminder(doc.id)}
                            />
                            <div>
                              <p className="font-medium text-sm">{doc.fileName || doc.documentType.nameFr}</p>
                              <p className="text-xs text-muted-foreground">
                                {daysUntil !== null && (
                                  <>
                                    {daysUntil <= 0
                                      ? language === 'fr' ? 'Expiré' : 'منتهي'
                                      : `${daysUntil} jours restants`
                                    }
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          {doc.reminderSet && (
                            <Select defaultValue={(doc.reminderDays || 30).toString()}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="7">7 {language === 'fr' ? 'jours' : 'أيام'}</SelectItem>
                                <SelectItem value="15">15 {language === 'fr' ? 'jours' : 'أيام'}</SelectItem>
                                <SelectItem value="30">30 {language === 'fr' ? 'jours' : 'أيام'}</SelectItem>
                                <SelectItem value="60">60 {language === 'fr' ? 'jours' : 'أيام'}</SelectItem>
                                <SelectItem value="90">90 {language === 'fr' ? 'jours' : 'أيام'}</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {language === 'fr' ? 'Prochains Rappels' : 'التذكيرات القادمة'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {documents
                        .filter(d => d.reminderSet && d.expiryDate && getDaysUntilExpiry(d.expiryDate)! > 0)
                        .sort((a, b) => (getDaysUntilExpiry(a.expiryDate) || 999) - (getDaysUntilExpiry(b.expiryDate) || 999))
                        .slice(0, 5)
                        .map(doc => (
                          <div key={doc.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 text-sm">{doc.fileName || doc.documentType.nameFr}</span>
                            <Badge variant="outline">
                              {getDaysUntilExpiry(doc.expiryDate)}j
                            </Badge>
                          </div>
                        ))
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>
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

function DocumentDetail({ doc, language }: { doc: DocumentRecord; language: 'fr' | 'ar' }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">{language === 'fr' ? 'Type' : 'النوع'}</p>
          <p className="font-medium">{language === 'fr' ? doc.documentType.nameFr : doc.documentType.nameAr}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{language === 'fr' ? 'Statut' : 'الحالة'}</p>
          <Badge variant="outline">{STATUS_CONFIG[doc.status].label}</Badge>
        </div>
        <div>
          <p className="text-muted-foreground">{language === 'fr' ? 'Taille' : 'الحجم'}</p>
          <p className="font-medium">{(doc.fileSize / 1024).toFixed(0)} KB</p>
        </div>
        <div>
          <p className="text-muted-foreground">{language === 'fr' ? 'Date d\'ajout' : 'تاريخ الإضافة'}</p>
          <p className="font-medium">{format(new Date(doc.uploadedAt), 'dd/MM/yyyy HH:mm')}</p>
        </div>
        {doc.expiryDate && (
          <div>
            <p className="text-muted-foreground">{language === 'fr' ? 'Expiration' : 'انتهاء الصلاحية'}</p>
            <p className="font-medium">{format(new Date(doc.expiryDate), 'dd/MM/yyyy')}</p>
          </div>
        )}
      </div>

      {doc.ocrExtracted && (
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <ScanLine className="h-4 w-4" />
            {language === 'fr' ? 'Résultats OCR' : 'نتائج التعرف البصري'}
          </h4>
          <div className="p-3 bg-muted rounded space-y-2">
            <p className="text-sm"><strong>Confiance:</strong> {doc.ocrExtracted.confidence}%</p>
            <div className="space-y-1">
              {doc.ocrExtracted.fields.map((field, i) => (
                <div key={i} className="text-sm flex justify-between">
                  <span className="text-muted-foreground">{field.field}:</span>
                  <span className="font-mono">{field.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateGallery({ language }: { language: 'fr' | 'ar' }) {
  const templates = DOCUMENT_TYPES.filter(t => t.templateAvailable);

  return (
    <div className="grid grid-cols-2 gap-4">
      {templates.map(template => (
        <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium text-sm">{language === 'fr' ? template.nameFr : template.nameAr}</p>
            <Button variant="outline" size="sm" className="mt-3 w-full">
              <Download className="h-4 w-4 mr-1" />
              {language === 'fr' ? 'Télécharger' : 'تحميل'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CalendarBell(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      <path d="M22 11v8"></path>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}

export type { DocumentRecord, DocumentType };
