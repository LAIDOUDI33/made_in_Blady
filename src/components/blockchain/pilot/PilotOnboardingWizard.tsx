'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  Package,
  Code,
  Users,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  FileText,
  Shield,
  Zap,
  Globe,
  Factory,
  Pill,
  Wheat,
  TreePine
} from 'lucide-react';

// Types
interface CompanyInfo {
  companyNameAr: string;
  companyNameFr: string;
  companyNameEn: string;
  registrationNumber: string;
  taxId: string;
  industry: string;
  address: {
    street: string;
    city: string;
    wilayaCode: string;
    postalCode: string;
  };
  contactPerson: {
    name: string;
    email: string;
    phone: string;
    position: string;
  };
  website?: string;
}

interface ProductCategorySelection {
  primaryCategory: string;
  subCategories: string[];
  estimatedProducts: number;
  requiresColdChain: boolean;
  requiresOrganicTracking: boolean;
  exportTargetMarkets: string[];
}

interface IntegrationMethod {
  method: 'api' | 'manual' | 'erp';
  erpType?: string;
  technicalContact: {
    name: string;
    email: string;
    phone: string;
  };
  webhookUrl?: string;
  existingSystems: string[];
}

interface StaffUser {
  name: string;
  email: string;
  role: string;
  department: string;
}

interface TestingConfig {
  testBatchSize: number;
  testProducts: string[];
  startDate: string;
  goLiveDate: string;
  successCriteria: {
    trackingCoverage: number;
    eventAccuracy: number;
    userAdoption: number;
  };
}

interface OnboardingData {
  companyInfo: CompanyInfo;
  productSelection: ProductCategorySelection;
  integration: IntegrationMethod;
  staffUsers: StaffUser[];
  testing: TestingConfig;
}

// Algerian Wilayas data
const WILAYAS = [
  { code: '01', name: 'Adrar', nameAr: 'أدرار' },
  { code: '02', name: 'Chlef', nameAr: 'الشلف' },
  { code: '03', name: 'Laghouat', nameAr: 'الأغواط' },
  { code: '04', name: 'Oum El Bouaghi', nameAr: 'أم البواقي' },
  { code: '05', name: 'Batna', nameAr: 'باتنة' },
  { code: '06', name: 'Béjaïa', nameAr: 'بجاية' },
  { code: '07', name: 'Biskra', nameAr: 'بسكرة' },
  { code: '08', name: 'Béchar', nameAr: 'بشار' },
  { code: '09', name: 'Blida', nameAr: 'البليدة' },
  { code: '10', name: 'Bouira', nameAr: 'البويرة' },
  { code: '11', name: 'Tamanrasset', nameAr: 'تمنراست' },
  { code: '12', name: 'Tébessa', nameAr: 'تبسة' },
  { code: '13', name: 'Tlemcen', nameAr: 'تلمسان' },
  { code: '14', name: 'Tiaret', nameAr: 'تيارت' },
  { code: '15', name: 'Tizi Ouzou', nameAr: 'تيزي وزو' },
  { code: '16', name: 'Alger', nameAr: 'الجزائر' },
  { code: '17', name: 'Djelfa', nameAr: 'الجلفة' },
  { code: '18', name: 'Jijel', nameAr: 'جيجل' },
  { code: '19', name: 'Sétif', nameAr: 'سطيف' },
  { code: '20', name: 'Saïda', nameAr: 'سعيدة' },
  { code: '21', name: 'Skikda', nameAr: 'سكيكدة' },
  { code: '22', name: 'Sidi Bel Abbès', nameAr: 'سيدي بلعباس' },
  { code: '23', name: 'Annaba', nameAr: 'عنابة' },
  { code: '24', name: 'Guelma', nameAr: 'قالة' },
  { code: '25', name: 'Constantine', nameAr: 'قسنطينة' },
  { code: '26', name: 'Médéa', nameAr: 'المدية' },
  { code: '27', name: 'Mostaganem', nameAr: 'مستغانم' },
  { code: '28', name: "M'Sila", nameAr: 'المسيلة' },
  { code: '29', name: 'Mascara', nameAr: 'معسكر' },
  { code: '30', name: 'Ouargla', nameAr: 'ورقلة' },
  { code: '31', name: 'Oran', nameAr: 'وهران' },
  { code: '32', name: 'El Bayadh', nameAr: 'البيض' },
  { code: '33', name: 'Illizi', nameAr: 'إيليزي' },
  { code: '34', name: 'Bordj Bou Arréridj', nameAr: 'برج بوعريريج' },
  { code: '35', name: 'Boumerdès', nameAr: 'بومرداس' },
  { code: '36', name: 'El Tarf', nameAr: 'الطارف' },
  { code: '37', name: 'Tindouf', nameAr: 'تندوف' },
  { code: '38', name: 'Tissemsilt', nameAr: 'تيسمسيلت' },
  { code: '39', name: 'El Oued', nameAr: 'الوادي' },
  { code: '40', name: 'Khenchela', nameAr: 'خنشلة' },
  { code: '41', name: 'Souk Ahras', nameAr: 'سوق أهراس' },
  { code: '42', name: 'Tipaza', nameAr: 'تيبازة' },
  { code: '43', name: 'Mila', nameAr: 'ميلة' },
  { code: '44', name: 'Aïn Defla', nameAr: 'عين الدفلى' },
  { code: '45', name: 'Naâma', nameAr: 'النعامة' },
  { code: '46', name: 'Aïn Témouchent', nameAr: 'عين تموشنت' },
  { code: '47', name: 'Ghardaïa', nameAr: 'غداية' },
  { code: '48', name: 'Relizane', nameAr: 'غليزان' },
  { code: '49', name: 'El M\'Ghair', nameAr: 'المغير' },
  { code: '50', name: 'El Meniaa', nameAr: 'المنيعة' },
  { code: '51', name: 'Ouled Djellal', nameAr: 'اولاد جلال' },
  { code: '52', name: 'Bordj Baji Mokhtar', nameAr: 'برج باجي مختار' },
  { code: '53', name: 'Béni Abbès', nameAr: 'بني عباس' },
  { code: '54', name: 'Timimoun', nameAr: 'تيميمون' },
  { code: '55', name: 'Touggourt', nameAr: 'تقرت' },
  { code: '56', name: 'Djanet', nameAr: 'جانت' },
  { code: '57', name: 'In Salah', nameAr: 'إن سلام' },
  { code: '58', name: 'In Guezzam', nameAr: 'إن قزام' }
];

const INDUSTRIES = [
  { value: 'pharmaceuticals', label: 'Pharmaceuticals', labelAr: 'الأدوية', icon: Pill },
  { value: 'agriculture-dates', label: 'Dates Production', labelAr: 'إنتاج التمر', icon: Wheat },
  { value: 'agriculture-olive-oil', label: 'Olive Oil', labelAr: 'زيت الزيتون', icon: TreePine },
  { value: 'agriculture-general', label: 'General Agriculture', labelAr: 'زراعة عامة', icon: Wheat },
  { value: 'cement', label: 'Cement & Construction Materials', labelAr: 'أسمنت ومواد البناء', icon: Factory },
  { value: 'steel', label: 'Steel & Metals', labelAr: 'صلب ومعادن', icon: Factory },
  { value: 'food-processing', label: 'Food Processing', labelAr: 'تصنيع الأغذية', icon: Package },
  { value: 'chemicals', label: 'Chemicals', labelAr: 'كيماويات', icon: FlaskIcon }
];

function FlaskIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 3h6"/><path d="M10 9V5h4v4"/><path d="M6 20a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4.7a2 2 0 0 0-.216-.91L14 9V5h-4v4l-3.784 5.39A2 2 0 0 0 6 15.3Z"/>
    </svg>
  );
}

const PRODUCT_CATEGORIES = [
  { value: 'pharmaceutical_finished', label: 'Finished Pharmaceuticals', industry: 'pharmaceuticals' },
  { value: 'pharmaceutical_raw_material', label: 'Pharma Raw Materials', industry: 'pharmaceuticals' },
  { value: 'date_product', label: 'Dates (All Varieties)', industry: ['agriculture-dates', 'agriculture-general'] },
  { value: 'olive_oil', label: 'Olive Oil', industry: ['agriculture-olive-oil', 'agriculture-general'] },
  { value: 'citrus_fruit', label: 'Citrus Fruits', industry: 'agriculture-general' },
  { value: 'vegetable', label: 'Vegetables', industry: 'agriculture-general' },
  { value: 'cereal', label: 'Cereals & Grains', industry: 'agriculture-general' },
  { value: 'cement', label: 'Cement Products', industry: 'cement' },
  { value: 'construction_material', label: 'Construction Materials', industry: 'cement' },
  { value: 'steel_product', label: 'Steel Products', industry: 'steel' },
  { value: 'steel_raw', label: 'Raw Steel/Metals', industry: 'steel' },
  { value: 'industrial_raw_material', label: 'Industrial Raw Materials', industry: ['cement', 'steel', 'chemicals'] },
  { value: 'chemical', label: 'Chemical Products', industry: 'chemicals' },
  { value: 'food_processed', label: 'Processed Foods', industry: 'food-processing' }
];

const ERP_SYSTEMS = [
  { value: 'sap', label: 'SAP ERP' },
  { value: 'odoo', label: 'Odoo' },
  { value: 'microsoft_dynamics', label: 'Microsoft Dynamics 365' },
  { value: 'oracle', label: 'Oracle ERP' },
  { value: 'custom', label: 'Custom/In-house System' },
  { value: 'none', label: 'No ERP (Manual Only)' }
];

const STAFF_ROLES = [
  { value: 'admin', label: 'System Administrator', description: 'Full system access and configuration' },
  { value: 'warehouse_manager', label: 'Warehouse Manager', description: 'Inventory and receiving operations' },
  { value: 'warehouse_operator', label: 'Warehouse Operator', description: 'Scanning and event logging' },
  { value: 'qc_manager', label: 'Quality Control Manager', description: 'Inspection and certificate approval' },
  { value: 'qc_inspector', label: 'QC Inspector', description: 'Quality testing and verification' },
  { value: 'logistics_coordinator', label: 'Logistics Coordinator', description: 'Shipping and transport management' },
  { value: 'operations_manager', label: 'Operations Manager', description: 'Dashboard monitoring and reporting' },
  { value: 'it_manager', label: 'IT Manager', description: 'Technical integration and support' }
];

const EXPORT_MARKETS = [
  { value: 'eu', label: 'European Union' },
  { value: 'africa_north', label: 'North Africa (Maghreb)' },
  { value: 'africa_west', label: 'West Africa (CEDEAO)' },
  { value: 'mena', label: 'Middle East' },
  { value: 'america', label: 'Americas' },
  { value: 'asia', label: 'Asia Pacific' },
  { value: 'domestic', label: 'Domestic Market Only' }
];

// Step Components
function Step1CompanyInfo({ 
  data, 
  onUpdate, 
  isValid 
}: { 
  data: CompanyInfo; 
  onUpdate: (data: CompanyInfo) => void;
  isValid: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
        <p className="text-gray-600 mt-2">Tell us about your organization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Names */}
        <div className="space-y-4 md:col-span-2">
          <Label className="text-base font-semibold">Company Name *</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="nameAr" className="text-sm text-gray-600">Arabic (العربية)</Label>
              <Input
                id="nameAr"
                value={data.companyNameAr}
                onChange={(e) => onUpdate({ ...data, companyNameAr: e.target.value })}
                placeholder="اسم الشركة"
                dir="rtl"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="nameFr" className="text-sm text-gray-600">French (Français)</Label>
              <Input
                id="nameFr"
                value={data.companyNameFr}
                onChange={(e) => onUpdate({ ...data, companyNameFr: e.target.value })}
                placeholder="Nom de l'entreprise"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="nameEn" className="text-sm text-gray-600">English</Label>
              <Input
                id="nameEn"
                value={data.companyNameEn}
                onChange={(e) => onUpdate({ ...data, companyNameEn: e.target.value })}
                placeholder="Company Name"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Registration Numbers */}
        <div>
          <Label htmlFor="regNumber" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Registration Number (RC) *
          </Label>
          <Input
            id="regNumber"
            value={data.registrationNumber}
            onChange={(e) => onUpdate({ ...data, registrationNumber: e.target.value })}
            placeholder="00/00-0000000000AA00"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="taxId">Tax ID (NIF) *</Label>
          <Input
            id="taxId"
            value={data.taxId}
            onChange={(e) => onUpdate({ ...data, taxId: e.target.value })}
            placeholder="000000001234567"
            className="mt-1"
          />
        </div>

        {/* Industry Selection */}
        <div className="md:col-span-2">
          <Label>Industry Sector *</Label>
          <Select value={data.industry} onValueChange={(value) => onUpdate({ ...data, industry: value })}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry.value} value={industry.value}>
                  <span className="flex items-center gap-2">
                    <industry.icon className="w-4 h-4" />
                    {industry.label} ({industry.labelAr})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <Label className="text-base font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Registered Address
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="md:col-span-2">
              <Input
                value={data.address.street}
                onChange={(e) => onUpdate({ ...data, address: { ...data.address, street: e.target.value } })}
                placeholder="Street Address"
              />
            </div>
            <div>
              <Input
                value={data.address.city}
                onChange={(e) => onUpdate({ ...data, address: { ...data.address, city: e.target.value } })}
                placeholder="City"
              />
            </div>
            <div>
              <Select
                value={data.address.wilayaCode}
                onValueChange={(value) => onUpdate({ ...data, address: { ...data.address, wilayaCode: value } })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wilaya" />
                </SelectTrigger>
                <SelectContent>
                  {WILAYAS.map((w) => (
                    <SelectItem key={w.code} value={w.code}>
                      {w.name} ({w.nameAr}) - {w.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                value={data.address.postalCode}
                onChange={(e) => onUpdate({ ...data, address: { ...data.address, postalCode: e.target.value } })}
                placeholder="Postal Code"
              />
            </div>
          </div>
        </div>

        {/* Contact Person */}
        <div className="md:col-span-2">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />
            Primary Contact Person
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <Input
                value={data.contactPerson.name}
                onChange={(e) => onUpdate({ ...data, contactPerson: { ...data.contactPerson, name: e.target.value } })}
                placeholder="Full Name *"
              />
            </div>
            <div>
              <Input
                value={data.contactPerson.position}
                onChange={(e) => onUpdate({ ...data, contactPerson: { ...data.contactPerson, position: e.target.value } })}
                placeholder="Position/Title *"
              />
            </div>
            <div>
              <Input
                type="email"
                value={data.contactPerson.email}
                onChange={(e) => onUpdate({ ...data, contactPerson: { ...data.contactPerson, email: e.target.value } })}
                placeholder="Email Address *"
              />
            </div>
            <div>
              <Input
                type="tel"
                value={data.contactPerson.phone}
                onChange={(e) => onUpdate({ ...data, contactPerson: { ...data.contactPerson, phone: e.target.value } })}
                placeholder="Phone (+213 XXX XXX XXXX) *"
              />
            </div>
          </div>
        </div>

        {/* Website (Optional) */}
        <div className="md:col-span-2">
          <Label htmlFor="website" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Website (Optional)
          </Label>
          <Input
            id="website"
            type="url"
            value={data.website || ''}
            onChange={(e) => onUpdate({ ...data, website: e.target.value })}
            placeholder="https://www.example.com"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}

function Step2ProductSelection({
  data,
  industry,
  onUpdate,
  isValid
}: {
  data: ProductCategorySelection;
  industry: string;
  onUpdate: (data: ProductCategorySelection) => void;
  isValid: boolean;
}) {
  const availableCategories = PRODUCT_CATEGORIES.filter(
    (cat) => cat.industry === industry || (Array.isArray(cat.industry) && cat.industry.includes(industry))
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Product Categories</h2>
        <p className="text-gray-600 mt-2">Select the product types you want to track</p>
      </div>

      {/* Primary Category */}
      <div>
        <Label className="text-base font-semibold">Primary Category *</Label>
        <Select value={data.primaryCategory} onValueChange={(value) => onUpdate({ ...data, primaryCategory: value })}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select primary category" />
          </SelectTrigger>
          <SelectContent>
            {availableCategories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sub Categories (Multi-select simulation) */}
      <div>
        <Label className="text-base font-semibold">Additional Categories (Optional)</Label>
        <p className="text-sm text-gray-500 mt-1">Select all that apply</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {availableCategories
            .filter((cat) => cat.value !== data.primaryCategory)
            .map((cat) => (
              <div
                key={cat.value}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  data.subCategories.includes(cat.value)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  const updated = data.subCategories.includes(cat.value)
                    ? data.subCategories.filter((c) => c !== cat.value)
                    : [...data.subCategories, cat.value];
                  onUpdate({ ...data, subCategories: updated });
                }}
              >
                <div className="flex items-center gap-2">
                  <Checkbox checked={data.subCategories.includes(cat.value)} readOnly />
                  <span className="text-sm">{cat.label}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <Separator />

      {/* Estimated Products */}
      <div>
        <Label htmlFor="estimatedProducts">Estimated Number of SKUs *</Label>
        <Select
          value={String(data.estimatedProducts)}
          onValueChange={(value) => onUpdate({ ...data, estimatedProducts: parseInt(value) })}
        >
          <SelectTrigger className="mt-2 max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">1-10 products</SelectItem>
            <SelectItem value="50">11-50 products</SelectItem>
            <SelectItem value="100">51-100 products</SelectItem>
            <SelectItem value="250">101-250 products</SelectItem>
            <SelectItem value="500">251-500 products</SelectItem>
            <SelectItem value="1000">500+ products</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Special Requirements */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Special Tracking Requirements</Label>
        
        <div className="flex items-start gap-3 p-4 border rounded-lg">
          <Checkbox
            id="coldChain"
            checked={data.requiresColdChain}
            onCheckedChange={(checked) => onUpdate({ ...data, requiresColdChain: !!checked })}
            className="mt-1"
          />
          <div>
            <Label htmlFor="coldChain" className="cursor-pointer font-medium">
              Cold Chain Monitoring
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              Track temperature and humidity for temperature-sensitive products (pharmaceuticals, food)
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 border rounded-lg">
          <Checkbox
            id="organicTracking"
            checked={data.requiresOrganicTracking}
            onCheckedChange={(checked) => onUpdate({ ...data, requiresOrganicTracking: !!checked })}
            className="mt-1"
          />
          <div>
            <Label htmlFor="organicTracking" className="cursor-pointer font-medium">
              Organic Certification Tracking
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              Integrate organic certification (ONSSA, ECOCERT) and PGI labeling
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Export Markets */}
      <div>
        <Label className="text-base font-semibold">Target Export Markets</Label>
        <p className="text-sm text-gray-500 mt-1">Select your export destinations (helps configure certificates)</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {EXPORT_MARKETS.map((market) => (
            <Badge
              key={market.value}
              variant={data.exportTargetMarkets.includes(market.value) ? 'default' : 'outline'}
              className={`cursor-pointer py-2 px-4 ${
                data.exportTargetMarkets.includes(market.value)
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => {
                const updated = data.exportTargetMarkets.includes(market.value)
                  ? data.exportTargetMarkets.filter((m) => m !== market.value)
                  : [...data.exportTargetMarkets, market.value];
                onUpdate({ ...data, exportTargetMarkets: updated });
              }}
            >
              {market.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3Integration({
  data,
  onUpdate,
  isValid
}: {
  data: IntegrationMethod;
  onUpdate: (data: IntegrationMethod) => void;
  isValid: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
          <Code className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Integration Method</h2>
        <p className="text-gray-600 mt-2">Choose how you want to connect to AlgeriaTrack.dz</p>
      </div>

      {/* Integration Method Selection */}
      <div>
        <Label className="text-base font-semibold">How would you like to integrate? *</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* API Option */}
          <Card
            className={`cursor-pointer transition-all ${
              data.method === 'api' ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' : 'hover:border-gray-300'
            }`}
            onClick={() => onUpdate({ ...data, method: 'api' })}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <Zap className="w-10 h-10 mx-auto mb-3 text-purple-600" />
                <h3 className="font-semibold">API Integration</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Direct REST API access for custom integrations
                </p>
                <ul className="text-xs text-left text-gray-600 mt-3 space-y-1">
                  <li>✓ Full control over data flow</li>
                  <li>✓ Real-time synchronization</li>
                  <li>✓ Requires development resources</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Manual Option */}
          <Card
            className={`cursor-pointer transition-all ${
              data.method === 'manual' ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' : 'hover:border-gray-300'
            }`}
            onClick={() => onUpdate({ ...data, method: 'manual' })}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <Package className="w-10 h-10 mx-auto mb-3 text-purple-600" />
                <h3 className="font-semibold">Manual Entry</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Use our web portal and mobile scanner app
                </p>
                <ul className="text-xs text-left text-gray-600 mt-3 space-y-1">
                  <li>✓ No coding required</li>
                  <li>✓ Quick setup (same day)</li>
                  <li>✓ Mobile scanning included</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* ERP Option */}
          <Card
            className={`cursor-pointer transition-all ${
              data.method === 'erp' ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' : 'hover:border-gray-300'
            }`}
            onClick={() => onUpdate({ ...data, method: 'erp' })}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="w-10 h-10 mx-auto mb-3 text-purple-600" />
                <h3 className="font-semibold">ERP Integration</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Connect directly to your existing ERP system
                </p>
                <ul className="text-xs text-left text-gray-600 mt-3 space-y-1">
                  <li>✓ Automated data sync</li>
                  <li>✓ Pre-built connectors</li>
                  <li>✓ SAP, Odoo, Dynamics...</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ERP Type Selection (if ERP chosen) */}
      {data.method === 'erp' && (
        <div>
          <Label htmlFor="erpType">ERP System Type *</Label>
          <Select value={data.erpType || ''} onValueChange={(value) => onUpdate({ ...data, erpType: value })}>
            <SelectTrigger className="mt-2 max-w-md">
              <SelectValue placeholder="Select your ERP system" />
            </SelectTrigger>
            <SelectContent>
              {ERP_SYSTEMS.map((erp) => (
                <SelectItem key={erp.value} value={erp.value}>
                  {erp.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Webhook URL (for API/ERP) */}
      {(data.method === 'api' || data.method === 'erp') && (
        <div>
          <Label htmlFor="webhookUrl" className="flex items-center gap-2">
            Webhook Endpoint URL
            <span className="text-xs text-gray-500">(Optional - for real-time notifications)</span>
          </Label>
          <Input
            id="webhookUrl"
            type="url"
            value={data.webhookUrl || ''}
            onChange={(e) => onUpdate({ ...data, webhookUrl: e.target.value })}
            placeholder="https://your-domain.com/webhooks/algeriatrack"
            className="mt-2 max-w-lg"
          />
          <p className="text-xs text-gray-500 mt-1">
            We'll send real-time event notifications to this URL
          </p>
        </div>
      )}

      {/* Existing Systems */}
      <div>
        <Label className="text-base font-semibold">Existing Systems (Optional)</Label>
        <p className="text-sm text-gray-500 mt-1">What systems do you currently use?</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {['Inventory Management', 'WMS', 'MES', 'QMS', 'TMS', 'Custom Database', 'Excel/Spreadsheets'].map((system) => (
            <Badge
              key={system}
              variant={data.existingSystems.includes(system) ? 'default' : 'outline'}
              className={`cursor-pointer py-2 px-4 ${
                data.existingSystems.includes(system)
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => {
                const updated = data.existingSystems.includes(system)
                  ? data.existingSystems.filter((s) => s !== system)
                  : [...data.existingSystems, system];
                onUpdate({ ...data, existingSystems: updated });
              }}
            >
              {system}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Technical Contact */}
      <div>
        <Label className="text-base font-semibold flex items-center gap-2">
          <Users className="w-4 h-4" />
          Technical Contact Person
        </Label>
        <p className="text-sm text-gray-500 mt-1">
          {data.method === 'manual'
            ? 'Who will be the main administrator of the account?'
            : 'Who will handle the technical integration?'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <Input
            value={data.technicalContact.name}
            onChange={(e) => onUpdate({ ...data, technicalContact: { ...data.technicalContact, name: e.target.value } })}
            placeholder="Full Name *"
          />
          <Input
            value={data.technicalContact.position ? data.technicalContact.position : ''}
            onChange={(e) => onUpdate({ ...data, technicalContact: { ...data.technicalContact, position: e.target.value } })}
            placeholder="Position/Title"
          />
          <Input
            type="email"
            value={data.technicalContact.email}
            onChange={(e) => onUpdate({ ...data, technicalContact: { ...data.technicalContact, email: e.target.value } })}
            placeholder="Email Address *"
          />
          <Input
            type="tel"
            value={data.technicalContact.phone}
            onChange={(e) => onUpdate({ ...data, technicalContact: { ...data.technicalContact, phone: e.target.value } })}
            placeholder="Phone Number *"
          />
        </div>
      </div>
    </div>
  );
}

function Step4StaffCreation({
  data,
  onUpdate,
  isValid
}: {
  data: StaffUser[];
  onUpdate: (data: StaffUser[]) => void;
  isValid: boolean;
}) {
  const [newUser, setNewUser] = useState<StaffUser>({
    name: '',
    email: '',
    role: '',
    department: ''
  });

  const addUser = () => {
    if (newUser.name && newUser.email && newUser.role) {
      onUpdate([...data, { ...newUser }]);
      setNewUser({ name: '', email: '', role: '', department: '' });
    }
  };

  const removeUser = (index: number) => {
    onUpdate(data.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
        <p className="text-gray-600 mt-2">Add staff members who will use the platform</p>
      </div>

      {/* Add User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Team Member</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              placeholder="Full Name *"
            />
            <Input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="Email Address *"
            />
            <Select
              value={newUser.role}
              onValueChange={(value) => setNewUser({ ...newUser, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Role *" />
              </SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={newUser.department}
              onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
              placeholder="Department"
            />
          </div>
          <Button
            onClick={addUser}
            disabled={!newUser.name || !newUser.email || !newUser.role}
            className="mt-4"
            variant="outline"
          >
            Add User
          </Button>
        </CardContent>
      </Card>

      {/* Users List */}
      {data.length > 0 && (
        <div>
          <Label className="text-base font-semibold">
            Added Team Members ({data.length})
          </Label>
          <div className="mt-3 space-y-3 max-h-80 overflow-y-auto">
            {data.map((user, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-medium">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {STAFF_ROLES.find(r => r.value === user.role)?.label || user.role}
                  </Badge>
                  {user.department && (
                    <span className="text-sm text-gray-500">{user.department}</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUser(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Minimum Requirement Notice */}
      {data.length < 3 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Minimum 3 team members recommended</p>
            <p className="text-sm text-amber-700 mt-1">
              For a successful pilot, we recommend adding at least:
            </p>
            <ul className="text-sm text-amber-700 mt-1 list-disc list-inside">
              <li>1 System Administrator</li>
              <li>1 Warehouse Operator / QC Inspector</li>
              <li>1 Manager (for dashboard access)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Step5TestingVerification({
  data,
  onUpdate,
  onSubmit,
  isSubmitting
}: {
  data: TestingConfig;
  onUpdate: (data: TestingConfig) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Testing & Verification</h2>
        <p className="text-gray-600 mt-2">Configure your pilot program parameters</p>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="startDate">Pilot Start Date *</Label>
          <Input
            id="startDate"
            type="date"
            value={data.startDate}
            onChange={(e) => onUpdate({ ...data, startDate: e.target.value })}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="goLiveDate">Go-Live Date (Day 7) *</Label>
          <Input
            id="goLiveDate"
            type="date"
            value={data.goLiveDate}
            onChange={(e) => onUpdate({ ...data, goLiveDate: e.target.value })}
            className="mt-2"
          />
        </div>
      </div>

      {/* Test Batch Size */}
      <div>
        <Label htmlFor="testBatchSize">Test Batch Size *</Label>
        <p className="text-sm text-gray-500 mt-1">
          How many products/SKUs will you include in the initial test batch?
        </p>
        <Select
          value={String(data.testBatchSize)}
          onValueChange={(value) => onUpdate({ ...data, testBatchSize: parseInt(value) })}
        >
          <SelectTrigger className="mt-2 max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 products (minimum)</SelectItem>
            <SelectItem value="10">10 products</SelectItem>
            <SelectItem value="25">25 products</SelectItem>
            <SelectItem value="50">50 products (recommended)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Success Criteria */}
      <div>
        <Label className="text-base font-semibold">Success Criteria (KPI Targets)</Label>
        <p className="text-sm text-gray-500 mt-1">
          Define what success looks like for your pilot program
        </p>
        
        <div className="space-y-6 mt-4">
          {/* Tracking Coverage */}
          <div>
            <div className="flex justify-between mb-2">
              <Label>Tracking Coverage Target</Label>
              <span className="font-medium">{data.successCriteria.trackingCoverage}%</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Percentage of products with complete supply chain events logged
            </p>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={data.successCriteria.trackingCoverage}
              onChange={(e) => onUpdate({
                ...data,
                successCriteria: {
                  ...data.successCriteria,
                  trackingCoverage: parseInt(e.target.value)
                }
              })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>50%</span>
              <span>Recommended: 80%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Event Accuracy */}
          <div>
            <div className="flex justify-between mb-2">
              <Label>Event Accuracy Target</Label>
              <span className="font-medium">{data.successCriteria.eventAccuracy}%</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Percentage of events logged correctly without errors
            </p>
            <input
              type="range"
              min="90"
              max="100"
              step="1"
              value={data.successCriteria.eventAccuracy}
              onChange={(e) => onUpdate({
                ...data,
                successCriteria: {
                  ...data.successCriteria,
                  eventAccuracy: parseInt(e.target.value)
                }
              })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>90%</span>
              <span>Recommended: 99%</span>
              <span>100%</span>
            </div>
          </div>

          {/* User Adoption */}
          <div>
            <div className="flex justify-between mb-2">
              <Label>User Adoption Target</Label>
              <span className="font-medium">{data.successCriteria.userAdoption}%</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Percentage of trained staff actively using the platform daily
            </p>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={data.successCriteria.userAdoption}
              onChange={(e) => onUpdate({
                ...data,
                successCriteria: {
                  ...data.successCriteria,
                  userAdoption: parseInt(e.target.value)
                }
              })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>50%</span>
              <span>Recommended: 85%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-lg text-green-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Ready to Start Your Pilot!
          </CardTitle>
          <CardDescription className="text-green-700">
            Review your settings and submit to begin the 14-day pilot program
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-700">14</p>
              <p className="text-sm text-green-600">Days Duration</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{data.testBatchSize}</p>
              <p className="text-sm text-green-600">Test Products</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{data.startDate || 'TBD'}</p>
              <p className="text-sm text-green-600">Start Date</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{data.goLiveDate || 'TBD'}</p>
              <p className="text-sm text-green-600">Go-Live Date</p>
            </div>
          </div>
          
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Your Pilot Program...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Submit & Start Pilot Program
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Wizard Component
export function PilotOnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    companyInfo: {
      companyNameAr: '',
      companyNameFr: '',
      companyNameEn: '',
      registrationNumber: '',
      taxId: '',
      industry: '',
      address: {
        street: '',
        city: '',
        wilayaCode: '',
        postalCode: ''
      },
      contactPerson: {
        name: '',
        email: '',
        phone: '',
        position: ''
      }
    },
    productSelection: {
      primaryCategory: '',
      subCategories: [],
      estimatedProducts: 50,
      requiresColdChain: false,
      requiresOrganicTracking: false,
      exportTargetMarkets: []
    },
    integration: {
      method: 'manual',
      technicalContact: {
        name: '',
        email: '',
        phone: ''
      },
      existingSystems: []
    },
    staffUsers: [],
    testing: {
      testBatchSize: 10,
      testProducts: [],
      startDate: '',
      goLiveDate: '',
      successCriteria: {
        trackingCoverage: 80,
        eventAccuracy: 99,
        userAdoption: 85
      }
    }
  });

  const steps = [
    { title: 'Company Info', icon: Building2 },
    { title: 'Products', icon: Package },
    { title: 'Integration', icon: Code },
    { title: 'Team', icon: Users },
    { title: 'Launch', icon: CheckCircle2 }
  ];

  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0:
        return !!(
          onboardingData.companyInfo.companyNameFr &&
          onboardingData.companyInfo.registrationNumber &&
          onboardingData.companyInfo.taxId &&
          onboardingData.companyInfo.industry &&
          onboardingData.companyInfo.contactPerson.name &&
          onboardingData.companyInfo.contactPerson.email
        );
      case 1:
        return !!onboardingData.productSelection.primaryCategory;
      case 2:
        if (onboardingData.integration.method === 'erp') {
          return !!onboardingData.integration.erpType;
        }
        return true;
      case 3:
        return onboardingData.staffUsers.length >= 1; // At least 1 user required
      case 4:
        return !!(onboardingData.testing.startDate && onboardingData.testing.goLiveDate);
      default:
        return false;
    }
  };

  const canProceed = validateStep(currentStep);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/blockchain/pilot/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingData)
      });

      if (!response.ok) {
        throw new Error('Failed to create pilot program');
      }

      const result = await response.json();
      
      // Redirect or show success
      window.location.href = `/admin/blockchain-pilot?success=true&pilot=${result.pilotId}`;
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Blockchain Pilot Onboarding</h1>
          <Badge variant="outline" className="text-sm">
            Step {currentStep + 1} of {steps.length}
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
        
        {/* Step Indicators */}
        <div className="flex justify-between mt-4">
          {steps.map((step, index) => (
            <button
              key={step.title}
              onClick={() => index <= currentStep && setCurrentStep(index)}
              className={`flex flex-col items-center gap-1 ${
                index <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index < currentStep
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <span className={`text-xs ${index === currentStep ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>
                {step.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 0 && (
            <Step1CompanyInfo
              data={onboardingData.companyInfo}
              onUpdate={(companyInfo) =>
                setOnboardingData({ ...onboardingData, companyInfo })
              }
              isValid={validateStep(0)}
            />
          )}
          
          {currentStep === 1 && (
            <Step2ProductSelection
              data={onboardingData.productSelection}
              industry={onboardingData.companyInfo.industry}
              onUpdate={(productSelection) =>
                setOnboardingData({ ...onboardingData, productSelection })
              }
              isValid={validateStep(1)}
            />
          )}
          
          {currentStep === 2 && (
            <Step3Integration
              data={onboardingData.integration}
              onUpdate={(integration) =>
                setOnboardingData({ ...onboardingData, integration })
              }
              isValid={validateStep(2)}
            />
          )}
          
          {currentStep === 3 && (
            <Step4StaffCreation
              data={onboardingData.staffUsers}
              onUpdate={(staffUsers) =>
                setOnboardingData({ ...onboardingData, staffUsers })
              }
              isValid={validateStep(3)}
            />
          )}
          
          {currentStep === 4 && (
            <Step5TestingVerification
              data={onboardingData.testing}
              onUpdate={(testing) =>
                setOnboardingData({ ...onboardingData, testing })
              }
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default PilotOnboardingWizard;
