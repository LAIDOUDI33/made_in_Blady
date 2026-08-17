'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Printer,
  Eye,
  EyeOff,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import type { Contract, ContractClause } from '@/lib/contracts';

interface ContractPreviewProps {
  contract: Contract;
  onDownload?: () => void;
  onPrint?: () => void;
  language?: 'en' | 'ar' | 'fr';
}

export function ContractPreview({
  contract,
  onDownload,
  onPrint,
  language = 'en',
}: ContractPreviewProps) {
  const [showAllClauses, setShowAllClauses] = useState(false);
  const [visibleClauses, setVisibleClauses] = useState(3);

  const getLabel = (en: string, ar: string, fr: string) => {
    return language === 'ar' ? ar : language === 'fr' ? fr : en;
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    REVIEW: 'bg-blue-100 text-blue-700',
    PENDING_SIGNATURE: 'bg-yellow-100 text-yellow-700',
    SIGNED: 'bg-green-100 text-green-700',
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    EXPIRED: 'bg-gray-100 text-gray-500',
    TERMINATED: 'bg-red-100 text-red-700',
  };

  const displayedClauses = showAllClauses 
    ? (contract.clauses || []) 
    : (contract.clauses || []).slice(0, visibleClauses);

  return (
    <div className="space-y-4">
      {/* Preview Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{contract.contractNumber}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {getLabel('Contract Preview', 'معاينة العقد', 'Aperçu du contrat')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={statusColors[contract.status] || ''}>
                {contract.status}
              </Badge>
              <Badge variant="outline">v{contract.version}</Badge>
              
              {onDownload && (
                <Button variant="outline" size="sm" onClick={onDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              )}
              
              {onPrint && (
                <Button variant="outline" size="sm" onClick={onPrint}>
                  <Printer className="h-4 w-4 mr-1" />
                  {getLabel('Print', 'طباعة', 'Imprimer')}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Document Content */}
      <Card className="overflow-hidden">
        {/* Document Header */}
        <div className="bg-gradient-to-r from-green-800 to-green-600 text-white p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">🇩🇿 AlgeriaTrade.dz</h1>
          <p className="text-green-100 text-sm">
            منصة التجارة بين الشركات في الجزائر
          </p>
          <p className="mt-3 text-lg font-semibold">
            {contract.contractNumber}
          </p>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Parties Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Party A */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-red-700 mb-3 pb-2 border-b border-red-100">
                Party A - Supplier / البائع
              </h3>
              <PartyInfo party={contract.partyA} />
            </div>

            {/* Party B */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-blue-700 mb-3 pb-2 border-b border-blue-100">
                Party B - Buyer / المشتري
              </h3>
              <PartyInfo party={contract.partyB} />
            </div>
          </div>

          {/* Subject */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">
              Subject Matter / موضوع العقد / Objet du contrat
            </h3>
            <div className="bg-muted/50 p-3 rounded-md space-y-1">
              <p><strong>EN:</strong> {contract.subject}</p>
              <p dir="rtl" className="text-right"><strong>AR:</strong> {contract.subjectAr}</p>
              <p className="italic"><strong>FR:</strong> {contract.subjectFr}</p>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">
              Financial Terms / الشروط المالية / Conditions financières
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <FinancialItem 
                label={getLabel('Total Value', 'القيمة الإجمالية', 'Valeur totale')} 
                value={`${contract.totalValue.toLocaleString()} ${contract.currency}`}
              />
              <FinancialItem 
                label={getLabel('Currency', 'العملة', 'Devise')} 
                value={`${contract.currency} (DZD)`}
              />
              <FinancialItem 
                label={getLabel('Payment Terms', 'شروط الدفع', 'Paiement')} 
                value={contract.paymentTerms}
              />
              <FinancialItem 
                label={getLabel('Effective Date', 'تاريخ السريان', "Date d'effet")} 
                value={new Date(contract.effectiveDate).toLocaleDateString()}
              />
            </div>
            
            {contract.endDate && (
              <div className="mt-3">
                <FinancialItem 
                  label={getLabel('End Date', 'تاريخ الانتهاء', "Date de fin")} 
                  value={new Date(contract.endDate).toLocaleDateString()}
                  fullWidth
                />
              </div>
            )}
          </div>

          {/* Clauses */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">
              Contract Clauses / بنود العقد / Clauses du contrat
            </h3>
            
            <div className="space-y-3">
              {displayedClauses.map((clause, index) => (
                <ClausePreview key={clause.id} clause={clause} index={index + 1} />
              ))}
            </div>

            {/* Show More/Less */}
            {(contract.clauses?.length || 0) > visibleClauses && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowAllClauses(!showAllClauses)}
                  className="text-primary"
                >
                  {showAllClauses ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Show All ({(contract.clauses?.length || 0) - visibleClauses} more)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Signatures Section */}
          <div className="border-t pt-6 mt-6">
            <h3 className="font-semibold mb-4 text-center">
              Signatures / التوقيعات / Signatures
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <SignatureBlock
                partyLabel="Party A - Supplier"
                partyLabelAr="البائع"
                signedAt={contract.partyASignedAt}
                signatureUrl={contract.partyASignatureUrl}
              />
              
              <SignatureBlock
                partyLabel="Party B - Buyer"
                partyLabelAr="المشتري"
                signedAt={contract.partyBSignedAt}
                signatureUrl={contract.partyBSignatureUrl}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>Generated via AlgeriaTrade.dz platform</p>
            <p>Version {contract.version} • {new Date(contract.updatedAt).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-components
function PartyInfo({ party }: { party: any }) {
  if (!party) return <p className="text-muted-foreground text-sm">Not specified</p>;
  
  return (
    <div className="space-y-1 text-sm">
      <p className="font-medium">{party.companyName || '-'}</p>
      <p><span className="text-muted-foreground">Rep:</span> {party.representativeName || '-'} {party.representativeTitle && `(${party.representativeTitle})`}</p>
      <p><span className="text-muted-foreground">Email:</span> {party.email || '-'}</p>
      <p><span className="text-muted-foreground">Phone:</span> {party.phone || '-'}</p>
      <p><span className="text-muted-foreground">Address:</span> {party.address || '-'}</p>
      {party.commercialRegister && <p><span className="text-muted-foreground">NRC:</span> {party.commercialRegister}</p>}
      {party.taxId && <p><span className="text-muted-foreground">NIF:</span> {party.taxId}</p>}
    </div>
  );
}

function FinancialItem({ label, value, fullWidth = false }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={`bg-muted/50 p-3 rounded-md ${fullWidth ? 'col-span-full' : ''}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function ClausePreview({ clause, index }: { clause: ContractClause; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{index}. {clause.title}</span>
          <Badge variant="outline" className="text-xs">{clause.clauseType}</Badge>
          {clause.isRequired && (
            <CheckCircle2 className="h-3 w-3 text-orange-500" />
          )}
        </div>
        <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 border-t">
          <div className="p-2 bg-background rounded text-sm">
            <p className="font-medium text-xs text-muted-foreground mb-1">English</p>
            <p>{clause.content}</p>
          </div>
          <div className="p-2 bg-background rounded text-sm" dir="rtl">
            <p className="font-medium text-xs text-muted-foreground mb-1">العربية</p>
            <p>{clause.contentAr}</p>
          </div>
          <div className="p-2 bg-background rounded text-sm italic">
            <p className="font-medium text-xs text-muted-foreground mb-1">Français</p>
            <p>{clause.contentFr}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SignatureBlock({ 
  partyLabel, 
  partyLabelAr, 
  signedAt, 
  signatureUrl 
}: { 
  partyLabel: string; 
  partyLabelAr: string; 
  signedAt?: Date; 
  signatureUrl?: string;
}) {
  const isSigned = !!signedAt;

  return (
    <div className="text-center">
      <p className="font-medium mb-4">{partyLabel} / {partyLabelAr}</p>
      
      {signatureUrl ? (
        <img 
          src={signatureUrl} 
          alt="Signature" 
          className="max-h-20 mx-auto mb-2"
        />
      ) : (
        <div className="h-16 border-b-2 border-dashed border-gray-300 mb-2" />
      )}
      
      {isSigned ? (
        <div className="text-green-600 text-sm">
          <CheckCircle2 className="h-4 w-4 inline mr-1" />
          Signed on {new Date(signedAt).toLocaleDateString()}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">Pending signature</p>
      )}
    </div>
  );
}

export default ContractPreview;
