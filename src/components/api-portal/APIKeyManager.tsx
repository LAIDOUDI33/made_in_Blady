'use client';

import React, { useState, useMemo } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  RefreshCw,
  BarChart3,
  Clock,
  Shield,
  Globe,
  AlertTriangle,
  Settings,
  ExternalLink,
  Download,
  ChevronDown,
  ChevronRight,
  X
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
import { ApiKey, ApiPermission, PERMISSION_DESCRIPTIONS } from '@/lib/api-marketplace/types';

// Mock data for demonstration
const MOCK_API_KEYS: ApiKey[] = [
  {
    id: 'key_1',
    key: 'hashed_key_1',
    keyPrefix: 'at_a1b2c3d4...',
    name: 'Production API Key',
    permissions: ['products:read', 'products:write', 'orders:read', 'orders:write', 'rfq:read'],
    rateLimit: 1000,
    allowedIps: ['192.168.1.100', '10.0.0.50'],
    webhookUrl: 'https://myapp.com/webhooks/algeriatrade',
    isActive: true,
    lastUsedAt: new Date(Date.now() - 5 * 60 * 1000),
    createdAt: new Date('2024-01-15'),
    usageCount: 15420,
  },
  {
    id: 'key_2',
    key: 'hashed_key_2',
    keyPrefix: 'at_e5f6g7h8...',
    name: 'Testing Key',
    permissions: ['products:read', 'search', 'companies:read'],
    rateLimit: 100,
    isActive: true,
    lastUsedAt: new Date(Date.now() - 30 * 60 * 1000),
    createdAt: new Date('2024-03-20'),
    usageCount: 856,
  },
  {
    id: 'key_3',
    key: 'hashed_key_3',
    keyPrefix: 'at_i9j0k1l2...',
    name: 'Legacy Integration',
    permissions: ['products:read', 'orders:read'],
    rateLimit: 50,
    isActive: false,
    createdAt: new Date('2023-11-10'),
    expiresAt: new Date('2024-12-31'),
    usageCount: 45230,
  },
];

// Mock usage data
const generateUsageData = (days: number = 30) => {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    requests: Math.floor(Math.random() * 500) + 50,
    errors: Math.floor(Math.random() * 20),
    avgResponseTime: Math.floor(Math.random() * 200) + 50,
  }));
};

export default function APIKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(MOCK_API_KEYS);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(apiKeys[0]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showNewKeySecret, setShowNewKeySecret] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showKeyValue, setShowKeyValue] = useState<Record<string, boolean>>({});
  
  // New key form state
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<ApiPermission[]>(['products:read']);
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(100);
  const [newKeyAllowedIps, setNewKeyAllowedIps] = useState('');

  // Usage data (mock)
  const usageData = useMemo(() => generateUsageData(), []);
  const totalRequests = usageData.reduce((sum, d) => sum + d.requests, 0);
  const avgResponseTime = Math.round(
    usageData.reduce((sum, d) => sum + d.avgResponseTime, 0) / usageData.length
  );
  const errorRate = (
    (usageData.reduce((sum, d) => sum + d.errors, 0) / totalRequests) * 100
  ).toFixed(2);

  // Popular endpoints mock
  const popularEndpoints = [
    { endpoint: '/v2/products', count: 4520, percentage: 29.3 },
    { endpoint: '/v2/search', count: 3200, percentage: 20.7 },
    { endpoint: '/v2/companies', count: 2100, percentage: 13.6 },
    { endpoint: '/v2/orders', count: 1850, percentage: 12.0 },
    { endpoint: '/v2/rfqs', count: 1200, percentage: 7.8 },
    { endpoint: '/v2/analytics/trends', count: 980, percentage: 6.4 },
    { endpoint: '/v2/products/{slug}', count: 850, percentage: 5.5 },
    { endpoint: '/other', count: 720, percentage: 4.7 },
  ];

  const handleCreateKey = () => {
    // Generate a fake key for demo purposes
    const newKeyPrefix = `at_${Math.random().toString(36).substring(2, 10)}...`;
    const fullKey = `at_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    
    setShowNewKeySecret(fullKey);
    
    const newKey: ApiKey = {
      id: `key_${Date.now()}`,
      key: `hashed_${Date.now()}`,
      keyPrefix: newKeyPrefix,
      name: newKeyName || 'New API Key',
      permissions: newKeyPermissions,
      rateLimit: newKeyRateLimit,
      allowedIps: newKeyAllowedIps ? newKeyAllowedIps.split(',').map(ip => ip.trim()) : undefined,
      isActive: true,
      createdAt: new Date(),
      usageCount: 0,
    };
    
    setApiKeys([newKey, ...apiKeys]);
    setSelectedKey(newKey);
    setShowCreateDialog(false);
    
    // Reset form
    setNewKeyName('');
    setNewKeyPermissions(['products:read']);
    setNewKeyRateLimit(100);
    setNewKeyAllowedIps('');
  };

  const handleDeleteKey = (keyId: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== keyId));
    if (selectedKey?.id === keyId) {
      setSelectedKey(apiKeys.find(k => k.id !== keyId) || null);
    }
  };

  const handleToggleKeyStatus = (keyId: string) => {
    setApiKeys(apiKeys.map(k => 
      k.id === keyId ? { ...k, isActive: !k.isActive } : k
    ));
    if (selectedKey?.id === keyId) {
      setSelectedKey({ ...selectedKey, isActive: !selectedKey.isActive });
    }
  };

  const handleCopyKey = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const togglePermission = (permission: ApiPermission) => {
    if (newKeyPermissions.includes(permission)) {
      setNewKeyPermissions(newKeyPermissions.filter(p => p !== permission));
    } else {
      setNewKeyPermissions([...newKeyPermissions, permission]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Key className="w-7 h-7 text-primary" />
            API Keys
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your API keys and access credentials
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key to authenticate your requests. 
                The full key will only be shown once.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Key Name */}
              <div className="space-y-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Production App, Testing Environment"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A descriptive name to help you identify this key later
                </p>
              </div>

              {/* Permissions */}
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto rounded-md border p-3">
                  {(Object.keys(PERMISSION_DESCRIPTIONS) as ApiPermission[]).map(perm => (
                    <label 
                      key={perm}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        newKeyPermissions.includes(perm) ? 'bg-primary/10 border border-primary' : 'hover:bg-muted'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newKeyPermissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        className="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <code className="text-xs font-mono">{perm}</code>
                        <p className="text-xs text-muted-foreground truncate">
                          {PERMISSION_DESCRIPTIONS[perm].en}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rate Limit */}
              <div className="space-y-2">
                <Label htmlFor="rateLimit">Rate Limit (requests per minute)</Label>
                <Select value={String(newKeyRateLimit)} onValueChange={(v) => setNewKeyRateLimit(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10/min (Very Limited)</SelectItem>
                    <SelectItem value="50">50/min (Limited)</SelectItem>
                    <SelectItem value="100">100/min (Standard)</SelectItem>
                    <SelectItem value="500">500/min (High)</SelectItem>
                    <SelectItem value="1000">1000/min (Premium)</SelectItem>
                    <SelectItem value="5000">5000/min (Enterprise)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Allowed IPs */}
              <div className="space-y-2">
                <Label htmlFor="allowedIps">Allowed IP Addresses (Optional)</Label>
                <Input
                  id="allowedIps"
                  placeholder="192.168.1.100, 10.0.0.50 (comma-separated)"
                  value={newKeyAllowedIps}
                  onChange={(e) => setNewKeyAllowedIps(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to allow all IPs. Restrict for enhanced security.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateKey}>
                Generate Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* New Key Secret Dialog */}
      {showNewKeySecret && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Save Your API Key Now!
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                  This is the only time you'll see the full API key. Store it securely.
                </p>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-md p-3 border border-amber-200 dark:border-amber-700">
                  <code className="flex-1 font-mono text-sm truncate">{showNewKeySecret}</code>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopyKey(showNewKeySecret, 'new-key')}
                    className="gap-1 shrink-0"
                  >
                    {copiedKey === 'new-key' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'new-key' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowNewKeySecret(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-[400px_1fr] gap-6">
        {/* Keys List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your API Keys ({apiKeys.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[500px]">
              <div className="divide-y">
                {apiKeys.map(key => (
                  <button
                    key={key.id}
                    onClick={() => setSelectedKey(key)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                      selectedKey?.id === key.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{key.name}</span>
                          <Badge variant={key.isActive ? 'default' : 'secondary'} className="text-xs shrink-0">
                            {key.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <code className="text-xs text-muted-foreground block">{key.keyPrefix}</code>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {key.usageCount.toLocaleString()} uses
                          </span>
                          {key.lastUsedAt && (
                            <span>Used {formatRelativeTime(key.lastUsedAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Key Details */}
        {selectedKey ? (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details" className="gap-1">
                <Settings className="w-4 h-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="usage" className="gap-1">
                <BarChart3 className="w-4 h-4" />
                Usage
              </TabsTrigger>
              <TabsTrigger value="permissions" className="gap-1">
                <Shield className="w-4 h-4" />
                Permissions
              </TabsTrigger>
              <TabsTrigger value="webhook" className="gap-1">
                <Globe className="w-4 h-4" />
                Webhook
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{selectedKey.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={selectedKey.isActive}
                        onCheckedChange={() => handleToggleKeyStatus(selectedKey.id)}
                      />
                      <Badge variant={selectedKey.isActive ? 'default' : 'secondary'}>
                        {selectedKey.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Key Value */}
                  <div>
                    <Label className="text-muted-foreground">API Key</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 flex items-center bg-muted rounded-md px-3 py-2 font-mono text-sm">
                        {showKeyValue[selectedKey.id] ? (
                          <>
                            <span>at_demo_full_key_revealed_for_demo_purposes_only</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 ml-auto shrink-0"
                              onClick={() => setShowKeyValue({ ...showKeyValue, [selectedKey.id]: false })}
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span>{selectedKey.keyPrefix}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 ml-auto shrink-0"
                              onClick={() => setShowKeyValue({ ...showKeyValue, [selectedKey.id]: true })}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopyKey(`at_demo_key_for_${selectedKey.name}`, selectedKey.id)}
                        className="gap-1"
                      >
                        {copiedKey === selectedKey.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Created" value={formatDate(selectedKey.createdAt)} />
                    <InfoRow label="Last Used" value={selectedKey.lastUsedAt ? formatRelativeTime(selectedKey.lastUsedAt) : 'Never'} />
                    <InfoRow label="Total Uses" value={selectedKey.usageCount.toLocaleString()} />
                    <InfoRow label="Rate Limit" value={`${selectedKey.rateLimit}/min`} />
                    {selectedKey.expiresAt && (
                      <InfoRow label="Expires" value={formatDate(selectedKey.expiresAt)} />
                    )}
                  </div>

                  {/* Allowed IPs */}
                  {selectedKey.allowedIps && selectedKey.allowedIps.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Allowed IP Addresses</Label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedKey.allowedIps.map((ip, i) => (
                          <code key={i} className="bg-muted px-2 py-0.5 rounded text-sm">{ip}</code>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <RefreshCw className="w-4 h-4" />
                      Rotate Key
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => handleDeleteKey(selectedKey.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Usage Tab */}
            <TabsContent value="usage" className="mt-6 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Requests" value={totalRequests.toLocaleString()} icon={<BarChart3 className="w-5 h-5" />} />
                <StatCard title="Avg Response" value={`${avgResponseTime}ms`} icon={<Clock className="w-5 h-5" />} />
                <StatCard title="Error Rate" value={`${errorRate}%`} icon={<AlertTriangle className="w-5 h-5" />} color={parseFloat(errorRate) > 5 ? 'text-red-600' : 'text-emerald-600'} />
                <StatCard title="Daily Avg" value={Math.round(totalRequests / 30).toLocaleString()} icon={<BarChart3 className="w-5 h-5" />} />
              </div>

              {/* Usage Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Request Volume (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-end gap-1">
                    {usageData.slice(-28).map((day, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-primary/70 hover:bg-primary rounded-t transition-colors relative group"
                        style={{ height: `${(day.requests / 500) * 100}%` }}
                        title={`${day.date}: ${day.requests} requests`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                          {day.requests} requests
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{usageData[0].date}</span>
                    <span>Today</span>
                  </div>
                </CardContent>
              </Card>

              {/* Popular Endpoints */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Most Used Endpoints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {popularEndpoints.map((ep, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-6 text-sm text-muted-foreground">{i + 1}</span>
                        <code className="flex-1 text-sm">{ep.endpoint}</code>
                        <span className="text-sm text-muted-foreground w-16 text-right">{ep.count.toLocaleString()}</span>
                        <div className="w-24">
                          <Progress value={ep.percentage} className="h-2" />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">{ep.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current Permissions</CardTitle>
                  <CardDescription>
                    These are the API scopes this key can access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedKey.permissions.map(perm => (
                      <div 
                        key={perm}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <Shield className="w-5 h-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <code className="font-medium">{perm}</code>
                          <p className="text-sm text-muted-foreground">
                            {PERMISSION_DESCRIPTIONS[perm]?.en || perm}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">Granted</Badge>
                      </div>
                    ))}
                    
                    {selectedKey.permissions.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No permissions assigned
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t">
                    <Button variant="outline" className="gap-1">
                      <Edit3 className="w-4 h-4" />
                      Modify Permissions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Webhook URL Configuration */}
            <TabsContent value="webhook" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Webhook URL</CardTitle>
                  <CardDescription>
                    Configure where event notifications should be sent
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">Webhook Endpoint URL</Label>
                    <Input
                      id="webhookUrl"
                      placeholder="https://your-app.com/webhooks/algeriatrade"
                      defaultValue={selectedKey.webhookUrl || ''}
                    />
                    <p className="text-xs text-muted-foreground">
                      We'll send POST requests to this URL when subscribed events occur.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Events to Subscribe</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'order.created', 'order.updated', 'order.shipped',
                        'rfq.created', 'rfq.quotation_received',
                        'product.created', 'product.updated',
                        'message.received'
                      ].map(event => (
                        <label key={event} className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50">
                          <input type="checkbox" defaultChecked={['order.created', 'order.updated'].includes(event)} />
                          <code className="text-sm">{event}</code>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Webhook Payload Format
                    </h5>
                    <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`{
  "event": "order.created",
  "data": { ... },
  "timestamp": "2024-03-15T10:30:00Z",
  "signature": "t=1710491400,v1=abc123..."
}`}
                    </pre>
                  </div>

                  <Button>Save Webhook Configuration</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="flex items-center justify-center min-h-[400px]">
            <CardContent className="text-center py-12">
              <Key className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Key Selected</h3>
              <p className="text-muted-foreground">Select an API key to view its details and settings.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function StatCard({ 
  title, 
  value, 
  icon, 
  color = 'text-foreground' 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className={`text-muted-foreground`}>{icon}</div>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">{title}</span>
        </div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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
