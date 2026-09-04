'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type {
  ProvenanceRecord,
  SupplyChainEvent,
  Certificate,
  VerificationResult,
  SupplyChainEventType,
  VerificationStatus
} from '@/lib/blockchain/types';
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
  CATEGORY_LABELS,
  CERTIFICATE_TYPE_LABELS
} from '@/lib/blockchain/types';
import {
  Package,
  MapPin,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  QrCode,
  FileText,
  Eye,
  Hash,
  Factory,
  Ship,
  Warehouse,
  Truck,
  ClipboardCheck,
  Award,
  Lock,
  Unlock,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react';

// Icon mapping for event types
const eventIcons: Record<SupplyChainEventType, React.ElementType> = {
  manufacturing: Factory,
  quality_control: ClipboardCheck,
  packaging: Package,
  shipping: Ship,
  customs: Shield,
  transit: Truck,
  warehouse: Warehouse,
  delivery: CheckCircle2,
  verification: Eye,
  certification: Award,
  recall: AlertTriangle,
  disposal: XCircle,
  escrow_funded: Shield,
  escrow_released: CheckCircle2,
  escrow_refunded: XCircle
};

interface ProvenanceTrackerProps {
  record?: ProvenanceRecord | null;
  verification?: VerificationResult | null;
  isLoading?: boolean;
  onVerify?: (identifier: string) => void;
  compact?: boolean;
}

// Status badge component
function StatusBadge({ status }: { status: VerificationStatus }) {
  const config = {
    pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
    verified: { icon: CheckCircle2, color: 'bg-green-100 text-green-800 border-green-200', label: 'Verified' },
    rejected: { icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' },
    flagged: { icon: AlertTriangle, color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Flagged' },
    expired: { icon: Clock, color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Expired' }
  };
  
  const { icon: Icon, color, label } = config[status];
  
  return (
    <Badge variant="outline" className={`${color} flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}

// Timeline event component
function TimelineEvent({ 
  event, 
  isLast,
  onClick 
}: { 
  event: SupplyChainEvent; 
  isLast: boolean;
  onClick?: () => void;
}) {
  const Icon = eventIcons[event.eventType] || Package;
  const color = EVENT_TYPE_COLORS[event.eventType] || '#6b7280';
  
  return (
    <div className="flex gap-4 group" onClick={onClick}>
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 cursor-pointer"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <Icon className="w-5 h-5" />
        </div>
        {!isLast && (
          <div 
            className="w-0.5 h-full min-h-[40px] mt-2"
            style={{ backgroundColor: `${color}40` }}
          />
        )}
      </div>
      
      {/* Event content */}
      <div className="flex-1 pb-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4" style={{ borderLeftColor: color }}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {EVENT_TYPE_LABELS[event.eventType]}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    #{event.blockIndex}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {event.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.location.city}, {event.location.wilaya}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(event.timestamp).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
              </div>
              {event.performedByName && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {event.performedByName}
                </Badge>
              )}
            </div>
            
            {/* Event hash preview */}
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                {event.hash.slice(0, 16)}...{event.hash.slice(-8)}
              </code>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <Hash className="w-3 h-3 mr-1" />
                Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Certificate card component
function CertificateCard({ certificate }: { certificate: Certificate }) {
  const [showQR, setShowQR] = useState(false);
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              {CERTIFICATE_TYPE_LABELS[certificate.type]}
            </CardTitle>
            <CardDescription className="mt-1 font-mono text-xs">
              {certificate.certificateNumber}
            </CardDescription>
          </div>
          <StatusBadge badgeStatus={certificate.status as 'active' | 'revoked' | 'expired'} />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Issued:</span>
            <p>{new Date(certificate.issueDate).toLocaleDateString()}</p>
          </div>
          {certificate.expiryDate && (
            <div>
              <span className="text-muted-foreground">Expires:</span>
              <p>{new Date(certificate.expiryDate).toLocaleDateString()}</p>
            </div>
          )}
          <div className="col-span-2">
            <span className="text-muted-foreground">Issuer:</span>
            <p>{certificate.issuer.name}, {certificate.issuer.organization}</p>
          </div>
        </div>
        
        <Separator />
        
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" size="sm">
              <QrCode className="w-4 h-4 mr-2" />
              View QR Code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Certificate QR Code</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="p-4 bg-white rounded-lg border">
                <QRCodeSVG
                  value={certificate.qrCodeData}
                  size={220}
                  level="H"
                  includeMargin
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scan to verify this certificate on AlgeriaTrade.dz
              </p>
              <CopyButton value={certificate.certificateNumber} />
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Helper for certificate status badge
function CertificateStatusBadge({ status, badgeStatus }: { status?: string; badgeStatus: string }) {
  const configs: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Active' },
    revoked: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Revoked' },
    expired: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Expired' }
  };
  const config = configs[badgeStatus] || configs.active;
  return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
}

// Copy button component
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="flex items-center gap-2"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copy ID
        </>
      )}
    </Button>
  );
}

// Main Provenance Tracker Component
export function ProvenanceTracker({ 
  record, 
  verification, 
  isLoading,
  onVerify,
  compact = false 
}: ProvenanceTrackerProps) {
  const [selectedEvent, setSelectedEvent] = useState<SupplyChainEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'certificates'>('timeline');
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading provenance data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!record) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Record Found</h3>
          <p className="text-muted-foreground mb-4">
            Enter a product ID, batch number, or scan a QR code to view its supply chain journey.
          </p>
          {onVerify && (
            <div className="max-w-md mx-auto flex gap-2">
              <input
                type="text"
                placeholder="Enter product identifier..."
                className="flex-1 px-3 py-2 border rounded-md text-sm"
                onKeyDown={(e) => e.key === 'Enter' && onVerify((e.target as HTMLInputElement).value)}
              />
              <Button onClick={() => {
                const input = document.querySelector('input') as HTMLInputElement;
                if (input?.value) onVerify(input.value);
              }}>
                Verify
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Compact mode for dashboard cards
  if (compact) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm line-clamp-1">{record.productName}</CardTitle>
                <CardDescription className="text-xs">{record.batchNumber}</CardDescription>
              </div>
            </div>
            <StatusBadge status={record.currentStatus} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span>{CATEGORY_LABELS[record.category]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Events</span>
              <span>{record.events.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location</span>
              <span>{record.currentLocation.city}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Sealed</span>
              {record.isSealed ? (
                <Lock className="w-4 h-4 text-green-600" />
              ) : (
                <Unlock className="w-4 h-4 text-yellow-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Product Header Card */}
      <Card className="overflow-hidden border-l-4 border-l-primary">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{record.productName}</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {CATEGORY_LABELS[record.category]}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <StatusBadge status={record.currentStatus} />
                {record.isSealed ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Lock className="w-3 h-3 mr-1" />
                    Sealed & Immutable
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Unlock className="w-3 h-3 mr-1" />
                    Open Chain
                  </Badge>
                )}
              </div>
            </div>
            
            {/* QR Code Preview */}
            <div className="flex-shrink-0">
              <div className="p-3 bg-white rounded-lg border shadow-sm">
                <QRCodeSVG
                  value={record.qrCodeData}
                  size={90}
                  level="H"
                />
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">Scan to verify</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          {/* Key Information Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Batch Number</span>
              <div className="flex items-center gap-1">
                <code className="text-sm font-mono">{record.batchNumber}</code>
                <CopyButton value={record.batchNumber} />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Product ID</span>
              <code className="text-sm font-mono block truncate">{record.productId}</code>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Manufacturer</span>
              <p className="text-sm font-medium">{record.manufacturer.name}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Current Location</span>
              <p className="text-sm flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {record.currentLocation.city}, {record.currentLocation.wilaya}
              </p>
            </div>
          </div>
          
          {/* Root Hash */}
          <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Root Hash:</span>
              <code className="text-xs font-mono">{record.rootHash.slice(0, 32)}...</code>
            </div>
            <CopyButton value={record.rootHash} />
          </div>
        </CardContent>
      </Card>
      
      {/* Verification Results (if available) */}
      {verification && (
        <Card className={verification.isValid ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {verification.isValid ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <CardTitle className="text-base">
                {verification.isValid ? 'Verification Passed' : 'Verification Failed'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {verification.checks.map((check, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  {check.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  )}
                  <span className={check.passed ? '' : 'text-red-700'}>
                    {check.checkName}: {check.details}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Tabs for Timeline and Certificates */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'timeline' 
              ? 'bg-background shadow-sm text-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Journey Timeline ({record.events.length})
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'certificates' 
              ? 'bg-background shadow-sm text-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Certificates ({record.certificates.length})
        </button>
      </div>
      
      {/* Content Area */}
      {activeTab === 'timeline' ? (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Supply Chain Journey
            </CardTitle>
            <CardDescription>
              Complete traceable history of this product from manufacturing to current location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[600px] pr-4">
              <div className="pl-2">
                {record.events.map((event, idx) => (
                  <TimelineEvent
                    key={event.id}
                    event={event}
                    isLast={idx === record.events.length - 1}
                    onClick={() => setSelectedEvent(event)}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {record.certificates.length > 0 ? (
            record.certificates.map((cert) => (
              <CertificateCard key={cert.id} certificate={cert} />
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Certificates</h3>
                <p className="text-muted-foreground text-sm">
                  No certificates have been issued for this product yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && (() => {
                const Icon = eventIcons[selectedEvent.eventType] || Package;
                const color = EVENT_TYPE_COLORS[selectedEvent.eventType] || '#6b7280';
                return <Icon className="w-5 h-5" style={{ color }} />;
              })()}
              {selectedEvent && EVENT_TYPE_LABELS[selectedEvent.eventType]} Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Block Index</span>
                  <Badge variant="secondary">#{selectedEvent.blockIndex}</Badge>
                </div>
                
                <div className="py-2 border-b">
                  <span className="text-muted-foreground block mb-1">Description</span>
                  <p>{selectedEvent.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-2 border-b">
                  <div>
                    <span className="text-muted-foreground block mb-1">Location</span>
                    <p className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedEvent.location.city}, {selectedEvent.location.wilaya}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Timestamp</span>
                    <p className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(selectedEvent.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {selectedEvent.performedByName && (
                  <div className="py-2 border-b">
                    <span className="text-muted-foreground block mb-1">Performed By</span>
                    <p>{selectedEvent.performedByName}</p>
                  </div>
                )}
                
                <div className="py-2">
                  <span className="text-muted-foreground block mb-2">Event Hash</span>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-xs break-all">
                    {selectedEvent.hash}
                    <CopyButton value={selectedEvent.hash} />
                  </div>
                </div>
                
                <div className="py-2">
                  <span className="text-muted-foreground block mb-2">Previous Hash</span>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-xs break-all">
                    {selectedEvent.previousHash}
                    <CopyButton value={selectedEvent.previousHash} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Export sub-components for reuse
export { TimelineEvent, CertificateCard, StatusBadge, CopyButton };
export default ProvenanceTracker;
