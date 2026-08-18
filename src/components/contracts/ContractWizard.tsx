'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Package,
  Shield,
  Wrench,
  Truck,
  Lock,
  Handshake,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
} from 'lucide-react';

// Types
interface WizardStep {
  id: number;
  title: string;
  titleAr: string;
  titleFr: string;
  icon: React.ReactNode;
}

interface PartyFormData {
  companyName: string;
  representativeName: string;
  representativeTitle: string;
  email: string;
  phone: string;
  address: string;
  commercialRegister: string;
  taxId: string;
}

interface ContractFormData {
  templateType: string;
  language: 'AR' | 'FR' | 'BILINGUAL';
  subject: string;
  totalValue: string;
  currency: string;
  paymentTerms: string;
  effectiveDate: string;
  endDate: string;
  partyA: PartyFormData;
  partyB: PartyFormData;
}

const STEPS: WizardStep[] = [
  {
    id: 1,
    title: 'Select Template',
    titleAr: 'اختر القالب',
    titleFr: 'Choisir le modèle',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 2,
    title: 'Parties Information',
    titleAr: 'معلومات الأطراف',
    titleFr: 'Informations des parties',
    icon: <Package className="w-5 h-5" />,
  },
  {
    id: 3,
    title: 'Contract Details',
    titleAr: 'تفاصيل العقد',
    titleFr: 'Détails du contrat',
    icon: <Wrench className="w-5 h-5" />,
  },
  {
    id: 4,
    title: 'Review & Generate',
    titleAr: 'المراجعة والتوليد',
    titleFr: 'Révision et génération',
    icon: <Check className="w-5 h-5" />,
  },
];

const TEMPLATE_OPTIONS = [
  { value: 'SALES_AGREEMENT', label: 'Sales Agreement', labelAr: 'اتفاقية البيع', labelFr: 'Contrat de vente', icon: FileText },
  { value: 'SUPPLY_CONTRACT', label: 'Purchase Order', labelAr: 'أمر الشراء', labelFr: 'Bon de commande', icon: Package },
  { value: 'SERVICE_AGREEMENT', label: 'Service Agreement', labelAr: 'اتفاقية الخدمات', labelFr: 'Contrat de prestation', icon: Wrench },
  { value: 'DISTRIBUTION_AGREEMENT', label: 'Distribution Agreement', labelAr: 'اتفاقية التوزيع', labelFr: 'Contrat de distribution', icon: Truck },
  { value: 'NON_DISCLOSURE', label: 'NDA / Confidentiality', labelAr: 'اتفاقية عدم الإفصاح', labelFr: 'Accord de confidentialité', icon: Shield },
  { value: 'EXCLUSIVITY', label: 'Exclusivity Agreement', labelAr: 'اتفاقية الحصرية', labelFr: "Clause d'exclusivité", icon: Lock },
  { value: 'FRAMEWORK_AGREEMENT', label: 'Partnership / Framework', labelAr: 'شراكة / إطار', labelFr: "Partenariat / Accord-cadre", icon: Handshake },
];

const CURRENCY_OPTIONS = ['DZD', 'USD', 'EUR'];

interface ContractWizardProps {
  onComplete?: (data: ContractFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ContractWizard({ onComplete, onCancel, isLoading = false }: ContractWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ContractFormData>({
    templateType: '',
    language: 'BILINGUAL',
    subject: '',
    totalValue: '',
    currency: 'DZD',
    paymentTerms: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    endDate: '',
    partyA: {
      companyName: '',
      representativeName: '',
      representativeTitle: 'Director General',
      email: '',
      phone: '',
      address: '',
      commercialRegister: '',
      taxId: '',
    },
    partyB: {
      companyName: '',
      representativeName: '',
      representativeTitle: 'Director General',
      email: '',
      phone: '',
      address: '',
      commercialRegister: '',
      taxId: '',
    },
  });

  const updateField = useCallback((field: keyof ContractFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updatePartyField = useCallback(
    (party: 'partyA' | 'partyB', field: keyof PartyFormData, value: string) => {
      setFormData(prev => ({
        ...prev,
        [party]: { ...prev[party], [field]: value },
      }));
    },
    []
  );

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!formData.templateType && !!formData.language;
      case 2:
        return (
          !!formData.partyA.companyName &&
          !!formData.partyA.representativeName &&
          !!formData.partyA.email &&
          !!formData.partyB.companyName &&
          !!formData.partyB.representativeName &&
          !!formData.partyB.email
        );
      case 3:
        return (
          !!formData.subject &&
          !!formData.totalValue &&
          !!formData.paymentTerms
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (onComplete) {
      onComplete(formData);
    }
  };

  const selectedTemplate = TEMPLATE_OPTIONS.find(t => t.value === formData.templateType);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.icon}
                </div>
                <span
                  className={`mt-2 text-xs text-center hidden sm:block ${
                    currentStep >= step.id ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-muted'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {STEPS[currentStep - 1].icon}
            {STEPS[currentStep - 1].title}
            <span className="text-sm font-normal text-muted-foreground">
              ({STEPS[currentStep - 1].titleAr})
            </span>
          </CardTitle>
          <CardDescription>
            Step {currentStep} of {STEPS.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Template Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid gap-3">
                {TEMPLATE_OPTIONS.map((template) => (
                  <button
                    key={template.value}
                    onClick={() => updateField('templateType', template.value)}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-all w-full text-left ${
                      formData.templateType === template.value
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-md ${
                        formData.templateType === template.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <template.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{template.label}</div>
                      <div className="text-sm text-muted-foreground">{template.labelAr}</div>
                      <div className="text-xs text-muted-foreground italic">{template.labelFr}</div>
                    </div>
                    {formData.templateType === template.value && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language / اللغة</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) =>
                      updateField('language', value as 'AR' | 'FR' | 'BILINGUAL')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AR">العربية (Arabic)</SelectItem>
                      <SelectItem value="FR">Français (French)</SelectItem>
                      <SelectItem value="BILINGUAL">Bilingual / ثنائي اللغة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Parties Information */}
          {currentStep === 2 && (
            <div className="space-y-8">
              {/* Party A */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    PARTY A
                  </Badge>
                  Supplier / المورد / Fournisseur
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input
                      placeholder="Company name"
                      value={formData.partyA.companyName}
                      onChange={(e) => updatePartyField('partyA', 'companyName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Representative Name *</Label>
                    <Input
                      placeholder="Full name"
                      value={formData.partyA.representativeName}
                      onChange={(e) => updatePartyField('partyA', 'representativeName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      placeholder="Director General"
                      value={formData.partyA.representativeTitle}
                      onChange={(e) => updatePartyField('partyA', 'representativeTitle', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      placeholder="email@company.dz"
                      value={formData.partyA.email}
                      onChange={(e) => updatePartyField('partyA', 'email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      placeholder="+213 XXX XXX XXX"
                      value={formData.partyA.phone}
                      onChange={(e) => updatePartyField('partyA', 'phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NRC (Commercial Register)</Label>
                    <Input
                      placeholder="XX/XX-XXXXXXX/XX"
                      value={formData.partyA.commercialRegister}
                      onChange={(e) => updatePartyField('partyA', 'commercialRegister', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    <Input
                      placeholder="Full address including wilaya"
                      value={formData.partyA.address}
                      onChange={(e) => updatePartyField('partyA', 'address', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NIF (Tax ID)</Label>
                    <Input
                      placeholder="Tax identification number"
                      value={formData.partyA.taxId}
                      onChange={(e) => updatePartyField('partyA', 'taxId', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Party B */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    PARTY B
                  </Badge>
                  Buyer / المشتري / Acheteur
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input
                      placeholder="Company name"
                      value={formData.partyB.companyName}
                      onChange={(e) => updatePartyField('partyB', 'companyName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Representative Name *</Label>
                    <Input
                      placeholder="Full name"
                      value={formData.partyB.representativeName}
                      onChange={(e) => updatePartyField('partyB', 'representativeName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      placeholder="Director General"
                      value={formData.partyB.representativeTitle}
                      onChange={(e) => updatePartyField('partyB', 'representativeTitle', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      placeholder="email@company.dz"
                      value={formData.partyB.email}
                      onChange={(e) => updatePartyField('partyB', 'email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      placeholder="+213 XXX XXX XXX"
                      value={formData.partyB.phone}
                      onChange={(e) => updatePartyField('partyB', 'phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NRC (Commercial Register)</Label>
                    <Input
                      placeholder="XX/XX-XXXXXXX/XX"
                      value={formData.partyB.commercialRegister}
                      onChange={(e) => updatePartyField('partyB', 'commercialRegister', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    <Input
                      placeholder="Full address including wilaya"
                      value={formData.partyB.address}
                      onChange={(e) => updatePartyField('partyB', 'address', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NIF (Tax ID)</Label>
                    <Input
                      placeholder="Tax identification number"
                      value={formData.partyB.taxId}
                      onChange={(e) => updatePartyField('partyB', 'taxId', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contract Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="subject">Subject / Subject Matter *</Label>
                  <Textarea
                    placeholder="Brief description of the contract subject matter..."
                    rows={3}
                    value={formData.subject}
                    onChange={(e) => updateField('subject', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalValue">Total Value (Amount) *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.totalValue}
                    onChange={(e) => updateField('totalValue', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => updateField('currency', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((curr) => (
                        <SelectItem key={curr} value={curr}>
                          {curr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="paymentTerms">Payment Terms *</Label>
                  <Textarea
                    placeholder="e.g., Net 30 days, 50% advance, balance on delivery..."
                    rows={2}
                    value={formData.paymentTerms}
                    onChange={(e) => updateField('paymentTerms', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">Effective Date</Label>
                  <Input
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => updateField('effectiveDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => updateField('endDate', e.target.value)}
                  />
                </div>
              </div>

              {selectedTemplate && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Selected Template</h4>
                  <div className="flex items-center gap-2">
                    <selectedTemplate.icon className="w-4 h-4" />
                    <span>{selectedTemplate.label}</span>
                    <span className="text-muted-foreground">({selectedTemplate.labelAr})</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review & Confirm */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid gap-4">
                <ReviewSection
                  title="Template & Language"
                  data={[
                    ['Template', selectedTemplate?.label || '-'],
                    ['Language', formData.language],
                  ]}
                />
                <ReviewSection
                  title="Party A (Supplier)"
                  data={[
                    ['Company', formData.partyA.companyName],
                    ['Representative', `${formData.partyA.representativeName} (${formData.partyA.representativeTitle})`],
                    ['Email', formData.partyA.email],
                    ['Phone', formData.partyA.phone || '-'],
                    ['NRC', formData.partyA.commercialRegister || '-'],
                  ]}
                />
                <ReviewSection
                  title="Party B (Buyer)"
                  data={[
                    ['Company', formData.partyB.companyName],
                    ['Representative', `${formData.partyB.representativeName} (${formData.partyB.representativeTitle})`],
                    ['Email', formData.partyB.email],
                    ['Phone', formData.partyB.phone || '-'],
                    ['NRC', formData.partyB.commercialRegister || '-'],
                  ]}
                />
                <ReviewSection
                  title="Contract Terms"
                  data={[
                    ['Subject', formData.subject],
                    ['Value', `${new Intl.NumberFormat().format(Number(formData.totalValue))} ${formData.currency}`],
                    ['Payment Terms', formData.paymentTerms],
                    ['Effective Date', formData.effectiveDate],
                    ['End Date', formData.endDate || 'Indefinite'],
                  ]}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-2">
              {onCancel && (
                <Button variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              )}

              {currentStep < STEPS.length ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToStep(currentStep + 1)}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Contract
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for review section
function ReviewSection({
  title,
  data,
}: {
  title: string;
  data: [string, string][];
}) {
  return (
    <div className="p-4 bg-muted/50 rounded-lg">
      <h4 className="font-medium mb-3 text-sm">{title}</h4>
      <dl className="grid gap-2">
        {data.map(([label, value]) => (
          <div key={label} className="flex text-sm">
            <dt className="w-32 text-muted-foreground shrink-0">{label}:</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default ContractWizard;
