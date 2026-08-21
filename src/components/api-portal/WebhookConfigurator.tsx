'use client';

import React, { useState } from 'react';
import {
  Webhook,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Shield,
  Settings,
  Play,
  Pause,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WebhookEventType } from '@/lib/api-marketplace/types';

// Mock webhook data
interface WebhookSubscription {
  id: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
  successCount: number;
  failureCount: number;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number; // seconds
    backoffMultiplier: number;
  };
}

const MOCK_WEBHOOKS: WebhookSubscription[] = [
  {
    id: 'wh_1',
    url: 'https://myapp.com/webhooks/algeriatrade',
    events: ['order.created', 'order.updated', 'order.shipped'],
    secret: 'whsec_a1b2c3d4e5f6g7h8i9j0',
    isActive: true,
    createdAt: new Date('2024-02-15'),
    lastTriggered: new Date(Date.now() - 15 * 60 * 1000),
    successCount: 1245,
    failureCount: 12,
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 60,
      backoffMultiplier: 2,
    },
  },
  {
    id: 'wh_2',
    url: 'https://erp.example.com/api/events',
    events: ['rfq.created', 'rfq.quotation_received', 'product.created'],
    secret: 'whsec_z9y8x7w6v5u4t3s2r1q0',
    isActive: true,
    createdAt: new Date('2024-03-01'),
    lastTriggered: new Date(Date.now() - 45 * 60 * 1000),
    successCount: 892,
    failureCount: 3,
    retryPolicy: {
      maxRetries: 5,
      retryDelay: 30,
      backoffMultiplier: 1.5,
    },
  },
  {
    id: 'wh_3',
    url: 'https://analytics.company.com/tracker',
    events: ['order.created', 'order.delivered'],
    secret: 'whsec_m1n2o3p4q5r6s7t8u9v0',
    isActive: false,
    createdAt: new Date('2024-01-20'),
    successCount: 2340,
    failureCount: 156,
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 120,
      backoffMultiplier: 2,
    },
  },
];

// Mock delivery logs
interface DeliveryLog {
  id: string;
  webhookId: string;
  eventType: WebhookEventType;
  statusCode: number;
  duration: number;
  timestamp: Date;
  attempt: number;
  response?: string;
  error?: string;
}

const MOCK_DELIVERY_LOGS: DeliveryLog[] = [
  { id: 'dl_1', webhookId: 'wh_1', eventType: 'order.created', statusCode: 200, duration: 145, timestamp: new Date(Date.now() - 15 * 60 * 1000), attempt: 1, response: '{"status": "ok"}' },
  { id: 'dl_2', webhookId: 'wh_1', eventType: 'order.updated', statusCode: 200, duration: 98, timestamp: new Date(Date.now() - 30 * 60 * 1000), attempt: 1 },
  { id: 'dl_3', webhookId: 'wh_1', eventType: 'order.shipped', statusCode: 500, duration: 2300, timestamp: new Date(Date.now() - 60 * 60 * 1000), attempt: 3, error: 'Connection timeout' },
  { id: 'dl_4', webhookId: 'wh_2', eventType: 'rfq.created', statusCode: 200, duration: 187, timestamp: new Date(Date.now() - 45 * 60 * 1000), attempt: 1 },
  { id: 'dl_5', webhookId: 'wh_2', eventType: 'rfq.quotation_received', statusCode: 401, duration: 56, timestamp: new Date(Date.now() - 90 * 60 * 1000), attempt: 2, error: 'Invalid signature' },
  { id: 'dl_6', webhookId: 'wh_3', eventType: 'order.created', statusCode: 503, duration: 3200, timestamp: new Date(Date.now() - 120 * 60 * 1000), attempt: 3, error: 'Service unavailable' },
];

// Available event types with descriptions
const EVENT_TYPES: { type: WebhookEventType; description: string; payloadExample: object }[] = [
  {
    type: 'order.created',
    description: 'Fired when a new order is placed',
    payloadExample: {
      event: 'order.created',
      data: {
        orderId: 'ord_abc123',
        buyerId: 'buyer_xyz789',
        totalAmount: 15000,
        currency: 'DZD',
        itemsCount: 3,
        status: 'pending'
      }
    }
  },
  {
    type: 'order.updated',
    description: 'Fired when order status changes',
    payloadExample: {
      event: 'order.updated',
      data: {
        orderId: 'ord_abc123',
        previousStatus: 'pending',
        newStatus: 'confirmed',
        updatedAt: '2024-03-15T10:30:00Z'
      }
    }
  },
  {
    type: 'order.shipped',
    description: 'Fired when order is shipped',
    payloadExample: {
      event: 'order.shipped',
      data: {
        orderId: 'ord_abc123',
        trackingNumber: 'TRK123456789',
        carrier: 'Algerie Poste',
        estimatedDelivery: '2024-03-22'
      }
    }
  },
  {
    type: 'order.delivered',
    description: 'Fired when order is delivered',
    payloadExample: {
      event: 'order.delivered',
      data: {
        orderId: 'ord_abc123',
        deliveredAt: '2024-03-21T14:20:00Z',
        signedBy: 'Recipient Name'
      }
    }
  },
  {
    type: 'rfq.created',
    description: 'Fired when a new RFQ is submitted',
    payloadExample: {
      event: 'rfq.created',
      data: {
        rfqId: 'rfq_def456',
        title: 'Looking for textile supplier',
        categoryId: 'textile',
        quantity: 1000,
        deadline: '2024-04-15'
      }
    }
  },
  {
    type: 'rfq.quotation_received',
    description: 'Fired when a quotation is received for an RFQ',
    payloadExample: {
      event: 'rfq.quotation_received',
      data: {
        rfqId: 'rfq_def456',
        quotationId: 'quot_ghi789',
        supplierId: 'supp_jkl012',
        totalPrice: 8500,
        validUntil: '2024-04-10'
      }
    }
  },
  {
    type: 'product.created',
    description: 'Fired when a new product is listed',
    payloadExample: {
      event: 'product.created',
      data: {
        productId: 'prod_mno345',
        name: 'Premium Dates Medjool',
        supplierId: 'supp_pqr678',
        price: 1500,
        category: 'food-dry-fruits'
      }
    }
  },
  {
    type: 'product.updated',
    description: 'Fired when product details are updated',
    payloadExample: {
      event: 'product.updated',
      data: {
        productId: 'prod_mno345',
        changedFields: ['price', 'description'],
        updatedAt: '2024-03-15T11:00:00Z'
      }
    }
  },
  {
    type: 'message.received',
    description: 'Fired when a new message is sent',
    payloadExample: {
      event: 'message.received',
      data: {
        messageId: 'msg_stu901',
        conversationId: 'conv_vwx234',
        senderId: 'user_yz567',
        content: 'Hello, I am interested in your products'
      }
    }
  },
  {
    type: 'company.verified',
    description: 'Fired when a company verification status changes',
    payloadExample: {
      event: 'company.verified',
      data: {
        companyId: 'comp_abc123',
        companyName: 'Algeria Trading SARL',
        previousStatus: 'pending',
        newStatus: 'verified',
        verifiedAt: '2024-03-15T09:00:00Z'
      }
    }
  },
];

export default function WebhookConfigurator() {
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>(MOCK_WEBHOOKS);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookSubscription>(MOCK_WEBHOOKS[0]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);
  
  // Create form state
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<WebhookEventType[]>(['order.created']);
  const [newMaxRetries, setNewMaxRetries] = useState(3);
  const [newRetryDelay, setNewRetryDelay] = useState(60);

  // Filter delivery logs for selected webhook
  const filteredLogs = MOCK_DELIVERY_LOGS.filter(log => log.webhookId === selectedWebhook.id);
  const successRate = selectedWebhook.successCount + selectedWebhook.failureCount > 0
    ? ((selectedWebhook.successCount / (selectedWebhook.successCount + selectedWebhook.failureCount)) * 100).toFixed(1)
    : '100.0';

  const handleCreateWebhook = () => {
    const newWebhook: WebhookSubscription = {
      id: `wh_${Date.now()}`,
      url: newUrl,
      events: newEvents,
      secret: `whsec_${Math.random().toString(36).substring(2, 18)}`,
      isActive: true,
      createdAt: new Date(),
      successCount: 0,
      failureCount: 0,
      retryPolicy: {
        maxRetries: newMaxRetries,
        retryDelay: newRetryDelay,
        backoffMultiplier: 2,
      },
    };
    
    setWebhooks([newWebhook, ...webhooks]);
    setSelectedWebhook(newWebhook);
    setShowCreateDialog(false);
    setNewUrl('');
    setNewEvents(['order.created']);
  };

  const handleToggleWebhook = (id: string) => {
    setWebhooks(webhooks.map(w => w.id === id ? { ...w, isActive: !w.isActive } : w));
    if (selectedWebhook.id === id) {
      setSelectedWebhook({ ...selectedWebhook, isActive: !selectedWebhook.isActive });
    }
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
    if (selectedWebhook.id === id && webhooks.length > 1) {
      setSelectedWebhook(webhooks.find(w => w.id !== id)!);
    }
  };

  const toggleEventSelection = (event: WebhookEventType) => {
    if (newEvents.includes(event)) {
      setNewEvents(newEvents.filter(e => e !== event));
    } else {
      setNewEvents([...newEvents, event]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="w-7 h-7 text-primary" />
            Webhooks
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure real-time event notifications to your endpoints
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create Webhook Endpoint</DialogTitle>
              <DialogDescription>
                Set up a new URL to receive real-time event notifications.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Endpoint URL */}
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Endpoint URL</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://your-app.com/webhooks/algeriatrade"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Must be HTTPS and respond within 5 seconds
                </p>
              </div>

              {/* Events Selection */}
              <div className="space-y-2">
                <Label>Events to Subscribe</Label>
                <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto rounded-md border p-3">
                  {EVENT_TYPES.map(event => (
                    <label 
                      key={event.type}
                      className={`flex items-start gap-3 p-2 rounded cursor-pointer transition-colors ${
                        newEvents.includes(event.type) ? 'bg-primary/10 border border-primary' : 'hover:bg-muted'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newEvents.includes(event.type)}
                        onChange={() => toggleEventSelection(event.type)}
                        className="mt-0.5 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <code className="text-sm font-mono">{event.type}</code>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Retry Policy */}
              <div className="space-y-3">
                <Label>Retry Policy</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Max Retries</Label>
                    <Select value={String(newMaxRetries)} onValueChange={(v) => setNewMaxRetries(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No retries</SelectItem>
                        <SelectItem value="1">1 retry</SelectItem>
                        <SelectItem value="3">3 retries</SelectItem>
                        <SelectItem value="5">5 retries</SelectItem>
                        <SelectItem value="10">10 retries</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Initial Delay (seconds)</Label>
                    <Select value={String(newRetryDelay)} onValueChange={(v) => setNewRetryDelay(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="120">2 minutes</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Uses exponential backoff: delay × 2^attempt
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWebhook} disabled={!newUrl || newEvents.length === 0}>
                Create Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        {/* Webhooks List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Endpoints ({webhooks.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[450px]">
              <div className="divide-y">
                {webhooks.map(webhook => (
                  <button
                    key={webhook.id}
                    onClick={() => setSelectedWebhook(webhook)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                      selectedWebhook.id === webhook.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-medium truncate">{new URL(webhook.url).hostname}</span>
                      <Badge variant={webhook.isActive ? 'default' : 'secondary'} className="shrink-0 text-xs">
                        {webhook.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-2">{webhook.url}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{webhook.events.length} events</span>
                      <span>•</span>
                      <span className={webhook.failureCount > 10 ? 'text-red-500' : ''}>
                        {successRate}% success
                      </span>
                      <span>•</span>
                      <span>Last: {webhook.lastTriggered ? formatRelativeTime(webhook.lastTriggered) : 'Never'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Webhook Details */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-1">
              <Settings className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-1">
              <Eye className="w-4 h-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-1">
              <Clock className="w-4 h-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="verify" className="gap-1">
              <Shield className="w-4 h-4" />
              Verify
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Webhook Configuration</CardTitle>
                    <CardDescription className="mt-1 font-mono text-sm break-all">
                      {selectedWebhook.url}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={selectedWebhook.isActive}
                      onCheckedChange={() => handleToggleWebhook(selectedWebhook.id)}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteWebhook(selectedWebhook.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MiniStat label="Total Sent" value={(selectedWebhook.successCount + selectedWebhook.failureCount).toLocaleString()} />
                  <MiniStat label="Success Rate" value={`${successRate}%`} color={parseFloat(successRate) >= 95 ? 'text-emerald-600' : parseFloat(successRate) >= 80 ? 'text-amber-600' : 'text-red-600'} />
                  <MiniStat label="Failures" value={selectedWebhook.failureCount.toLocaleString()} color={selectedWebhook.failureCount > 10 ? 'text-red-600' : ''} />
                  <MiniStat label="Created" value={formatDate(selectedWebhook.createdAt)} />
                </div>

                <Separator />

                {/* Secret Key */}
                <div>
                  <Label>Signing Secret</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input readOnly value={selectedWebhook.secret} className="font-mono" />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedWebhook.secret);
                        setCopiedSecret(selectedWebhook.id);
                        setTimeout(() => setCopiedSecret(null), 2000);
                      }}
                      className="gap-1 shrink-0"
                    >
                      {copiedSecret === selectedWebhook.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                    <Button variant="outline" size="icon" title="Rotate secret">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Used to verify webhook signatures. Keep it secret!
                  </p>
                </div>

                <Separator />

                {/* Retry Policy */}
                <div>
                  <h4 className="font-medium mb-3">Retry Policy</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Max Retries</p>
                      <p className="text-xl font-semibold">{selectedWebhook.retryPolicy.maxRetries}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Initial Delay</p>
                      <p className="text-xl font-semibold">{selectedWebhook.retryPolicy.retryDelay}s</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Backoff</p>
                      <p className="text-xl font-semibold">{selectedWebhook.retryPolicy.backoffMultiplier}x</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Retry schedule: {selectedWebhook.retryPolicy.retryDelay}s → {selectedWebhook.retryPolicy.retryDelay * selectedWebhook.retryPolicy.backoffMultiplier}s → ...
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Subscribed Events ({selectedWebhook.events.length})</CardTitle>
                <CardDescription>
                  These events will trigger webhooks to your endpoint
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedWebhook.events.map(eventType => {
                    const eventInfo = EVENT_TYPES.find(e => e.type === eventType);
                    return (
                      <div key={eventType} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <code className="font-medium text-primary">{eventType}</code>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {eventInfo?.description || eventType}
                        </p>
                        
                        {/* Payload Preview */}
                        <details className="group">
                          <summary className="cursor-pointer text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground">
                            <ChevronRight className="w-4 h-4 group-open:hidden transition-transform" />
                            <ChevronDown className="w-4 h-4 hidden group-open:block transition-transform" />
                            View Payload Example
                          </summary>
                          <pre className="mt-2 p-3 bg-slate-950 text-slate-100 rounded-md text-xs overflow-x-auto">
                            {JSON.stringify(eventInfo?.payloadExample || {}, null, 2)}
                          </pre>
                        </details>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" className="gap-1">
                    <Edit3 className="w-4 h-4" />
                    Modify Events
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Logs Tab */}
          <TabsContent value="logs" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Recent Deliveries</CardTitle>
                  <Button variant="outline" size="sm" className="gap-1">
                    <ExternalLink className="w-4 h-4" />
                    Export Logs
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filteredLogs.length > 0 ? (
                  <div className="space-y-3">
                    {filteredLogs.map(log => (
                      <div key={log.id} className={`p-4 rounded-lg border ${
                        log.statusCode >= 400 ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20' : ''
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <StatusIcon status={log.statusCode} />
                            <code className="text-sm font-medium">{log.eventType}</code>
                            {log.attempt > 1 && (
                              <Badge variant="outline" className="text-xs">
                                Attempt {log.attempt}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{formatRelativeTime(log.timestamp)}</span>
                            <span>{log.duration}ms</span>
                            <Badge variant={log.statusCode >= 400 ? 'destructive' : 'secondary'}>
                              {log.statusCode}
                            </Badge>
                          </div>
                        </div>
                        
                        {log.error && (
                          <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            {log.error}
                          </p>
                        )}
                        
                        {log.response && (
                          <details className="group mt-2">
                            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                              View Response
                            </summary>
                            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                              {log.response}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No delivery logs yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Signature Verification Tab */}
          <TabsContent value="verify" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Signature Verification Helper
                </CardTitle>
                <CardDescription>
                  Verify that incoming webhooks are genuinely from AlgeriaTrade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* How It Works */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">How Verification Works</h4>
                  <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                    <li>We send a header <code className="bg-background px-1 rounded">X-AlgeriaTrade-Signature</code> with each webhook</li>
                    <li>The signature contains a timestamp and HMAC-SHA256 hash</li>
                    <li>Recompute the hash using your signing secret and compare</li>
                    <li>Reject if timestamps are older than 5 minutes or signatures don't match</li>
                  </ol>
                </div>

                {/* Code Examples */}
                <div>
                  <h4 className="font-medium mb-3">Implementation Examples</h4>
                  
                  <Tabs defaultValue="nodejs">
                    <TabsList className="mb-4">
                      <TabsTrigger value="nodejs">Node.js</TabsTrigger>
                      <TabsTrigger value="python">Python</TabsTrigger>
                      <TabsTrigger value="php">PHP</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="nodejs">
                      <pre className="bg-slate-950 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
{`const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const [timestamp, signatureHash] = signature.split(',');
  const ts = timestamp.replace('t=', '');
  const expectedSig = signatureHash.replace('v1=', '');
  
  // Check timestamp freshness (5 min window)
  const age = Math.floor(Date.now() / 1000) - parseInt(ts);
  if (Math.abs(age) > 300) return false;
  
  // Compute expected signature
  const signedPayload = \`\${timestamp}.\${payload}\`;
  const computedSig = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  // Constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(expectedSig),
    Buffer.from(computedSig)
  );
}`}
                      </pre>
                    </TabsContent>
                    
                    <TabsContent value="python">
                      <pre className="bg-slate-950 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import hmac
import hashlib
import time

def verify_signature(payload, signature, secret):
    # Parse signature components
    elements = {}
    for part in signature.split(','):
        key, value = part.split('=')
        elements[key] = value
    
    timestamp = int(elements.get('t', 0))
    received_sig = elements.get('v1', '')
    
    # Check timestamp freshness (5 min window)
    if abs(int(time.time()) - timestamp) > 300:
        return False
    
    # Compute expected signature
    signed_payload = f"t={timestamp}.{payload}"
    expected_sig = hmac.new(
        secret.encode(),
        signed_payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Constant-time comparison
    return hmac.compare_digest(received_sig, expected_sig)`}
                      </pre>
                    </TabsContent>
                    
                    <TabsContent value="php">
                      <pre className="bg-slate-950 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
{`<?php

function verifySignature($payload, $signature, $secret) {
    // Parse signature
    $parts = [];
    foreach (explode(',', $signature) as $part) {
        [$key, $value] = explode('=', $part, 2);
        $parts[$key] = $value;
    }
    
    $timestamp = $parts['t'] ?? 0;
    $receivedSig = $parts['v1'] ?? '';
    
    // Check timestamp freshness (5 min window)
    if (abs(time() - $timestamp) > 300) {
        return false;
    }
    
    // Compute expected signature
    $signedPayload = "t={$timestamp}.{$payload}";
    $expectedSig = hash_hmac('sha256', $signedPayload, $secret);
    
    // Constant-time comparison
    return hash_equals($receivedSig, $expectedSig);
}`}
                      </pre>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Test Tool */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Test Verification Tool</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Payload (Raw Body)</Label>
                      <textarea 
                        className="w-full h-32 p-3 rounded-md border bg-background font-mono text-sm resize-none"
                        placeholder='{"event":"order.created","data":{...}}'
                        defaultValue='{"event":"order.created","data":{"orderId":"ord_abc123"}}'
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Signature Header Value</Label>
                      <textarea 
                        className="w-full h-32 p-3 rounded-md border bg-background font-mono text-sm resize-none"
                        placeholder='t=1710491400,v1=abc123...'
                        defaultValue={`t=${Math.floor(Date.now()/1000)},v1=${Array.from({length:64}, () => "0123456789abcdef"[Math.floor(Math.random()*16)]).join('')}`}
                      />
                    </div>
                  </div>
                  <Button className="mt-3 gap-1">
                    <Play className="w-4 h-4" />
                    Verify Signature
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-semibold ${color || ''}`}>{value}</p>
    </div>
  );
}

function StatusIcon({ status }: { status: number }) {
  if (status >= 200 && status < 300) {
    return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  }
  if (status >= 400 && status < 500) {
    return <AlertTriangle className="w-5 h-5 text-amber-500" />;
  }
  return <XCircle className="w-5 h-5 text-red-500" />;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}
