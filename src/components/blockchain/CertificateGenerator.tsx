'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type {
  Certificate,
  CertificateType,
  ProvenanceRecord,
  BatchCertificationInput
} from '@/lib/blockchain/types';
import { CERTIFICATE_TYPE_LABELS } from '@/lib/blockchain/types';
import {
  FileText,
  Download,
  Eye,
  QrCode,
  Plus,
  CheckCircle2,
  Loader2,
  Award,
  Shield,
  Stamp,
  Globe,
  Leaf,
  Moon,
  FileCheck,
  Ship,
  ClipboardCheck
} from 'lucide-react';

// Icon mapping for certificate types
const certificateIcons: Record<CertificateType, React.ElementType> = {
  authenticity: Shield,
  origin: Globe,
  quality: FileCheck,
  organic: Leaf,
  halal: Moon,
  iso: Award,
  export_license: Ship,
  customs_clearance: ClipboardCheck
};

interface CertificateGeneratorProps {
  availableRecords?: ProvenanceRecord[];
  onIssueCertificate?: (data: {
    provenanceId: string;
    type: CertificateType;
    issuer: { name: string; organization: string; title: string };
    expiryDate?: string;
    notes?: string;
  }) => Promise<Certificate | null>;
  onBatchCertify?: (input: BatchCertificationInput) => Promise<Certificate[]>;
  isProcessing?: boolean;
}

// Certificate preview component
function CertificatePreview({ 
  certificate, 
  record 
}: { 
  certificate: Partial<Certificate> & { type: CertificateType };
  record?: ProvenanceRecord;
}) {
  const Icon = certificateIcons[certificate.type] || FileText;
  
  return (
    <div className="border-2 border-dashed rounded-lg p-6 bg-gradient-to-br from-slate-50 to-white">
      {/* Certificate Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-3">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold tracking-wide">ALGERIATRADE.DZ</h2>
        <p className="text-sm text-muted-foreground">Blockchain Verified Certificate</p>
      </div>
      
      {/* Certificate Type */}
      <div className="text-center py-4 border-y border-dashed my-4">
        <Badge variant="outline" className="text-base px-4 py-1">
          {CERTIFICATE_TYPE_LABELS[certificate.type]}
        </Badge>
      </div>
      
      {/* Certificate Details */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between py-2 border-b border-dashed">
          <span className="text-muted-foreground">Certificate Number:</span>
          <span className="font-mono font-medium">
            {certificate.certificateNumber || 'AUTO-GENERATED'}
          </span>
        </div>
        
        <div className="flex justify-between py-2 border-b border-dashed">
          <span className="text-muted-foreground">Product:</span>
          <span className="font-medium">{record?.productName || 'N/A'}</span>
        </div>
        
        <div className="flex justify-between py-2 border-b border-dashed">
          <span className="text-muted-foreground">Batch:</span>
          <span className="font-mono">{record?.batchNumber || 'N/A'}</span>
        </div>
        
        <div className="flex justify-between py-2 border-b border-dashed">
          <span className="text-muted-foreground">Manufacturer:</span>
          <span>{record?.manufacturer.name || 'N/A'}</span>
        </div>
        
        <div className="flex justify-between py-2 border-b border-dashed">
          <span className="text-muted-foreground">Issued Date:</span>
          <span>{certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : new Date().toLocaleDateString()}</span>
        </div>
        
        {certificate.expiryDate && (
          <div className="flex justify-between py-2 border-b border-dashed">
            <span className="text-muted-foreground">Expiry Date:</span>
            <span>{new Date(certificate.expiryDate).toLocaleDateString()}</span>
          </div>
        )}
        
        <div className="py-2 border-b border-dashed">
          <span className="text-muted-foreground block mb-1">Issuer:</span>
          <p>{certificate.issuer?.name || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">{certificate.issuer?.organization} - {certificate.issuer?.title}</p>
        </div>
      </div>
      
      {/* QR Code */}
      <div className="mt-6 flex flex-col items-center">
        <div className="p-3 bg-white rounded border shadow-sm">
          <QRCodeSVG
            value={certificate.qrCodeData || 'preview'}
            size={100}
            level="H"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">Scan to verify authenticity</p>
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
        <p>This certificate is cryptographically secured on the AlgeriaTrade blockchain.</p>
        <p className="mt-1 font-mono">{certificate.hash || 'Hash will be generated upon issuance'}</p>
      </div>
    </div>
  );
}

// Main Certificate Generator Component
export function CertificateGenerator({
  availableRecords = [],
  onIssueCertificate,
  onBatchCertify,
  isProcessing = false
}: CertificateGeneratorProps) {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [certificateType, setCertificateType] = useState<CertificateType>('authenticity');
  const [issuerName, setIssuerName] = useState('');
  const [issuerOrganization, setIssuerOrganization] = useState('AlgeriaTrade.dz');
  const [issuerTitle, setIssuerTitle] = useState('Certification Officer');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [issuedCertificate, setIssuedCertificate] = useState<Certificate | null>(null);
  const [batchResults, setBatchResults] = useState<Certificate[]>([]);
  
  // Get selected record for preview
  const selectedRecord = availableRecords.find(r => r.productId === selectedProductId);
  
  // Preview data (before issuance)
  const previewCertificate: Partial<Certificate> & { type: CertificateType } = {
    type: certificateType,
    issueDate: new Date().toISOString(),
    expiryDate: expiryDate || undefined,
    issuer: {
      name: issuerName || 'Pending',
      organization: issuerOrganization,
      title: issuerTitle,
      id: '',
      signatureHash: ''
    },
    productName: selectedRecord?.productName,
    qrCodeData: `preview-${certificateType}-${Date.now()}`
  };
  
  const handleSingleIssue = async () => {
    if (!onIssueCertificate || !selectedRecord) return;
    
    try {
      const cert = await onIssueCertificate({
        provenanceId: selectedRecord.id,
        type: certificateType,
        issuer: {
          name: issuerName,
          organization: issuerOrganization,
          title: issuerTitle
        },
        expiryDate: expiryDate || undefined,
        notes: notes || undefined
      });
      
      if (cert) {
        setIssuedCertificate(cert);
        setShowPreview(false);
      }
    } catch (error) {
      console.error('Failed to issue certificate:', error);
    }
  };
  
  const handleBatchCertify = async () => {
    if (!onBatchCertify) return;
    
    try {
      const certs = await onBatchCertify({
        productIds: availableRecords.map(r => r.productId),
        certificateType,
        issuer: {
          name: issuerName,
          organization: issuerOrganization,
          title: issuerTitle
        },
        expiryDate: expiryDate || undefined,
        notes: notes || undefined
      });
      
      setBatchResults(certs);
    } catch (error) {
      console.error('Batch certification failed:', error);
    }
  };
  
  const canSubmit = mode === 'single' 
    ? !!selectedRecord && !!issuerName 
    : !!issuerName && availableRecords.length > 0;
  
  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Stamp className="w-5 h-5" />
            Certificate Generator
          </CardTitle>
          <CardDescription>
            Issue blockchain-verified digital certificates for products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit mb-6">
            <button
              onClick={() => setMode('single')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'single'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Single Certificate
            </button>
            <button
              onClick={() => setMode('batch')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'batch'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Batch Certification
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Form Section */}
            <div className="space-y-4">
              {mode === 'single' && (
                <div className="space-y-2">
                  <Label htmlFor="product">Select Product *</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRecords.map((record) => (
                        <SelectItem key={record.id} value={record.productId}>
                          <div className="flex items-center gap-2">
                            <span>{record.productName}</span>
                            <span className="text-xs text-muted-foreground">({record.batchNumber})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {availableRecords.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No provenance records available. Create a product record first.
                    </p>
                  )}
                </div>
              )}
              
              {mode === 'batch' && (
                <div className="space-y-2">
                  <Label>Products to Certify</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>{availableRecords.length}</strong> products will be certified
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      All available provenance records will receive this certificate type
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="certType">Certificate Type *</Label>
                <Select value={certificateType} onValueChange={(v) => setCertificateType(v as CertificateType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CERTIFICATE_TYPE_LABELS) as CertificateType[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const Icon = certificateIcons[type];
                            return Icon ? <Icon className="w-4 h-4" /> : null;
                          })()}
                          {CERTIFICATE_TYPE_LABELS[type]}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <Label className="text-base font-semibold">Issuer Information</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="issuerName">Full Name *</Label>
                  <Input
                    id="issuerName"
                    placeholder="e.g., Ahmed Benali"
                    value={issuerName}
                    onChange={(e) => setIssuerName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="org">Organization</Label>
                  <Input
                    id="org"
                    placeholder="e.g., AlgeriaTrade.dz"
                    value={issuerOrganization}
                    onChange={(e) => setIssuerOrganization(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Title / Position</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Quality Assurance Manager"
                    value={issuerTitle}
                    onChange={(e) => setIssuerTitle(e.target.value)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date (Optional)</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information about this certification..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={!canSubmit}>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Certificate Preview</DialogTitle>
                    </DialogHeader>
                    <CertificatePreview certificate={previewCertificate} record={selectedRecord} />
                    <div className="flex justify-end gap-3 mt-4">
                      <Button variant="outline" onClick={() => setShowPreview(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSingleIssue} disabled={isProcessing}>
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Issuing...
                          </>
                        ) : (
                          <>
                            <Stamp className="w-4 h-4 mr-2" />
                            Issue Certificate
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {mode === 'single' ? (
                  <Button onClick={handleSingleIssue} disabled={!canSubmit || isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Issuing...
                      </>
                    ) : (
                      <>
                        <Stamp className="w-4 h-4 mr-2" />
                        Issue Certificate
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleBatchCertify} disabled={!canSubmit || isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Certify All ({availableRecords.length})
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Live Preview Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Live Preview</Label>
              <CertificatePreview 
                certificate={previewCertificate} 
                record={selectedRecord}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Result Display */}
      {issuedCertificate && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="w-5 h-5" />
              Certificate Issued Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm">{issuedCertificate.certificateNumber}</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button size="sm" variant="outline">
                    <QrCode className="w-4 h-4 mr-2" />
                    View QR Code
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Batch Results */}
      {batchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Batch Certification Complete
            </CardTitle>
            <CardDescription>
              {batchResults.length} certificates have been issued successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {batchResults.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{cert.productName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{cert.certificateNumber}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Issued</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CertificateGenerator;
