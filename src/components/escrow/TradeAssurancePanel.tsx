'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Lock, 
  CheckCircle2, 
  Clock,
  AlertTriangle,
  DollarSign,
  Gavel,
  MessageSquare,
  Timer,
  FileText,
  ArrowRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface EscrowData {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  status: string;
  fundedAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  autoReleaseDays: number;
  order?: {
    orderNumber: string;
    totalAmount: number;
  };
}

interface DisputeData {
  id: string;
  title: string;
  status: string;
  reason: string;
  requestedAmount?: number;
  createdAt: string;
  responseDeadline?: string;
}

const EscrowStatusConfig: Record<string, { color: string; icon: React.ElementType; label: string; description: string }> = {
  PENDING: { 
    color: 'bg-gray-100 text-gray-800', 
    icon: Clock, 
    label: 'Pending Payment', 
    description: 'Waiting for buyer to fund escrow' 
  },
  FUNDED: { 
    color: 'bg-blue-100 text-blue-800', 
    icon: DollarSign, 
    label: 'Funded', 
    description: 'Payment received, in escrow' 
  },
  IN_ESCROW: { 
    color: 'bg-amber-100 text-amber-800', 
    icon: Lock, 
    label: 'In Escrow', 
    description: 'Funds secured, awaiting confirmation' 
  },
  RELEASED: { 
    color: 'bg-green-100 text-green-800', 
    icon: CheckCircle2, 
    label: 'Released', 
    description: 'Funds released to supplier' 
  },
  REFUNDED: { 
    color: 'bg-orange-100 text-orange-800', 
    icon: ArrowRight, 
    label: 'Refunded', 
    description: 'Full refund issued to buyer' 
  },
  PARTIAL_REFUND: { 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: AlertTriangle, 
    label: 'Partial Refund', 
    description: 'Partial refund processed' 
  },
  DISPUTED: { 
    color: 'bg-red-100 text-red-800', 
    icon: Gavel, 
    label: 'Disputed', 
    description: 'Dispute opened, under review' 
  },
  CANCELLED: { 
    color: 'bg-gray-100 text-gray-600', 
    icon: AlertTriangle, 
    label: 'Cancelled', 
    description: 'Transaction cancelled' 
  }
};

export function TradeAssuranceBadge({ status, amount }: { status: string; amount?: number }) {
  const config = EscrowStatusConfig[status];
  const Icon = config?.icon || Shield;

  return (
    <Badge className={`${config?.color} gap-1.5 px-3 py-1.5`}>
      <Icon className="h-4 w-4" />
      <span>{config?.label}</span>
      {amount && (
        <span className="font-mono font-semibold">
          {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(amount)}
        </span>
      )}
    </Badge>
  );
}

export function TradeAssurancePanel({ 
  escrow, 
  dispute,
  onAction 
}: { 
  escrow?: EscrowData; 
  dispute?: DisputeData;
  onAction?: (action: string) => void;
}) {
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);

  if (!escrow) {
    return (
      <Card className="w-full border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-2">Trade Assurance Protection</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Your order will be protected by our Trade Assurance program. 
            Funds are held in escrow until you confirm delivery.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" /> Secure Payment</Badge>
            <Badge variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Quality Guarantee</Badge>
            <Badge variant="outline" className="gap-1"><Gavel className="h-3 w-3" /> Dispute Support</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = EscrowStatusConfig[escrow.status];
  const StatusIcon = statusConfig?.icon || Shield;

  // Calculate days until auto-release
  const getDaysUntilRelease = () => {
    if (!escrow.fundedAt) return null;
    const funded = new Date(escrow.fundedAt);
    const releaseDate = new Date(funded.getTime() + (escrow.autoReleaseDays * 24 * 60 * 60 * 1000));
    const now = new Date();
    const diff = Math.ceil((releaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const daysUntilRelease = getDaysUntilRelease();

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${statusConfig?.color}`}>
              <StatusIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Trade Assurance</CardTitle>
              <CardDescription>Escrow Account: {escrow.accountId}</CardDescription>
            </div>
          </div>
          <TradeAssuranceBadge status={escrow.status} amount={escrow.amount} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Amount & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Protected Amount</p>
            <p className="text-2xl font-bold font-mono mt-1">
              {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: escrow.currency }).format(escrow.amount)}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Platform Fee</p>
            <p className="text-2xl font-bold font-mono mt-1 text-red-600">
              -{new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: escrow.currency }).format(escrow.amount * 0.02)}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Escrow Timeline</h4>
          
          <div className="relative space-y-4 pl-6 border-l-2 border-muted">
            <TimelineStep
              icon={Clock}
              label="Order Placed"
              date={escrow.order ? `Order #${escrow.order.orderNumber}` : ''}
              completed={true}
              isLast={false}
            />
            
            <TimelineStep
              icon={DollarSign}
              label="Payment Funded"
              date={escrow.fundedAt ? new Date(escrow.fundedAt).toLocaleDateString() : ''}
              completed={['FUNDED', 'IN_ESCROW', 'RELEASED', 'REFUNDED', 'PARTIAL_REFUND', 'DISPUTED'].includes(escrow.status)}
              isLast={false}
            />
            
            <TimelineStep
              icon={Lock}
              label="In Escrow"
              date={daysUntilRelease !== null ? `${daysUntilRelease} days until auto-release` : ''}
              active={['IN_ESCROW', 'FUNDED'].includes(escrow.status)}
              completed={['RELEASED', 'REFUNDED', 'PARTIAL_REFUND'].includes(escrow.status)}
              isLast={!dispute}
            />

            {dispute && (
              <TimelineStep
                icon={Gavel}
                label="Dispute Opened"
                date={dispute.title}
                active={dispute.status === 'OPEN'}
                completed={['RESOLVED'].includes(dispute.status)}
                isLast={false}
                isError
              />
            )}
            
            <TimelineStep
              icon={escrow.status === 'REFUNDED' || escrow.status === 'PARTIAL_REFUND' ? ArrowRight : CheckCircle2}
              label={escrow.status === 'REFUNDED' || escrow.status === 'PARTIAL_REFUND' ? 'Refunded' : 'Released'}
              date={escrow.releasedAt || escrow.refundedAt ? new Date(escrow.releasedAt || escrow.refundedAt!).toLocaleDateString() : ''}
              completed={['RELEASED', 'REFUNDED', 'PARTIAL_REFUND'].includes(escrow.status)}
              isLast={true}
            />
          </div>
        </div>

        {/* Dispute Info */}
        {dispute && (
          <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-start gap-3">
              <Gavel className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-900 dark:text-red-100">Active Dispute</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{dispute.title}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-red-600 dark:text-red-400">
                  <span className="capitalize">{dispute.reason.replace('_', ' ').toLowerCase()}</span>
                  {dispute.requestedAmount && (
                    <span>
                      Requested: {new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(dispute.requestedAmount)}
                    </span>
                  )}
                  {dispute.responseDeadline && (
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      Respond by: {new Date(dispute.responseDeadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => onAction?.('view-dispute')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Dispute
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <Tabs defaultValue="actions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="actions" className="space-y-3 mt-4">
            {escrow.status === 'PENDING' && (
              <Button className="w-full" onClick={() => onAction?.('fund')}>
                <DollarSign className="h-4 w-4 mr-2" />
                Fund Escrow ({new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(escrow.amount)})
              </Button>
            )}

            {(escrow.status === 'IN_ESCROW' || escrow.status === 'FUNDED') && !dispute && (
              <>
                <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Gavel className="h-4 w-4 mr-2" />
                      Open Dispute
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Open Dispute</DialogTitle>
                      <DialogDescription>
                        Describe the issue with your order. Our mediation team will review both parties.
                      </DialogDescription>
                    </DialogHeader>
                    <DisputeForm onSubmit={() => {
                      setShowDisputeDialog(false);
                      onAction?.('dispute');
                    }} />
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="w-full" onClick={() => onAction?.('release')}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm & Release Funds
                </Button>
              </>
            )}

            {(escrow.status === 'IN_ESCROW' || escrow.status === 'FUNDED') && !dispute && (
              <Button variant="outline" className="w-full text-red-600 hover:bg-red-50" onClick={() => onAction?.('refund')}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Request Refund
              </Button>
            )}
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <div className="space-y-3 text-sm">
              <DetailRow label="Account ID" value={escrow.accountId} />
              <DetailRow label="Auto Release" value={`${escrow.autoReleaseDays} days after funding`} />
              {escrow.fundedAt && <DetailRow label="Funded At" value={new Date(escrow.fundedAt).toLocaleString()} />}
              {escrow.paymentMethod && <DetailRow label="Payment Method" value={escrow.paymentMethod} />}
              <Separator />
              <p className="text-xs text-muted-foreground">
                Trade Assurance protects your orders. Funds are only released when you confirm delivery or after the auto-release period.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Timeline step component
function TimelineStep({ 
  icon: Icon, 
  label, 
  date, 
  completed, 
  active, 
  isLast, 
  isError = false 
}: { 
  icon: React.ElementType; 
  label: string; 
  date?: string; 
  completed?: boolean; 
  active?: boolean; 
  isLast?: boolean;
  isError?: boolean;
}) {
  return (
    <div className="relative">
      {/* Dot */}
      <div className={`absolute -left-[25px] w-4 h-4 rounded-full border-2 flex items-center justify-center ${
        completed 
          ? isError ? 'bg-red-500 border-red-500' : 'bg-green-500 border-green-500'
          : active 
            ? 'bg-blue-500 border-blue-500 animate-pulse' 
            : 'bg-background border-muted-foreground/30'
      }`}>
        {completed && (
          <Icon className={`h-2.5 w-2.5 ${isError ? 'text-white' : 'text-white'}`} />
        )}
      </div>
      
      <div className={`${!isLast ? 'pb-4' : ''}`}>
        <p className={`font-medium ${active ? 'text-blue-600' : ''}`}>{label}</p>
        {date && <p className="text-sm text-muted-foreground">{date}</p>}
      </div>
    </div>
  );
}

// Detail row component
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// Dispute form component (simplified)
function DisputeForm({ onSubmit }: { onSubmit: () => void }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Reason</label>
        <select 
          value={reason} 
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-2 rounded-md border"
        >
          <option value="">Select a reason...</option>
          <option value="PRODUCT_NOT_AS_DESCRIBED">Product not as described</option>
          <option value="QUALITY_ISSUES">Quality issues</option>
          <option value="SHIPPING_DELAY">Shipping delay</option>
          <option value="WRONG_PRODUCT">Wrong product received</option>
          <option value="DAMAGED_GOODS">Damaged goods</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue in detail..."
          rows={4}
          className="w-full p-2 rounded-md border resize-none"
        />
      </div>

      <Button type="submit" className="w-full" disabled={!reason || !description}>
        Submit Dispute
      </Button>
    </form>
  );
}

export default TradeAssurancePanel;
