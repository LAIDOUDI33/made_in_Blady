'use client';

import React, { useState, useCallback } from 'react';
import {
  Play,
  Save,
  FolderOpen,
  Trash2,
  Copy,
  Check,
  Download,
  Upload,
  Settings,
  Clock,
  Zap,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  FileJson,
  FileCode,
  History
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Environment types
type Environment = 'sandbox' | 'production';

// Saved request collection
interface SavedRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  createdAt: Date;
}

// Mock saved requests
const MOCK_SAVED_REQUESTS: SavedRequest[] = [
  {
    id: 'req_1',
    name: 'Get Products List',
    method: 'GET',
    url: '/v2/products?category=textile&limit=10',
    headers: { 'Authorization': 'Bearer at_demo_key', 'Accept': 'application/json' },
    createdAt: new Date('2024-03-15'),
  },
  {
    id: 'req_2',
    name: 'Create New Order',
    method: 'POST',
    url: '/v2/orders',
    headers: { 'Authorization': 'Bearer at_demo_key', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: 'prod_abc123', quantity: 100 }],
      shippingAddress: { fullName: 'Test Company', wilaya: '16', address: '123 St' },
      paymentMethod: 'ccp'
    }, null, 2),
    createdAt: new Date('2024-03-14'),
  },
  {
    id: 'req_3',
    name: 'Search Companies',
    method: 'GET',
    url: '/v2/companies?q=agroalimentaire&wilaya=16&verified=true',
    headers: { 'Authorization': 'Bearer at_demo_key', 'Accept': 'application/json' },
    createdAt: new Date('2024-03-13'),
  }
];

// Request history (mock)
interface HistoryEntry {
  id: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
}

const MOCK_HISTORY: HistoryEntry[] = [
  { id: 'h1', method: 'GET', url: '/v2/products', statusCode: 200, duration: 145, timestamp: new Date(Date.now() - 5 * 60 * 1000) },
  { id: 'h2', method: 'POST', url: '/v2/orders', statusCode: 201, duration: 230, timestamp: new Date(Date.now() - 15 * 60 * 1000) },
  { id: 'h3', method: 'GET', url: '/v2/search?q=textile', statusCode: 200, duration: 89, timestamp: new Date(Date.now() - 30 * 60 * 1000) },
  { id: 'h4', method: 'GET', url: '/v2/rfqs', statusCode: 200, duration: 112, timestamp: new Date(Date.now() - 60 * 60 * 1000) },
];

export default function APIPlayground() {
  // State
  const [environment, setEnvironment] = useState<Environment>('sandbox');
  const [method, setMethod] = useState<string>('GET');
  const [url, setUrl] = useState<string>('/v2/products');
  const [headers, setHeaders] = useState<Record<string, string>>({
    'Authorization': 'Bearer at_demo_key_here',
    'Accept': 'application/json',
  });
  const [body, setBody] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>(MOCK_SAVED_REQUESTS);
  const [history, setHistory] = useState<HistoryEntry[]>(MOCK_HISTORY);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [copiedResponse, setCopiedResponse] = useState(false);

  // Generate mock response based on request
  const generateMockResponse = useCallback(() => {
    const baseUrl = environment === 'sandbox' 
      ? 'https://sandbox-api.algeriatrade.dz' 
      : 'https://api.algeriatrade.dz';
    
    // Simulate network delay
    const delay = Math.floor(Math.random() * 300) + 50;
    
    return new Promise<{ status: number; body: string; headers: Record<string, string>; time: number }>((resolve) => {
      setTimeout(() => {
        let mockData: any;
        let status = 200;

        if (url.includes('/products')) {
          if (method === 'GET') {
            mockData = {
              success: true,
              data: Array.from({ length: 5 }, (_, i) => ({
                id: `prod_${i + 1}`,
                name: `Product ${i + 1} - ${url.includes('textile') ? 'Textile Item' : 'General Product'}`,
                slug: `product-${i + 1}`,
                price: Math.floor(Math.random() * 50000) + 500,
                currency: 'DZD',
                category: url.includes('category=') ? url.split('category=')[1]?.split('&')[0] : 'general',
                supplier: { id: `supp_${i + 1}`, name: `Supplier ${i + 1}`, verified: true },
                images: [`https://cdn.algeriatrade.dz/products/${i + 1}/main.jpg`]
              })),
              meta: {
                queriedAt: new Date().toISOString(),
                apiVersion: 'v2',
                requestId: `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 8)}`,
                pagination: { page: 1, limit: 20, total: 156, totalPages: 8 }
              }
            };
          } else if (method === 'POST') {
            status = 201;
            mockData = {
              success: true,
              data: {
                id: `prod_new_${Date.now()}`,
                message: 'Product created successfully'
              },
              meta: { queriedAt: new Date().toISOString(), apiVersion: 'v2' }
            };
          }
        } else if (url.includes('/orders')) {
          if (method === 'GET') {
            mockData = {
              success: true,
              data: Array.from({ length: 3 }, (_, i) => ({
                id: `ord_${Date.now()}_${i}`,
                status: ['pending', 'confirmed', 'shipped'][i],
                totalAmount: Math.floor(Math.random() * 50000) + 10000,
                itemsCount: Math.floor(Math.random() * 5) + 1,
                createdAt: new Date().toISOString()
              })),
              meta: { queriedAt: new Date().toISOString(), apiVersion: 'v2', pagination: { page: 1, limit: 20, total: 42, totalPages: 3 } }
            };
          } else if (method === 'POST') {
            status = 201;
            mockData = {
              success: true,
              data: {
                id: `ord_${Date.now()}`,
                status: 'pending',
                message: 'Order created successfully. Awaiting payment confirmation.',
                checkoutUrl: `${baseUrl}/checkout/ord_${Date.now()}`
              },
              meta: { queriedAt: new Date().toISOString(), apiVersion: 'v2' }
            };
          }
        } else if (url.includes('/rfqs')) {
          mockData = {
            success: true,
            data: Array.from({ length: 4 }, (_, i) => ({
              id: `rfq_${i + 1}`,
              title: `Looking for ${['textile products', 'electronics supplier', 'food distributor', 'construction materials'][i]}`,
              budget: Math.floor(Math.random() * 100000) + 10000,
              deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              responsesCount: Math.floor(Math.random() * 10)
            })),
            meta: { queriedAt: new Date().toISOString(), apiVersion: 'v2', pagination: { page: 1, limit: 20, total: 28, totalPages: 2 } }
          };
        } else if (url.includes('/companies')) {
          mockData = {
            success: true,
            data: Array.from({ length: 3 }, (_, i) => ({
              id: `comp_${i + 1}`,
              name: `Algeria Company ${String.fromCharCode(65 + i)} SARL`,
              slug: `algeria-company-${i + 1}`,
              sector: ['Agroalimentaire', 'Textile', 'Construction'][i],
              wilaya: String(16 + i),
              verified: i % 2 === 0,
              rating: (4 + Math.random()).toFixed(1),
              productsCount: Math.floor(Math.random() * 100) + 10
            })),
            meta: { queriedAt: new Date().toISOString(), apiVersion: 'v2', pagination: { page: 1, limit: 20, total: 1250, totalPages: 63 } }
          };
        } else if (url.includes('/search')) {
          mockData = {
            success: true,
            data: {
              results: [
                { type: 'product', id: 'prod_1', name: 'Search Result Product 1', score: 0.95 },
                { type: 'company', id: 'comp_1', name: 'Search Result Company', score: 0.88 },
                { type: 'rfq', id: 'rfq_1', title: 'Relevant RFQ Found', score: 0.75 }
              ],
              facets: {
                categories: [{ name: 'textile', count: 45 }, { name: 'electronics', count: 32 }],
                wilayas: [{ code: '16', name: 'Bejaia', count: 28 }]
              },
              totalResults: 156
            },
            meta: { queriedAt: new Date().toISOString(), apiVersion: 'v2' }
          };
        } else {
          mockData = {
            success: true,
            data: { message: 'API endpoint working correctly', timestamp: new Date().toISOString() },
            meta: { queriedAt: new Date().toISOString(), apiVersion: 'v2' }
          };
        }

        resolve({
          status,
          body: JSON.stringify(mockData, null, 2),
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': `req_${Date.now().toString(36)}`,
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '99',
            'X-Response-Time': `${delay}ms`,
          },
          time: delay
        });
      }, delay);
    });
  }, [method, url, environment]);

  // Handle send request
  const handleSendRequest = async () => {
    setIsLoading(true);
    setResponse('');
    setResponseStatus(null);
    setResponseTime(null);

    try {
      const result = await generateMockResponse();
      setResponse(result.body);
      setResponseStatus(result.status);
      setResponseTime(result.time);
      setResponseHeaders(result.headers);

      // Add to history
      const newHistoryEntry: HistoryEntry = {
        id: `h_${Date.now()}`,
        method,
        url,
        statusCode: result.status,
        duration: result.time,
        timestamp: new Date(),
      };
      setHistory([newHistoryEntry, ...history].slice(0, 20));
    } catch (error) {
      setResponse(JSON.stringify({
        success: false,
        error: 'Failed to connect to API server',
        code: 'CONNECTION_ERROR'
      }, null, 2));
      setResponseStatus(500);
    }

    setIsLoading(false);
  };

  // Handle save request
  const handleSaveRequest = () => {
    const newSaved: SavedRequest = {
      id: `req_${Date.now()}`,
      name: requestName || 'Untitled Request',
      method,
      url,
      headers,
      body: method !== 'GET' ? body : undefined,
      createdAt: new Date(),
    };
    setSavedRequests([newSaved, ...savedRequests]);
    setShowSaveDialog(false);
    setRequestName('');
  };

  // Load saved request
  const loadSavedRequest = (req: SavedRequest) => {
    setMethod(req.method);
    setUrl(req.url);
    setHeaders(req.headers);
    setBody(req.body || '');
  };

  // Delete saved request
  const deleteSavedRequest = (id: string) => {
    setSavedRequests(savedRequests.filter(r => r.id !== id));
  };

  // Format response as XML (mock conversion)
  const formatAsXml = (jsonStr: string): string => {
    try {
      const obj = JSON.parse(jsonStr);
      const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
      const convertToXml = (data: any, rootName: string = 'root'): string => {
        if (Array.isArray.data) {
          return data.map((item: any, i: number) => convertToXml(item, `${rootName.slice(0, -1)}`)).join('\n');
        }
        if (typeof data === 'object' && data !== null) {
          const entries = Object.entries(data);
          return `<${rootName}>\n${entries.map(([key, val]) => 
            typeof val === 'object' ? convertToXml(val, key) : `  <${key}>${val}</${key}>`
          ).join('\n')}\n</${rootName}>`;
        }
        return `<${rootName}>${data}</${rootName}>`;
      };
      return xmlHeader + convertToXml(obj, 'response');
    } catch {
      return jsonStr; // Return original if parsing fails
    }
  };

  // Copy response
  const copyResponse = async () => {
    await navigator.clipboard.writeText(response);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  // Method colors
  const getMethodColor = (m: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      PUT: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      PATCH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[m.toUpperCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-7 h-7 text-primary" />
            API Playground
          </h2>
          <p className="text-muted-foreground mt-1">
            Test API endpoints interactively in your browser
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Environment Switcher */}
          <Select value={environment} onValueChange={(v) => setEnvironment(v as Environment)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Sandbox
                </span>
              </SelectItem>
              <SelectItem value="production">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Production
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Badge variant={environment === 'production' ? 'destructive' : 'secondary'} className="gap-1">
            <AlertCircle className="w-3 h-3" />
            {environment === 'production' ? 'Live Data!' : 'Test Mode'}
          </Badge>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        {/* Left Panel - Request Builder */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Request</CardTitle>
              <div className="flex items-center gap-2">
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Save className="w-4 h-4" />
                      Save
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Request</DialogTitle>
                      <DialogDescription>
                        Give this request a name for easy access later.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Input
                        placeholder="e.g., Get Products by Category"
                        value={requestName}
                        onChange={(e) => setRequestName(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveRequest}>Save Request</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  size="sm" 
                  onClick={handleSendRequest} 
                  disabled={isLoading}
                  className="gap-1"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Method & URL */}
            <div className="flex gap-2">
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex-1 flex items-center rounded-md border bg-background overflow-hidden">
                <span className="pl-3 text-muted-foreground text-sm">
                  {environment === 'sandbox' ? 'sandbox-api.' : 'api.'}algeriatrade.dz
                </span>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="border-0 font-mono focus-visible:ring-0"
                  placeholder="/v2/endpoint"
                />
              </div>
            </div>

            {/* Headers */}
            <div>
              <Label className="mb-2 block flex items-center justify-between">
                Headers
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setHeaders({ ...headers, 'New-Header': '' })}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Header
                </Button>
              </Label>
              <div className="space-y-2 max-h-[150px] overflow-y-auto rounded-md border p-2">
                {Object.entries(headers).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[1fr_1fr_auto] gap-1">
                    <Input
                      value={key}
                      onChange={(e) => {
                        const newHeaders = { ...headers };
                        delete newHeaders[key];
                        newHeaders[e.target.value] = value;
                        setHeaders(newHeaders);
                      }}
                      placeholder="Header name"
                      className="font-mono text-xs h-8"
                    />
                    <Input
                      value={value}
                      onChange={(e) => setHeaders({ ...headers, [key]: e.target.value })}
                      placeholder="Value"
                      className="font-mono text-xs h-8"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => {
                        const newHeaders = { ...headers };
                        delete newHeaders[key];
                        setHeaders(newHeaders);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Body (for POST/PUT/PATCH) */}
            {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
              <div>
                <Label className="mb-2 block">Request Body (JSON)</Label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full min-h-[150px] p-3 rounded-md border bg-background font-mono text-sm resize-y"
                  placeholder='{"key": "value"}'
                />
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={() => loadSavedRequest(MOCK_SAVED_REQUESTS[0])}>
                <FolderOpen className="w-3 h-3" />
                Products Example
              </Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => loadSavedRequest(MOCK_SAVED_REQUESTS[1])}>
                <FolderOpen className="w-3 h-3" />
                Order Example
              </Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => loadSavedRequest(MOCK_SAVED_REQUESTS[2])}>
                <FolderOpen className="w-3 h-3" />
                Search Example
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Response */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                Response
                {responseStatus && (
                  <Badge 
                    variant={responseStatus >= 400 ? 'destructive' : responseStatus >= 300 ? 'secondary' : 'default'}
                    className={getMethodColor(String(responseStatus))}
                  >
                    {responseStatus}
                  </Badge>
                )}
                {responseTime && (
                  <span className="text-sm text-muted-foreground">{responseTime}ms</span>
                )}
              </CardTitle>
              
              {response && (
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="gap-1" onClick={copyResponse}>
                    {copiedResponse ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            {!response ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Play className="w-12 h-12 mb-3 opacity-20" />
                <p>Send a request to see the response here</p>
              </div>
            ) : (
              <Tabs defaultValue="pretty" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="pretty" className="gap-1">
                    <FileJson className="w-4 h-4" />
                    Pretty JSON
                  </TabsTrigger>
                  <TabsTrigger value="raw" className="gap-1">
                    <FileCode className="w-4 h-4" />
                    Raw
                  </TabsTrigger>
                  <TabsTrigger value="headers" className="gap-1">
                    <Settings className="w-4 h-4" />
                    Headers
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="pretty" className="mt-4">
                  <ScrollArea className="max-h-[450px]">
                    <pre className="bg-slate-950 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto font-mono leading-relaxed">
                      <code>{response}</code>
                    </pre>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="raw" className="mt-4">
                  <ScrollArea className="max-h-[450px]">
                    <pre className="bg-slate-950 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto font-mono whitespace-pre-wrap break-all">
                      <code>{response}</code>
                    </pre>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="headers" className="mt-4">
                  <div className="rounded-lg border divide-y max-h-[450px] overflow-y-auto">
                    {Object.entries(responseHeaders).map(([key, value]) => (
                      <div key={key} className="flex items-center px-4 py-2">
                        <code className="font-medium text-primary min-w-[180px]">{key}</code>
                        <span className="text-muted-foreground text-sm ml-4 break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section - Saved Requests & History */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Saved Requests */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Saved Requests ({savedRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[250px]">
              <div className="space-y-2 pr-2">
                {savedRequests.map(req => (
                  <div key={req.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group">
                    <Badge className={`shrink-0 ${getMethodColor(req.method)}`}>
                      {req.method}
                    </Badge>
                    <button 
                      className="flex-1 text-left text-sm truncate hover:text-primary"
                      onClick={() => loadSavedRequest(req)}
                    >
                      {req.name}
                    </button>
                    <code className="hidden sm:block text-xs text-muted-foreground truncate max-w-[120px]">
                      {req.url.split('?')[0]}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-7 w-7 shrink-0"
                      onClick={() => deleteSavedRequest(req.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
                
                {savedRequests.length === 0 && (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    No saved requests yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Request History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-5 h-5" />
              Recent Activity ({history.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[250px]">
              <div className="space-y-2 pr-2">
                {history.map(entry => (
                  <div key={entry.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                    <Badge className={`shrink-0 ${getMethodColor(entry.method)}`} variant="outline">
                      {entry.method}
                    </Badge>
                    <code className="flex-1 text-xs truncate">{entry.url}</code>
                    <Badge 
                      variant={entry.statusCode >= 400 ? 'destructive' : 'secondary'}
                      className="shrink-0 text-xs"
                    >
                      {entry.statusCode}
                    </Badge>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {entry.duration}ms
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                      {formatRelativeTime(entry.timestamp)}
                    </span>
                  </div>
                ))}
                
                {history.length === 0 && (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    No recent activity
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
