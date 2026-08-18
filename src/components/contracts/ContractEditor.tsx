'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ClauseEditor from './ClauseEditor';
import type { Contract, ContractClause, ContractType, ContractLanguage, ContractParty } from '@/lib/contracts';

interface ContractEditorProps {
  contract?: Contract;
  onSave: (contractData: Partial<Contract>) => void;
  onPreview?: () => void;
  onSign?: () => void;
  isSaving?: boolean;
  language?: 'en' | 'ar' | 'fr';
}

const contractTypes: { value: ContractType; label: string; ar: string; fr: string }[] = [
  { value: 'SALES_AGREEMENT', label: 'Sales Agreement', ar: 'اتفاقية البيع', fr: 'Contrat de vente' },
  { value: 'SUPPLY_CONTRACT', label: 'Supply Contract', ar: 'عقد التوريد', fr: 'Contrat de fourniture' },
  { value: 'SERVICE_AGREEMENT', label: 'Service Agreement', ar: 'اتفاقية الخدمات', fr: 'Contrat de prestation' },
  { value: 'DISTRIBUTION_AGREEMENT', label: 'Distribution Agreement', ar: 'اتفاقية التوزيع', fr: 'Contrat de distribution' },
  { value: 'NON_DISCLOSURE', label: 'NDA / Confidentiality', ar: 'اتفاقية عدم الإفشاء', fr: 'NDA / Confidentialité' },
  { value: 'EXCLUSIVITY', label: 'Exclusivity Agreement', ar: 'اتفاقية الحصرية', fr: "Clause d'exclusivité" },
  { value: 'FRAMEWORK_AGREEMENT', label: 'Framework Agreement', ar: 'اتفاقية إطار', fr: 'Accord-cadre' },
];

const statusConfig: Record<string, { color: string; label: string; ar: string; fr: string }> = {
  DRAFT: { color: 'bg-gray-100 text-gray-700', label: 'Draft', ar: 'مسودة', fr: 'Brouillon' },
  REVIEW: { color: 'bg-blue-100 text-blue-700', label: 'Under Review', ar: 'قيد المراجعة', fr: 'En révision' },
  PENDING_SIGNATURE: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending Signature', ar: 'في انتظار التوقيع', fr: 'En attente de signature' },
  SIGNED: { color: 'bg-green-100 text-green-700', label: 'Signed', ar: 'موقع', fr: 'Signé' },
  ACTIVE: { color: 'bg-emerald-100 text-emerald-700', label: 'Active', ar: 'نشط', fr: 'Actif' },
  EXPIRED: { color: 'bg-gray-100 text-gray-500', label: 'Expired', ar: 'منتهي الصلاحية', fr: 'Expiré' },
  TERMINATED: { color: 'bg-red-100 text-red-700', label: 'Terminated', ar: 'منهي', fr: 'Résilié' },
};

export function ContractEditor({
  contract,
  onSave,
  onPreview,
  onSign,
  isSaving = false,
  language = 'en',
}: ContractEditorProps) {
  const [formData, setFormData] = useState<Partial<Contract>>({
    ...contract,
    partyA: contract?.partyA || getDefaultParty(),
    partyB: contract?.partyB || getDefaultParty(),
    clauses: contract?.clauses || [],
    customClauses: contract?.customClauses || [],
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'parties' | 'clauses'>('basic');

  const getLabel = (en: string, ar: string, fr: string) => {
    return language === 'ar' ? ar : language === 'fr' ? fr : en;
  };

  const handleSave = () => {
    onSave(formData);
  };

  const updateParty = (party: 'A' | 'B', field: keyof ContractParty, value: any) => {
    setFormData(prev => ({
      ...prev,
      [party === 'A' ? 'partyA' : 'partyB']: {
        ...(prev[party === 'A' ? 'partyA' : 'partyB'] as ContractParty),
        [field]: value,
      },
    }));
  };

  const updateClause = (clauseId: string, updates: Partial<ContractClause>) => {
    setFormData(prev => {
      const clauses = [...(prev.clauses || [])];
      const index = clauses.findIndex(c => c.id === clauseId);
      if (index >= 0) {
        clauses[index] = { ...clauses[index], ...updates };
      }
      return { ...prev, clauses };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-xl">
                {getLabel('Contract Editor', 'محرر العقد', 'Éditeur de contrat')}
              </CardTitle>
              {contract && (
                <p className="text-sm text-muted-foreground mt-1">
                  {contract.contractNumber}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {contract && (
                <Badge className={statusConfig[contract.status]?.color || ''}>
                  {statusConfig[contract.status]?.label || contract.status}
                </Badge>
              )}
              
              {onPreview && (
                <Button variant="outline" onClick={onPreview}>
                  {getLabel('Preview', 'معاينة', 'Aperçu')}
                </Button>
              )}
              
              {onSign && contract?.status === 'PENDING_SIGNATURE' && (
                <Button onClick={onSign}>
                  {getLabel('Sign Now', 'وقّع الآن', 'Signer maintenant')}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        {/* Tabs */}
        <CardContent className="pt-0">
          <div className="flex border-b mb-4">
            {[
              { id: 'basic', label: getLabel('Basic Info', 'المعلومات الأساسية', 'Infos de base') },
              { id: 'parties', label: getLabel('Parties', 'الأطراف', 'Parties') },
              { id: 'clauses', label: getLabel('Clauses', 'البنود', 'Clauses') },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{getLabel('Contract Type', 'نوع العقد', 'Type de contrat')}</Label>
                <Select 
                  value={formData.contractType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, contractType: value as ContractType }))}
                  disabled={!!contract}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {getLabel(type.label, type.ar, type.fr)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{getLabel('Language', 'اللغة', 'Langue')}</Label>
                <Select 
                  value={formData.language || 'BILINGUAL'} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, language: value as ContractLanguage }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AR">العربية</SelectItem>
                    <SelectItem value="FR">Français</SelectItem>
                    <SelectItem value="BILINGUAL">Bilingual / ثنائي اللغة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{getLabel('Subject (EN)', 'الموضوع (إنجليزي)', 'Sujet (EN)')}</Label>
                <Input
                  value={formData.subject || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Contract subject in English"
                />
              </div>

              <div className="space-y-2">
                <Label>{getLabel('Subject (AR)', 'الموضوع (عربي)', 'Sujet (AR)')}</Label>
                <Input
                  value={formData.subjectAr || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, subjectAr: e.target.value }))}
                  placeholder="موضوع العقد بالعربية"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label>{getLabel('Subject (FR)', 'الموضوع (فرنسي)', 'Sujet (FR)')}</Label>
                <Input
                  value={formData.subjectFr || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, subjectFr: e.target.value }))}
                  placeholder="Sujet du contrat en français"
                />
              </div>

              <div className="space-y-2">
                <Label>{getLabel('Total Value', 'القيمة الإجمالية', 'Valeur totale')} (DZD)</Label>
                <Input
                  type="number"
                  value={formData.totalValue || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalValue: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>{getLabel('Payment Terms', 'شروط الدفع', 'Conditions de paiement')}</Label>
                <Input
                  value={formData.paymentTerms || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  placeholder="Net 30"
                />
              </div>

              <div className="space-y-2">
                <Label>{getLabel('Effective Date', 'تاريخ السريان', "Date d'effet")}</Label>
                <Input
                  type="date"
                  value={formData.effectiveDate ? new Date(formData.effectiveDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: new Date(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label>{getLabel('End Date (optional)', 'تاريخ الانتهاء (اختياري)', "Date de fin (optionnel)")}</Label>
                <Input
                  type="date"
                  value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value ? new Date(e.target.value) : null }))}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>{getLabel('Penalty Clause', 'بند الجزاء', 'Clause pénale')}</Label>
                <Textarea
                  value={formData.penaltyClause || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, penaltyClause: e.target.value }))}
                  placeholder="Late payment penalties..."
                  rows={2}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>{getLabel('Warranty Terms', 'شروط الضمان', 'Conditions de garantie')}</Label>
                <Textarea
                  value={formData.warrantyTerms || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, warrantyTerms: e.target.value }))}
                  placeholder="Warranty terms and conditions..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Parties Tab */}
          {activeTab === 'parties' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Party A - Supplier */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-red-600">
                    Party A - Supplier / البائع
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <PartyFormFields
                    party={formData.partyA}
                    onChange={(field, value) => updateParty('A', field, value)}
                    language={language}
                  />
                </CardContent>
              </Card>

              {/* Party B - Buyer */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-blue-600">
                    Party B - Buyer / المشتري
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <PartyFormFields
                    party={formData.partyB}
                    onChange={(field, value) => updateParty('B', field, value)}
                    language={language}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Clauses Tab */}
          {activeTab === 'clauses' && (
            <div className="space-y-4">
              <h3 className="font-medium">{getLabel('Standard Clauses', 'البنود القياسية', 'Clauses standard')}</h3>
              
              {(formData.clauses || []).map((clause) => (
                <ClauseEditor
                  key={clause.id}
                  clause={clause}
                  onChange={(updates) => updateClause(clause.id, updates)}
                  readOnly={!clause.isEditable}
                  language={language}
                />
              ))}

              {(formData.customClauses && formData.customClauses.length > 0) && (
                <>
                  <h3 className="font-medium pt-4 border-t">
                    {getLabel('Custom Clauses', 'البنود المخصصة', 'Clauses personnalisées')}
                  </h3>
                  
                  {formData.customClauses.map((clause) => (
                    <ClauseEditor
                      key={clause.id}
                      clause={clause}
                      onChange={() => {}}
                      language={language}
                      canDelete
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving 
            ? getLabel('Saving...', 'جارٍ الحفظ...', 'Enregistrement...')
            : getLabel('Save Contract', 'حفظ العقد', 'Enregistrer le contrat')
          }
        </Button>
      </div>
    </div>
  );
}

// Sub-component for party form fields
function PartyFormFields({ 
  party, 
  onChange, 
  language 
}: { 
  party?: ContractParty; 
  onChange: (field: keyof ContractParty, value: any) => void;
  language: 'en' | 'ar' | 'fr';
}) {
  const p = party || {};
  
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Company Name</Label>
          <Input 
            value={p.companyName || ''} 
            onChange={(e) => onChange('companyName', e.target.value)}
            placeholder="Company name"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Representative</Label>
          <Input 
            value={p.representativeName || ''} 
            onChange={(e) => onChange('representativeName', e.target.value)}
            placeholder="Name"
            className="h-8 text-sm"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Email</Label>
          <Input 
            type="email"
            value={p.email || ''} 
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="email@company.dz"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Phone</Label>
          <Input 
            value={p.phone || ''} 
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="+213 XXX XXX XXX"
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs">Address</Label>
        <Input 
          value={p.address || ''} 
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="Full address"
          className="h-8 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">NRC</Label>
          <Input 
            value={p.commercialRegister || ''} 
            onChange={(e) => onChange('commercialRegister', e.target.value)}
            placeholder="Commercial register"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">NIF</Label>
          <Input 
            value={p.taxId || ''} 
            onChange={(e) => onChange('taxId', e.target.value)}
            placeholder="Tax ID"
            className="h-8 text-sm"
          />
        </div>
      </div>
    </>
  );
}

function getDefaultParty(): ContractParty {
  return {
    companyId: '',
    companyName: '',
    representativeName: '',
    representativeTitle: '',
    email: '',
    phone: '',
    address: '',
    commercialRegister: '',
    taxId: '',
  };
}

export default ContractEditor;
