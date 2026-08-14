'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings2, 
  Bot, 
  DollarSign, 
  Activity, 
  Key, 
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface AIConfig {
  provider: 'openai' | 'anthropic' | 'local';
  openaiApiKey: string;
  openaiModel: string;
  anthropicApiKey: string;
  anthropicModel: string;
  smartRouting: boolean;
  dailyBudget: number;
}

interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  dailySpent: number;
  dailyBudget: number;
  providerBreakdown: Record<string, { requests: number; tokens: number; cost: number }>;
}

export default function AISettingsPage() {
  const [config, setConfig] = useState<AIConfig>({
    provider: 'local',
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini',
    anthropicApiKey: '',
    anthropicModel: 'claude-3-5-sonnet-20241022',
    smartRouting: true,
    dailyBudget: 10,
  });

  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageStats();
    fetchCurrentConfig();
  }, []);

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/admin/ai/usage');
      if (response.ok) {
        const data = await response.json();
        setUsageStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    }
  };

  const fetchCurrentConfig = async () => {
    try {
      const response = await fetch('/api/admin/ai/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        // Show success message
        alert('Configuration saved successfully!');
      } else {
        alert('Failed to save configuration');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const testProvider = async (provider: string) => {
    setTesting(provider);
    try {
      const response = await fetch('/api/admin/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`${provider} connection successful! Latency: ${data.latency}ms`);
      } else {
        alert(`${provider} connection failed: ${data.error}`);
      }
    } catch (error) {
      alert(`Error testing ${provider}`);
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Configuration</h1>
          <p className="text-muted-foreground">
            Manage AI providers, models, and usage settings
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Settings2 className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="routing" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Smart Routing
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage & Costs
          </TabsTrigger>
        </TabsList>

        {/* Provider Configuration */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Providers</CardTitle>
              <CardDescription>
                Configure OpenAI and/or Anthropic Claude for enhanced chatbot capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default Provider Selection */}
              <div className="space-y-2">
                <Label>Default Provider</Label>
                <Select
                  value={config.provider}
                  onValueChange={(value: any) => 
                    setConfig(prev => ({ ...prev, provider: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select default provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local (Rule-based) - Free</SelectItem>
                    <SelectItem value="openai">OpenAI GPT - Best for code</SelectItem>
                    <SelectItem value="anthropic">Anthropic Claude - Best for reasoning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* OpenAI Configuration */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      🤖 OpenAI GPT
                    </CardTitle>
                    <Badge variant={config.openaiApiKey ? 'default' : 'secondary'}>
                      {config.openaiApiKey ? 'Configured' : 'Not Set'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">API Key</Label>
                    <Input
                      id="openai-key"
                      type="password"
                      placeholder="sk-..."
                      value={config.openaiApiKey}
                      onChange={(e) => 
                        setConfig(prev => ({ ...prev, openaiApiKey: e.target.value }))
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={config.openaiModel}
                      onValueChange={(value) =>
                        setConfig(prev => ({ ...prev, openaiModel: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Most capable)</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Best value)</SelectItem>
                        <SelectItem value="gpt-4-turbo-preview">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Cheapest)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testProvider('openai')}
                    disabled={testing === 'openai' || !config.openaiApiKey}
                  >
                    {testing === 'openai' ? 'Testing...' : 'Test Connection'}
                  </Button>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Strengths:</strong> Code generation, structured data, function calling</p>
                    <p><strong>Pricing:</strong> $0.00015 - $0.01 per 1K tokens</p>
                    <p><strong>Latency:</strong> ~800ms average</p>
                  </div>
                </CardContent>
              </Card>

              {/* Anthropic Configuration */}
              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      🧠 Anthropic Claude
                    </CardTitle>
                    <Badge variant={config.anthropicApiKey ? 'default' : 'secondary'}>
                      {config.anthropicApiKey ? 'Configured' : 'Not Set'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="anthropic-key">API Key</Label>
                    <Input
                      id="anthropic-key"
                      type="password"
                      placeholder="sk-ant-..."
                      value={config.anthropicApiKey}
                      onChange={(e) =>
                        setConfig(prev => ({ ...prev, anthropicApiKey: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={config.anthropicModel}
                      onValueChange={(value) =>
                        setConfig(prev => ({ ...prev, anthropicModel: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="claude-sonnet-4-20250514">Claude 4 Sonnet</SelectItem>
                        <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                        <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku (Fastest)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testProvider('anthropic')}
                    disabled={testing === 'anthropic' || !config.anthropicApiKey}
                  >
                    {testing === 'anthropic' ? 'Testing...' : 'Test Connection'}
                  </Button>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Strengths:</strong> Complex reasoning, nuanced analysis, safety</p>
                    <p><strong>Pricing:</strong> $0.00025 - $0.003 per 1K tokens</p>
                    <p><strong>Latency:</strong> ~1200ms average</p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smart Routing */}
        <TabsContent value="routing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Intelligent Routing
              </CardTitle>
              <CardDescription>
                Automatically route queries to the best AI provider based on complexity and content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Smart Routing</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically select the best provider for each query type
                  </p>
                </div>
                <Switch
                  checked={config.smartRouting}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, smartRouting: checked }))
                  }
                />
              </div>

              {config.smartRouting && (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Simple Queries</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-green-600">Local</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Fast responses, no cost
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Code & Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-blue-600">OpenAI</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Best for technical tasks
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Complex Reasoning</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-orange-600">Claude</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Deep analysis & nuance
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <h4 className="font-medium mb-2">How it works:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Simple questions (FAQs, basic info) → Local rule-based system</li>
                      <li>• Code, APIs, debugging → OpenAI GPT models</li>
                      <li>• Complex analysis, strategy → Anthropic Claude</li>
                      <li>• Arabic language queries → OpenAI (better multilingual support)</li>
                      <li>• Budget exceeded → Automatic fallback to local</li>
                    </ul>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Daily Budget ($)</Label>
                <Input
                  type="number"
                  min="0"
                  max="1000"
                  step="0.50"
                  value={config.dailyBudget}
                  onChange={(e) =>
                    setConfig(prev => ({ ...prev, dailyBudget: parseFloat(e.target.value) || 0 }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  When this limit is reached, all queries will use the free local provider
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Statistics */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats?.totalRequests || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(usageStats?.totalTokens || 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(usageStats?.dailySpent || 0).toFixed(4)}
                </div>
                <p className="text-xs text-muted-foreground">
                  of ${(usageStats?.dailyBudget || 0).toFixed(2)} budget
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageStats && usageStats.dailyBudget > 0
                    ? ((usageStats.dailySpent / usageStats.dailyBudget) * 100).toFixed(1)
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Provider Breakdown</CardTitle>
              <CardDescription>
                Usage statistics by AI provider today
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usageStats?.providerBreakdown && Object.keys(usageStats.providerBreakdown).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(usageStats.providerBreakdown).map(([provider, stats]) => (
                    <div key={provider} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          provider === 'openai' ? 'bg-green-500' :
                          provider === 'anthropic' ? 'bg-orange-500' :
                          'bg-gray-500'
                        }`} />
                        <span className="font-medium capitalize">{provider}</span>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-semibold">{stats.requests}</p>
                          <p className="text-muted-foreground">Requests</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{stats.tokens.toLocaleString()}</p>
                          <p className="text-muted-foreground">Tokens</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">${stats.cost.toFixed(4)}</p>
                          <p className="text-muted-foreground">Cost</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No usage data available yet. Once you start using AI features, statistics will appear here.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
