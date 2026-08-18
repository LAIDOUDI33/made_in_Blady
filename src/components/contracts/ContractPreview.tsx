'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Download,
  Printer,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Languages,
  Scale,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
} from 'lucide-react';
import type { Contract, ContractClause } from '@/lib/contracts';

interface ContractPreviewProps {
  contract: Contract;
  onSign?: () => void;
  onDownload?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export function ContractPreview({
  contract,
  onSign,
  onDownload,
  onEdit,
  showActions = true,
  compact = false,
}: ContractPreviewProps) {
  const [activeLanguage, setActiveLanguage] = useState<'fr' | 'ar' | 'both'>('both');
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set());
  const [showFullContent, setShowFullContent] = useState(true);

  const toggleClause = (clauseId: string) => {
    setExpandedClauses((prev) => {
      const next = new Set(prev);
      if (next.has(clauseId)) {
        next.delete(clauseId);
      } else {
        next.add(clauseId);
      }
      return next;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING_SIGNATURE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatDate = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (compact) {
    return (
      <Card className="overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold line-clamp-1">{contract.subject}</h3>
              <p className="text-sm text-muted-foreground">{contract.contractNumber}</p>
            </div>
            <Badge variant="outline" className={getStatusColor(contract.status)}>
              {contract.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {new Intl.NumberFormat().format(contract.totalValue)} {contract.currency}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(contract.effectiveDate)}
            </span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className={compact ? 'p-4' : ''}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {contract.subjectFr || contract.subject}
              </CardTitle>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{contract.contractNumber}</span>
                <Badge variant="outline" className={getStatusColor(contract.status)}>
                  {contract.status.replace(/_/g, ' ')}
                </Badge>
                <span className="flex items-center gap-1">
                  <Languages className="w-3 h-3" />
                  {contract.language}
                </span>
              </div>
            </div>

            {showActions && (
              <div className="flex gap-2">
                {onEdit && contract.status === 'DRAFT' && (
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    Edit
                  </Button>
                )}
                {onSign && contract.status !== 'SIGNED' && (
                  <Button size="sm" onClick={onSign}>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Sign
                  </Button>
                )}
                {onDownload && (
                  <Button variant="outline" size="sm" onClick={onDownload}>
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Card>
        <CardContent className="p-6">
          {/* Language Toggle */}
          <div className="flex justify-end mb-4">
            <Tabs value={activeLanguage} onValueChange={(v) => setActiveLanguage(v as typeof activeLanguage)}>
              <TabsList>
                <TabsTrigger value="fr">Français</TabsTrigger>
                <TabsTrigger value="ar">العربية</TabsTrigger>
                <TabsTrigger value="both">Bilingual</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Effective Date</p>
                <p className="font-medium">{formatDate(contract.effectiveDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="font-medium">
                  {new Intl.NumberFormat('fr-DZ').format(contract.totalValue)} {contract.currency}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium">{contract.contractType.replace(/_/g, ' ')}</p>
              </div>
            </div>
          </div>

          {/* Parties Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Parties / الأطراف
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PartyCard party={contract.partyA} label="PARTY A - Supplier" labelAr="الطرف أ - المورد" color="blue" />
              <PartyCard party={contract.partyB} label="PARTY B - Buyer" labelAr="الطرف ب - المشتري" color="orange" />
            </div>
          </div>

          <Separator className="my-6" />

          {/* Clauses Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Contract Clauses / البنود
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullContent(!showFullContent)}
              >
                {showFullContent ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showFullContent ? 'Collapse' : 'Expand'}
              </Button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {[...contract.clauses, ...contract.customClauses].map((clause, index) => (
                <ClauseItem
                  key={`${clause.id}-${index}`}
                  clause={clause}
                  isExpanded={expandedClauses.has(clause.id)}
                  onToggle={() => toggleClause(clause.id)}
                  showContent={showFullContent}
                  language={activeLanguage}
                />
              ))}
            </div>
          </div>

          {/* Signature Status */}
          {(contract.partyASignedAt || contract.partyBSignedAt) && (
            <>
              <Separator className="my-6" />
              <div>
                <h3 className="text-lg font-semibold mb-4">Signature Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SignatureStatus
                    partyLabel="Party A"
                    signedAt={contract.partyASignedAt}
                    signatureUrl={contract.partyASignatureUrl}
                    representativeName={contract.partyA?.representativeName}
                  />
                  <SignatureStatus
                    partyLabel="Party B"
                    signedAt={contract.partyBSignedAt}
                    signatureUrl={contract.partyBSignatureUrl}
                    representativeName={contract.partyB?.representativeName}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-components
function PartyCard({
  party,
  label,
  labelAr,
  color,
}: {
  party: any;
  label: string;
  labelAr: string;
  color: 'blue' | 'orange';
}) {
  const bgColor = color === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200';
  const textColor = color === 'blue' ? 'text-blue-700' : 'text-orange-700';

  return (
    <div className={`p-4 rounded-lg border ${bgColor}`}>
      <h4 className={`font-semibold ${textColor} mb-3`}>{label}</h4>
      <p className="text-xs text-muted-foreground mb-3">{labelAr}</p>
      <dl className="space-y-1 text-sm">
        <div>
          <dt className="text-muted-foreground">Company:</dt>
          <dd className="font-medium">{party?.companyName || '-'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Representative:</dt>
          <dd className="font-medium">
            {party?.representativeName} ({party?.representativeTitle})
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Email:</dt>
          <dd>{party?.email || '-'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">NRC:</dt>
          <dd>{party?.commercialRegister || '-'}</dd>
        </div>
      </dl>
    </div>
  );
}

function ClauseItem({
  clause,
  isExpanded,
  onToggle,
  showContent,
  language,
}: {
  clause: ContractClause;
  isExpanded: boolean;
  onToggle: () => void;
  showContent: boolean;
  language: 'fr' | 'ar' | 'both';
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-start justify-between bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">
              {language === 'ar' ? clause.titleAr : clause.title}
            </h4>
            {clause.isRequired && (
              <Badge variant="secondary" className="text-xs">
                Required
              </Badge>
            )}
          </div>
          {language !== 'ar' && (
            <p className="text-sm text-muted-foreground mt-1">{clause.titleFr}</p>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-4 h-4 shrink-0 mt-1" />
        )}
      </button>

      {isExpanded && showContent && (
        <div className="p-4 border-t bg-white space-y-4">
          {(language === 'fr' || language === 'both') && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-medium">
                Français
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{clause.contentFr}</p>
            </div>
          )}

          {(language === 'ar' || language === 'both') && (
            <div dir="rtl">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-medium">
                العربية
              </p>
              <p className="text-sm leading-loose whitespace-pre-wrap" style={{ fontFamily: 'Traditional Arabic, Arial, sans-serif' }}>
                {clause.contentAr}
              </p>
            </div>
          )}

          {language !== 'ar' && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-medium">
                English
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{clause.content}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SignatureStatus({
  partyLabel,
  signedAt,
  signatureUrl,
  representativeName,
}: {
  partyLabel: string;
  signedAt?: Date | null;
  signatureUrl?: string;
  representativeName?: string;
}) {
  const isSigned = !!signedAt;

  return (
    <div className={`p-4 rounded-lg border ${isSigned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        {isSigned ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
        )}
        <span className={`font-medium ${isSigned ? 'text-green-700' : 'text-gray-500'}`}>
          {partyLabel}
        </span>
      </div>
      {isSigned ? (
        <div className="text-sm text-green-700 space-y-1">
          <p>Signed by: {representativeName}</p>
          <p>Date: {formatDate(signedAt!)}</p>
          {signatureUrl && (
            <img src={signatureUrl} alt="Signature" className="mt-2 h-12 object-contain" />
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Pending signature</p>
      )}
    </div>
  );
}

export default ContractPreview;
