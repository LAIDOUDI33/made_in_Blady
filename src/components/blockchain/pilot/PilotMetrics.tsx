'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Award,
  Users,
  DollarSign,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calculator,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Activity
} from 'lucide-react';

// Types
interface KPIData {
  name: string;
  current: number;
  target: number;
  unit: string;
  category: 'technical' | 'operational' | 'business';
  trend: 'up' | 'down' | 'stable';
  status: 'exceeding' | 'on_track' | 'at_risk' | 'critical';
}

interface BaselineComparison {
  metric: string;
  beforePilot: number;
  currentPilot: number;
  improvement: number;
  unit: string;
}

interface ROIInput {
  // Current Costs (Annual)
  currentTraceabilityCost: number;    // DZD
  currentCertificationCost: number;   // DZD
  currentComplaintHandlingCost: number; // DZD
  currentAuditPreparationCost: number;  // DZD
  
  // Investment
  annualSubscriptionCost: number;      // DZD
  implementationCost: number;          // DZD one-time
  trainingCost: number;               // DZD one-time
  hardwareCost: number;               // DZD one-time
  
  // Expected Improvements (%)
  traceabilitySavingsPercent: number;
  certificationSavingsPercent: number;
  complaintReductionPercent: number;
  auditEfficiencyGainPercent: number;
}

interface ROICalculation {
  firstYearInvestment: number;
  firstYearSavings: number;
  firstYearROI: number;
  secondYearROI: number;
  thirdYearROI: number;
  paybackPeriodMonths: number;
  netPresentValue: number;
}

// Mock Data
const mockKPIs: KPIData[] = [
  { name: 'Tracking Coverage', current: 67, target: 80, unit: '%', category: 'technical', trend: 'up', status: 'on_track' },
  { name: 'Event Accuracy', current: 98.5, target: 99, unit: '%', category: 'technical', trend: 'up', status: 'exceeding' },
  { name: 'Certificate Rate', current: 51, target: 90, unit: '%', category: 'technical', trend: 'up', status: 'at_risk' },
  { name: 'Verification Success', current: 99.2, target: 99.9, unit: '%', category: 'technical', trend: 'stable', status: 'on_track' },
  { name: 'User Adoption', current: 85, target: 85, unit: '%', category: 'operational', trend: 'up', status: 'exceeding' },
  { name: 'Daily Active Users', current: 12, target: 14, unit: '', category: 'operational', trend: 'up', status: 'on_track' },
  { name: 'Events Per User/Day', current: 3.8, target: 5, unit: '', category: 'operational', trend: 'stable', status: 'at_risk' },
  { name: 'Avg Processing Time', current: 1.8, target: 2, unit: 'min', category: 'operational', trend: 'down', status: 'exceeding' },
  { name: 'Customer Satisfaction', current: 4.2, target: 4.5, unit: '/5', category: 'business', trend: 'up', status: 'on_track' },
  { name: 'Support Tickets/Week', current: 3, target: 5, unit: '', category: 'business', trend: 'down', status: 'exceeding' }
];

const baselineData: BaselineComparison[] = [
  { metric: 'Product Traceability Time', beforePilot: 45, currentPilot: 12, improvement: 73.3, unit: 'minutes' },
  { metric: 'Certificate Generation Time', beforePilot: 120, currentPilot: 8, improvement: 93.3, unit: 'minutes' },
  { metric: 'Customer Complaints (Monthly)', beforePilot: 24, currentPilot: 7, improvement: 70.8, unit: '' },
  { metric: 'Audit Preparation Days', beforePilot: 10, currentPilot: 3, improvement: 70, unit: 'days' },
  { metric: 'Data Entry Errors (%)', beforePilot: 15, currentPilot: 0.5, improvement: 96.7, unit: '%' },
  { metric: 'Shipment Discrepancies', beforePilot: 8, currentPilot: 1, improvement: 87.5, unit: '/month' },
  { metric: 'Customer Verification Requests', beforePilot: 0, currentPilot: 156, improvement: 0, unit: '/month (new)' }
];

const defaultROIInputs: ROIInput = {
  currentTraceabilityCost: 2500000,
  currentCertificationCost: 800000,
  currentComplaintHandlingCost: 500000,
  currentAuditPreparationCost: 400000,
  annualSubscriptionCost: 1200000,
  implementationCost: 800000,
  trainingCost: 150000,
  hardwareCost: 300000,
  traceabilitySavingsPercent: 40,
  certificationSavingsPercent: 30,
  complaintReductionPercent: 60,
  auditEfficiencyGainPercent: 50
};

export function PilotMetrics() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [roiInputs, setRoiInputs] = useState<ROIInput>(defaultROIInputs);
  const [showROICalculator, setShowROICalculator] = useState(false);

  // Filter KPIs by category
  const filteredKPIs = useMemo(() => {
    if (selectedCategory === 'all') return mockKPIs;
    return mockKPIs.filter(kpi => kpi.category === selectedCategory);
  }, [selectedCategory]);

  // Calculate ROI
  const roiCalculation = useMemo((): ROICalculation => {
    const firstYearInvestment = roiInputs.implementationCost + 
                               roiInputs.trainingCost + 
                               roiInputs.hardwareCost +
                               roiInputs.annualSubscriptionCost;

    const firstYearSavings = 
      (roiInputs.currentTraceabilityCost * roiInputs.traceabilitySavingsPercent / 100) +
      (roiInputs.currentCertificationCost * roiInputs.certificationSavingsPercent / 100) +
      (roiInputs.currentComplaintHandlingCost * roiInputs.complaintReductionPercent / 100) +
      (roiInputs.currentAuditPreparationCost * roiInputs.auditEfficiencyGainPercent / 100);

    const firstYearROI = ((firstYearSavings - firstYearInvestment) / firstYearInvestment) * 100;
    
    // Subsequent years only have subscription cost
    const subsequentYearNet = firstYearSavings - roiInputs.annualSubscriptionCost;
    const secondYearROI = (subsequentYearNet / roiInputs.annualSubscriptionCost) * 100;
    const thirdYearROI = secondYearROI;

    // Simple payback calculation
    const monthlySavings = firstYearSavings / 12;
    const paybackPeriodMonths = Math.ceil(firstYearInvestment / monthlySavings);

    // Simplified NPV (assuming 10% discount rate)
    const discountRate = 0.10;
    const npv = -firstYearInvestment + 
                firstYearSavings / (1 + discountRate) +
                subsequentYearNet / Math.pow(1 + discountRate, 2) +
                subsequentYearNet / Math.pow(1 + discountRate, 3);

    return {
      firstYearInvestment,
      firstYearSavings,
      firstYearROI,
      secondYearROI,
      thirdYearROI,
      paybackPeriodMonths,
      netPresentValue: npv
    };
  }, [roiInputs]);

  // Calculate overall success probability
  const successProbability = useMemo(() => {
    const weights = { technical: 0.4, operational: 0.35, business: 0.25 };
    let weightedScore = 0;

    Object.entries(weights).forEach(([category, weight]) => {
      const categoryKPIs = mockKPIs.filter(k => k.category === category);
      const avgAchievement = categoryKPIs.reduce((sum, kpi) => sum + (kpi.current / kpi.target), 0) / categoryKPIs.length;
      weightedScore += Math.min(avgAchievement, 1.2) * weight; // Cap at 120%
    });

    return Math.min(Math.round(weightedScore * 100), 100);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'exceeding': return <Badge className="bg-green-100 text-green-800">Exceeding</Badge>;
      case 'on_track': return <Badge className="bg-blue-100 text-blue-800">On Track</Badge>;
      case 'at_risk': return <Badge className="bg-yellow-100 text-yellow-800">At Risk</Badge>;
      case 'critical': return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getSuccessProbabilityColor = (prob: number) => {
    if (prob >= 80) return 'text-green-600 bg-green-100';
    if (prob >= 60) return 'text-blue-600 bg-blue-100';
    if (prob >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const overallScore = Math.round(
    (mockKPIs.reduce((sum, kpi) => sum + Math.min((kpi.current / kpi.target) * 100, 100), 0)) / mockKPIs.length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pilot Metrics & Analytics</h1>
          <p className="text-gray-600 mt-1">
            Key performance indicators and ROI analysis for your pilot program
          </p>
        </div>
        <Button onClick={() => setShowROICalculator(!showROICalculator)}>
          <Calculator className="w-4 h-4 mr-2" />
          ROI Calculator
        </Button>
      </div>

      {/* Overall Score Card */}
      <Card className={`bg-gradient-to-r ${
        successProbability >= 80 ? 'from-green-500 to-emerald-600' :
        successProbability >= 60 ? 'from-blue-500 to-indigo-600' :
        'from-orange-500 to-red-600'
      } text-white`}>
        <CardContent className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="md:col-span-1">
              <p className="text-sm opacity-90">Overall Pilot Score</p>
              <p className="text-5xl font-bold mt-1">{overallScore}</p>
              <p className="text-sm opacity-75 mt-1">out of 100 points</p>
            </div>
            
            <div className="md:col-span-1 text-center">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getSuccessProbabilityColor(successProbability)}`}>
                <span className="text-3xl font-bold">{successProbability}%</span>
              </div>
              <p className="mt-2 font-medium">Success Probability</p>
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur">
                <p className="text-xs opacity-75">Technical Score</p>
                <p className="text-xl font-bold">
                  {Math.round(mockKPIs.filter(k => k.category === 'technical')
                    .reduce((sum, k) => sum + Math.min(k.current/k.target*100, 100), 0) / 4)}
                </p>
              </div>
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur">
                <p className="text-xs opacity-75">Operational Score</p>
                <p className="text-xl font-bold">
                  {Math.round(mockKPIs.filter(k => k.category === 'operational')
                    .reduce((sum, k) => sum + Math.min(k.current/k.target*100, 100), 0) / 4)}
                </p>
              </div>
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur">
                <p className="text-xs opacity-75">Business Score</p>
                <p className="text-xl font-bold">
                  {Math.round(mockKPIs.filter(k => k.category === 'business')
                    .reduce((sum, k) => sum + Math.min(k.current/k.target*100, 100), 0) / 2)}
                </p>
              </div>
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur">
                <p className="text-xs opacity-75">Recommendation</p>
                <p className="text-xl font-bold">
                  {successProbability >= 70 ? 'GO ✓' : successProbability >= 50 ? 'REVIEW ⚠' : 'NO-GO ✗'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-emerald-600" />
              {getTrendIcon(mockKPIs[0].trend)}
            </div>
            <p className="text-sm text-gray-500">Tracking Coverage</p>
            <p className="text-3xl font-bold">{mockKPIs[0].current}%</p>
            <Progress value={mockKPIs[0].current} className="mt-3" />
            <p className="text-xs text-gray-400 mt-1">Target: {mockKPIs[0].target}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
              {getTrendIcon(mockKPIs[1].trend)}
            </div>
            <p className="text-sm text-gray-500">Event Accuracy</p>
            <p className="text-3xl font-bold">{mockKPIs[1].current}%</p>
            <Progress value={mockKPIs[1].current} className="mt-3" />
            <p className="text-xs text-gray-400 mt-1">Target: {mockKPIs[1].target}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 text-purple-600" />
              {getTrendIcon(mockKPIs[2].trend)}
            </div>
            <p className="text-sm text-gray-500">Certificate Rate</p>
            <p className="text-3xl font-bold">{mockKPIs[2].current}%</p>
            <Progress value={mockKPIs[2].current} className="mt-3" />
            <p className="text-xs text-gray-400 mt-1">Target: {mockKPIs[2].target}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-orange-600" />
              {getTrendIcon(mockKPIs[4].trend)}
            </div>
            <p className="text-sm text-gray-500">User Adoption</p>
            <p className="text-3xl font-bold">{mockKPIs[4].current}%</p>
            <Progress value={mockKPIs[4].current} className="mt-3" />
            <p className="text-xs text-gray-400 mt-1">Target: {mockKPIs[4].target}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detailed KPI Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Key Performance Indicators
                </CardTitle>
                <CardDescription>Detailed metrics by category</CardDescription>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>KPI</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKPIs.map((kpi, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{kpi.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{kpi.current}{kpi.unit}</span>
                        {getTrendIcon(kpi.trend)}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">{kpi.target}{kpi.unit}</TableCell>
                    <TableCell>{getStatusBadge(kpi.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Baseline Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Pre-Pilot vs Current Performance
            </CardTitle>
            <CardDescription>Improvements since pilot start</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {baselineData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{item.metric}</span>
                    <Badge className={
                      item.improvement > 50 ? 'bg-green-100 text-green-800' :
                      item.improvement > 20 ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {item.improvement > 0 ? '+' : ''}{item.improvement}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Before: {item.beforePilot} {item.unit}</span>
                        <span>Current: {item.currentPilot} {item.unit}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                          style={{ width: `${Math.min(item.improvement, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {index < baselineData.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Calculator Section */}
      {showROICalculator && (
        <Card className="border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
              <Calculator className="w-5 h-5" />
              Return on Investment (ROI) Calculator
            </CardTitle>
            <CardDescription>
              Estimate your financial returns from full blockchain implementation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Form */}
              <div className="space-y-6">
                <h3 className="font-semibold text-gray-900 border-b pb-2">Current Annual Costs (Before Blockchain)</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="traceCost">Traceability Operations</Label>
                    <Input
                      id="traceCost"
                      type="number"
                      value={roiInputs.currentTraceabilityCost}
                      onChange={(e) => setRoiInputs({...roiInputs, currentTraceabilityCost: Number(e.target.value)})}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500">DZD/year</p>
                  </div>
                  <div>
                    <Label htmlFor="certCost">Certificate Management</Label>
                    <Input
                      id="certCost"
                      type="number"
                      value={roiInputs.currentCertificationCost}
                      onChange={(e) => setRoiInputs({...roiInputs, currentCertificationCost: Number(e.target.value)})}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500">DZD/year</p>
                  </div>
                  <div>
                    <Label htmlFor="complaintCost">Complaint Handling</Label>
                    <Input
                      id="complaintCost"
                      type="number"
                      value={roiInputs.currentComplaintHandlingCost}
                      onChange={(e) => setRoiInputs({...roiInputs, currentComplaintHandlingCost: Number(e.target.value)})}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500">DZD/year</p>
                  </div>
                  <div>
                    <Label htmlFor="auditCost">Audit Preparation</Label>
                    <Input
                      id="auditCost"
                      type="number"
                      value={roiInputs.currentAuditPreparationCost}
                      onChange={(e) => setRoiInputs({...roiInputs, currentAuditPreparationCost: Number(e.target.value)})}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500">DZD/year</p>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 border-b pb-2 pt-4">Investment Required</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subCost">Annual Subscription</Label>
                    <Input
                      id="subCost"
                      type="number"
                      value={roiInputs.annualSubscriptionCost}
                      onChange={(e) => setRoiInputs({...roiInputs, annualSubscriptionCost: Number(e.target.value)})}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500">DZD/year</p>
                  </div>
                  <div>
                    <Label htmlFor="implCost">Implementation (One-time)</Label>
                    <Input
                      id="implCost"
                      type="number"
                      value={roiInputs.implementationCost}
                      onChange={(e) => setRoiInputs({...roiInputs, implementationCost: Number(e.target.value)})}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500">DZD</p>
                  </div>
                  <div>
                    <Label htmlFor="trainCost">Training (One-time)</Label>
                    <Input
                      id="trainCost"
                      type="number"
                      value={roiInputs.trainingCost}
                      onChange={(e) => setRoiInputs({...roiInputs, trainingCost: Number(e.target.value)})}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500">DZD</p>
                  </div>
                  <div>
                    <Label htmlFor="hwCost">Hardware (One-time)</Label>
                    <Input
                      id="hwCost"
                      type="number"
                      value={roiInputs.hardwareCost}
                      onChange={(e) => setRoiInputs({...roiInputs, hardwareCost: Number(e.target.value)})}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500">DZD</p>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 border-b pb-2 pt-4">Expected Efficiency Gains (%)</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="traceSave">Traceability Savings</Label>
                    <Input
                      id="traceSave"
                      type="number"
                      min="0"
                      max="100"
                      value={roiInputs.traceabilitySavingsPercent}
                      onChange={(e) => setRoiInputs({...roiInputs, traceabilitySavingsPercent: Number(e.target.value)})}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500">% reduction</p>
                  </div>
                  <div>
                    <Label htmlFor="certSave">Certification Savings</Label>
                    <Input
                      id="certSave"
                      type="number"
                      min="0"
                      max="100"
                      value={roiInputs.certificationSavingsPercent}
                      onChange={(e) => setRoiInputs({...roiInputs, certificationSavingsPercent: Number(e.target.value)})}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500">% reduction</p>
                  </div>
                  <div>
                    <Label htmlFor="complaintRed">Complaint Reduction</Label>
                    <Input
                      id="complaintRed"
                      type="number"
                      min="0"
                      max="100"
                      value={roiInputs.complaintReductionPercent}
                      onChange={(e) => setRoiInputs({...roiInputs, complaintReductionPercent: Number(e.target.value)})}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500">% reduction</p>
                  </div>
                  <div>
                    <Label htmlFor="auditEff">Audit Efficiency Gain</Label>
                    <Input
                      id="auditEff"
                      type="number"
                      min="0"
                      max="100"
                      value={roiInputs.auditEfficiencyGainPercent}
                      onChange={(e) => setRoiInputs({...roiInputs, auditEfficiencyGainPercent: Number(e.target.value)})}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500">% time savings</p>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 space-y-6">
                <h3 className="font-semibold text-purple-900 text-lg">ROI Analysis Results</h3>
                
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-white">
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-sm text-gray-500">Year 1 ROI</p>
                      <p className={`text-2xl font-bold ${roiCalculation.firstYearROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {roiCalculation.firstYearROI.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white">
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-sm text-gray-500">Year 2+ ROI</p>
                      <p className="text-2xl font-bold text-green-600">
                        {roiCalculation.secondYearROI.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Financial Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">First Year Investment:</span>
                    <span className="font-medium">{formatCurrency(roiCalculation.firstYearInvestment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">First Year Savings:</span>
                    <span className="font-medium text-green-600">{formatCurrency(roiCalculation.firstYearSavings)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">First Year Net:</span>
                    <span className={`font-bold ${roiCalculation.firstYearSavings - roiCalculation.firstYearInvestment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(roiCalculation.firstYearSavings - roiCalculation.firstYearInvestment)}
                    </span>
                  </div>
                  
                  <Separator />

                  <div className="flex justify-between">
                    <span className="text-gray-600">Payback Period:</span>
                    <span className="font-bold">{roiCalculation.paybackPeriodMonths} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">3-Year NPV (10%):</span>
                    <span className={`font-bold ${roiCalculation.netPresentValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(roiCalculation.netPresentValue)}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Recommendation */}
                <div className={`p-4 rounded-lg ${
                  roiCalculation.secondYearROI > 60 ? 'bg-green-100 border border-green-300' :
                  roiCalculation.secondYearROI > 30 ? 'bg-yellow-100 border border-yellow-300' :
                  'bg-red-100 border border-red-300'
                }`}>
                  <div className="flex items-start gap-3">
                    {roiCalculation.secondYearROI > 60 ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                    ) : roiCalculation.secondYearROI > 30 ? (
                      <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                    ) : (
                      <Info className="w-6 h-6 text-red-600 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {roiCalculation.secondYearROI > 60 ? 'Strong Investment Recommended' :
                         roiCalculation.secondYearROI > 30 ? 'Moderate Investment - Review Parameters' :
                         'Re-evaluate Cost Structure'}
                      </p>
                      <p className="text-sm mt-1">
                        {roiCalculation.secondYearROI > 60 
                          ? `Expected ${roiCalculation.secondYearROI.toFixed(0)}% annual returns after initial payback period of ${roiCalculation.paybackPeriodMonths} months.`
                          : roiCalculation.secondYearROI > 30
                          ? 'Consider increasing efficiency gains or negotiating subscription costs.'
                          : 'Current parameters suggest limited ROI. Consider phased implementation.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Probability Indicator */}
      {!showROICalculator && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Full Rollout Success Probability
            </CardTitle>
            <CardDescription>Based on current pilot performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Probability Gauge */}
              <div className="flex flex-col items-center justify-center p-6">
                <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${
                  successProbability >= 80 ? 'bg-green-100' :
                  successProbability >= 60 ? 'bg-blue-100' :
                  successProbability >= 40 ? 'bg-yellow-100' :
                  'bg-red-100'
                }`}>
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="45"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50" cy="50" r="45"
                      fill="none"
                      stroke={successProbability >= 80 ? '#22c55e' : successProbability >= 60 ? '#3b82f6' : successProbability >= 40 ? '#eab308' : '#ef4444'}
                      strokeWidth="8"
                      strokeDasharray={`${successProbability * 2.83} 283`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-3xl font-bold">{successProbability}%</span>
                </div>
                <p className="mt-4 font-semibold text-lg">
                  {successProbability >= 80 ? 'Highly Likely to Succeed' :
                   successProbability >= 60 ? 'Good Chance of Success' :
                   successProbability >= 40 ? 'Moderate Risk' :
                   'High Risk - Intervention Needed'}
                </p>
              </div>

              {/* Strengths */}
              <div className="space-y-3">
                <h4 className="font-semibold text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Strengths
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Event accuracy exceeding targets (98.5%)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Strong user adoption rate (85%)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Fast processing times (&lt;2 min avg)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Low support ticket volume</span>
                  </li>
                </ul>
              </div>

              {/* Areas for Improvement */}
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>Certificate generation rate needs acceleration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>Increase events per user per day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>Expand product registration coverage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>Gather more customer feedback data</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PilotMetrics;
