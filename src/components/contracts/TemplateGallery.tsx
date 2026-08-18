'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  Package,
  Wrench,
  Truck,
  Shield,
  Lock,
  Handshake,
  Search,
  ArrowRight,
  Eye,
  Star,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import type { ContractType } from '@/lib/contracts';
import { CONTRACT_TYPES } from '@/lib/contracts/config';

interface TemplateGalleryProps {
  onSelectTemplate?: (type: ContractType) => void;
  compact?: boolean;
}

const TEMPLATE_ICONS: Record<ContractType, React.ReactNode> = {
  SALES_AGREEMENT: <FileText className="w-8 h-8" />,
  SUPPLY_CONTRACT: <Package className="w-8 h-8" />,
  SERVICE_AGREEMENT: <Wrench className="w-8 h-8" />,
  DISTRIBUTION_AGREEMENT: <Truck className="w-8 h-8" />,
  NON_DISCLOSURE: <Shield className="w-8 h-8" />,
  EXCLUSIVITY: <Lock className="w-8 h-8" />,
  FRAMEWORK_AGREEMENT: <Handshake className="w-8 h-8" />,
};

const TEMPLATE_COLORS: Record<ContractType, string> = {
  SALES_AGREEMENT: 'from-blue-500 to-blue-600',
  SUPPLY_CONTRACT: 'from-green-500 to-green-600',
  SERVICE_AGREEMENT: 'from-purple-500 to-purple-600',
  DISTRIBUTION_AGREEMENT: 'from-orange-500 to-orange-600',
  NON_DISCLOSURE: 'from-red-500 to-red-600',
  EXCLUSIVITY: 'from-indigo-500 to-indigo-600',
  FRAMEWORK_AGREEMENT: 'from-teal-500 to-teal-600',
};

export function TemplateGallery({ onSelectTemplate, compact = false }: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<ContractType | null>(null);

  const filteredTemplates = Object.values(CONTRACT_TYPES).filter((template) => {
    const matchesSearch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.nameAr.includes(searchQuery) ||
      template.nameFr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || template.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  if (compact) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.map((template) => (
          <button
            key={template.type}
            onClick={() => onSelectTemplate?.(template.type)}
            className="p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <div
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${TEMPLATE_COLORS[template.type]} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}
            >
              {TEMPLATE_ICONS[template.type]}
            </div>
            <h3 className="font-medium text-sm">{template.name}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {template.description}
            </p>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates... / ابحث في القوالب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="SALES">Sales / البيع</SelectItem>
            <SelectItem value="PARTNERSHIP">Partnership / شراكة</SelectItem>
            <SelectItem value="SERVICE">Service / خدمات</SelectItem>
            <SelectItem value="PROTECTION">Protection / حماية</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card
            key={template.type}
            className="overflow-hidden group hover:shadow-lg transition-all duration-300"
          >
            {/* Colored Header */}
            <div
              className={`h-24 bg-gradient-to-br ${TEMPLATE_COLORS[template.type]} relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                    {TEMPLATE_ICONS[template.type]}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{template.name}</h3>
                    <p className="text-sm text-white/80">{template.nameAr}</p>
                  </div>
                </div>
              </div>
            </div>

            <CardHeader className="pb-3">
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-3 space-y-3">
              {/* Meta Info */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  {template.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {template.defaultDurationDays} days
                </Badge>
                {template.requiresOrder && (
                  <Badge variant="outline" className="text-xs">
                    Requires Order
                  </Badge>
                )}
              </div>

              {/* Features Preview */}
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  <span>Algerian Law Compliant</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  <span>Bilingual (AR/FR)</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  <span>E-Signature Ready</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setPreviewTemplate(template.type)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {TEMPLATE_ICONS[template.type]}
                      {template.name}
                    </DialogTitle>
                    <DialogDescription>{template.descriptionFr}</DialogDescription>
                  </DialogHeader>
                  <TemplateDetails template={template} />
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setPreviewTemplate(null)}
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        onSelectTemplate?.(template.type);
                        setPreviewTemplate(null);
                      }}
                    >
                      Use This Template
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                size="sm"
                className="flex-1"
                onClick={() => onSelectTemplate?.(template.type)}
              >
                <Star className="w-4 h-4 mr-1" />
                Select
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No templates found</p>
          <p className="text-sm">No matching templates for your search</p>
          <p className="text-sm">لم يتم العثور على قوالب مطابقة لبحثك</p>
        </div>
      )}
    </div>
  );
}

// Template Details Component
function TemplateDetails({ template }: { template: (typeof CONTRACT_TYPES)[ContractType] }) {
  return (
    <div className="space-y-6 py-4">
      {/* Bilingual Names */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
        <div>
          <p className="text-xs text-muted-foreground mb-1">English</p>
          <p className="font-medium">{template.name}</p>
        </div>
        <div dir="rtl">
          <p className="text-xs text-muted-foreground mb-1">العربية</p>
          <p className="font-medium">{template.nameAr}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Français</p>
          <p className="font-medium">{template.nameFr}</p>
        </div>
      </div>

      {/* Description in all languages */}
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium mb-1">Description</h4>
          <p className="text-sm text-muted-foreground">{template.description}</p>
        </div>
        <div dir="rtl">
          <h4 className="text-sm font-medium mb-1">الوصف</h4>
          <p className="text-sm text-muted-foreground">{template.descriptionAr}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-1">Description</h4>
          <p className="text-sm text-muted-foreground italic">
            {template.descriptionFr}
          </p>
        </div>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">Default Duration</p>
          <p className="font-semibold">{template.defaultDurationDays} days</p>
        </div>
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">Requires Order</p>
          <p className="font-semibold">
            {template.requiresOrder ? 'Yes' : 'No'}
          </p>
        </div>
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">Category</p>
          <p className="font-semibold">{template.category}</p>
        </div>
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">Icon</p>
          <p className="font-semibold capitalize">{template.icon}</p>
        </div>
      </div>

      {/* Standard Clauses Included */}
      <div>
        <h4 className="text-sm font-medium mb-3">Standard Clauses Included</h4>
        <div className="flex flex-wrap gap-2">
          {[
            'Parties Identification',
            'Subject Matter',
            'Payment Terms',
            'Delivery Terms',
            'Warranty Provisions',
            'Confidentiality',
            'Dispute Resolution',
            'Governing Law (Algerian)',
            'E-Signature Validity',
          ].map((clause) => (
            <Badge key={clause} variant="secondary" className="text-xs">
              {clause}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TemplateGallery;
