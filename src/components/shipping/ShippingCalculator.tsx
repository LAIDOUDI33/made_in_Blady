'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Truck,
  Calculator,
  MapPin,
  Clock,
  Info,
  Package,
  Weight,
  Ruler,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  FileText,
  Shield,
  Navigation,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export type ShippingMethod = 'standard' | 'express' | 'same_day' | 'economy' | 'freight';

export type Incoterm = 'EXW' | 'FCA' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP';

export interface WilayaData {
  code: string;
  name: string;
  arabicName?: string;
  region: string; // Nord, Sud, Est, Ouest, Hauts Plateaux
  distanceFromAlgiers: number; // in km (approximate)
}

export interface ShippingRate {
  method: ShippingMethod;
  basePrice: number;
  pricePerKg?: number;
  estimatedDays: { min: number; max: number };
  available: boolean;
  description?: string;
}

export interface ShippingCalculationResult {
  originWilaya: WilayaData;
  destinationWilaya: WilayaData;
  distance: number;
  selectedMethod: ShippingMethod;
  methodRate: ShippingRate;
  subtotal: number;
  insuranceFee?: number;
  fuelSurcharge?: number;
  handlingFee?: number;
  totalCost: number;
  currency: string;
  estimatedDelivery: { min: Date; max: Date };
}

interface ShippingCalculatorProps {
  rates?: Record<string, ShippingRate[]>;
  origin?: string; // wilaya code
  destination?: string; // wilaya code
  onCalculate?: (result: ShippingCalculationResult) => void;
  className?: string;
  currency?: string;
  showInsuranceOption?: boolean;
}

// Algerian Wilayas data (comprehensive list)
const algerianWilayas: WilayaData[] = [
  { code: '01', name: 'Adrar', region: 'Sud', distanceFromAlgiers: 1500 },
  { code: '02', name: 'Chlef', region: 'Nord', distanceFromAlgiers: 200 },
  { code: '03', name: 'Laghouat', region: 'Hauts Plateaux', distanceFromAlgiers: 400 },
  { code: '04', name: 'Oum El Bouaghi', region: 'Est', distanceFromAlgiers: 500 },
  { code: '05', name: 'Batna', region: 'Hauts Plateaux', distanceFromAlgiers: 430 },
  { code: '06', name: 'Béjaïa', region: 'Nord', distanceFromAlgiers: 250 },
  { code: '07', name: 'Biskra', region: 'Hauts Plateaux', distanceFromAlgiers: 420 },
  { code: '08', name: 'Béchar', region: 'Sud', distanceFromAlgiers: 1200 },
  { code: '09', name: 'Blida', region: 'Nord', distanceFromAlgiers: 50 },
  { code: '10', name: 'Bouira', region: 'Hauts Plateaux', distanceFromAlgiers: 110 },
  { code: '11', name: 'Tamanrasset', region: 'Sud', distanceFromAlgiers: 2000 },
  { code: '12', name: 'Tébessa', region: 'Est', distanceFromAlgiers: 650 },
  { code: '13', name: 'Tizi Ouzou', region: 'Nord', distanceFromAlgiers: 100 },
  { code: '14', name: 'Alger', region: 'Nord', distanceFromAlgiers: 0 },
  { code: '15', name: 'Djelfa', region: 'Hauts Plateaux', distanceFromAlgiers: 280 },
  { code: '16', name: 'Jijel', region: 'Nord', distanceFromAlgiers: 300 },
  { code: '17', name: 'Sétif', region: 'Est', distanceFromAlgiers: 300 },
  { code: '18', name: 'Saïda', region: 'Ouest', distanceFromAlgiers: 450 },
  { code: '19', name: 'Skikda', region: 'Nord', distanceFromAlgiers: 500 },
  { code: '20', name: 'Sidi Bel Abbès', region: 'Ouest', distanceFromAlgiers: 400 },
  { code: '21', name: 'Annaba', region: 'Nord', distanceFromAlgiers: 600 },
  { code: '22', name: 'Guelma', region: 'Est', distanceFromAlgiers: 550 },
  { code: '23', name: 'Constantine', region: 'Est', distanceFromAlgiers: 420 },
  { code: '24', name: 'Médéa', region: 'Hauts Plateaux', distanceFromAlgiers: 90 },
  { code: '25', name: 'Mostaganem', region: 'Nord', distanceFromAlgiers: 350 },
  { code: "26", name: "M'Sila", region: 'Hauts Plateaux', distanceFromAlgiers: 250 },
  { code: '27', name: 'Mascara', region: 'Ouest', distanceFromAlgiers: 380 },
  { code: '28', name: 'Ouargla', region: 'Sud', distanceFromAlgiers: 800 },
  { code: '29', name: 'Oran', region: 'Nord', distanceFromAlgiers: 400 },
  { code: '30', name: 'El Bayadh', region: 'Ouest', distanceFromAlgiers: 600 },
  { code: '31', name: 'Illizi', region: 'Sud', distanceFromAlgiers: 1600 },
  { code: '32', name: 'Bordj Bou Arréridj', region: 'Hauts Plateaux', distanceFromAlgiers: 200 },
  { code: '33', name: 'Boumerdès', region: 'Nord', distanceFromAlgiers: 60 },
  { code: '34', name: 'El Tarf', region: 'Nord', distanceFromAlgiers: 700 },
  { code: '35', name: 'Tindouf', region: 'Sud', distanceFromAlgiers: 1800 },
  { code: '36', name: 'Tissemsilt', region: 'Ouest', distanceFromAlgiers: 200 },
  { code: '37', name: 'El Oued', region: 'Sud', distanceFromAlgiers: 620 },
  { code: '38', name: 'Khenchela', region: 'Est', distanceFromAlgiers: 580 },
  { code: '39', name: 'Souk Ahras', region: 'Est', distanceFromAlgiers: 620 },
  { code: '40', name: 'Tipaza', region: 'Nord', distanceFromAlgiers: 60 },
  { code: '41', name: 'Mila', region: 'Est', distanceFromAlgiers: 480 },
  { code: '42', name: 'Aïn Defla', region: 'Nord', distanceFromAlgiers: 150 },
  { code: '43', name: 'Naâma', region: 'Sud', distanceFromAlgiers: 1000 },
  { code: '44', name: 'Aïn Témouchent', region: 'Nord', distanceFromAlgiers: 500 },
  { code: '45', name: 'Ghardaïa', region: 'Sud', distanceFromAlgiers: 600 },
  { code: '46', name: 'Relizane', region: 'Ouest', distanceFromAlgiers: 280 },
  { code: '47', name: 'El M\'Ghair', region: 'Sud', distanceFromAlgiers: 650 },
  { code: '48', name: 'El Meniaa', region: 'Sud', distanceFromAlgiers: 1100 },
  { code: '49', name: 'Ouled Djellal', region: 'Hauts Plateaux', distanceFromAlgiers: 400 },
  { code: '50', name: 'Bordj Badji Mokhtar', region: 'Sud', distanceFromAlgiers: 1900 },
  { code: '51', name: 'Béni Abbès', region: 'Sud', distanceFromAlgiers: 1200 },
  { code: '52', name: 'Timimoun', region: 'Sud', distanceFromAlgiers: 1100 },
  { code: '53', name: 'Touggourt', region: 'Sud', distanceFromAlgiers: 700 },
  { code: '54', name: 'Djanet', region: 'Sud', distanceFromAlgiers: 2300 },
  { code: '55', name: 'In Salah', region: 'Sud', distanceFromAlgiers: 1300 },
  { code: '56', name: 'In Guezzam', region: 'Sud', distanceFromAlgiers: 2100 },
  { code: '57', name: 'Tamanrasset (new)', region: 'Sud', distanceFromAlgiers: 2000 },
  { code: '58', name: 'El Meghaier', region: 'Sud', distanceFromAlgiers: 670 },
];

// Default shipping rates by region type
const defaultRates: Record<string, ShippingRate[]> = {
  local: [
    {
      method: 'standard',
      basePrice: 500,
      pricePerKg: 50,
      estimatedDays: { min: 1, max: 2 },
      available: true,
      description: 'Livraison standard en ville',
    },
    {
      method: 'express',
      basePrice: 800,
      pricePerKg: 80,
      estimatedDays: { min: 1, max: 1 },
      available: true,
      description: 'Livraison express le jour même',
    },
    {
      method: 'same_day',
      basePrice: 1500,
      pricePerKg: 150,
      estimatedDays: { min: 0, max: 0 },
      available: true,
      description: 'Livraison dans la journée',
    },
    {
      method: 'economy',
      basePrice: 350,
      pricePerKg: 30,
      estimatedDays: { min: 3, max: 5 },
      available: true,
      description: 'Livraison économique',
    },
  ],
  regional: [
    {
      method: 'standard',
      basePrice: 800,
      pricePerKg: 80,
      estimatedDays: { min: 2, max: 3 },
      available: true,
      description: 'Livraison standard régionale',
    },
    {
      method: 'express',
      basePrice: 1400,
      pricePerKg: 120,
      estimatedDays: { min: 1, max: 2 },
      available: true,
      description: 'Livraison express régionale',
    },
    {
      method: 'economy',
      basePrice: 600,
      pricePerKg: 50,
      estimatedDays: { min: 4, max: 7 },
      available: true,
      description: 'Livraison économique',
    },
    {
      method: 'freight',
      basePrice: 450,
      pricePerKg: 40,
      estimatedDays: { min: 5, max: 10 },
      available: true,
      description: 'Transport de marchandises',
    },
  ],
  national: [
    {
      method: 'standard',
      basePrice: 1500,
      pricePerKg: 120,
      estimatedDays: { min: 3, max: 5 },
      available: true,
      description: 'Livraison standard nationale',
    },
    {
      method: 'express',
      basePrice: 2500,
      pricePerKg: 180,
      estimatedDays: { min: 2, max: 3 },
      available: true,
      description: 'Livraison express nationale',
    },
    {
      method: 'economy',
      basePrice: 1000,
      pricePerKg: 80,
      estimatedDays: { min: 5, max: 10 },
      available: true,
      description: 'Livraison économique nationale',
    },
    {
      method: 'freight',
      basePrice: 800,
      pricePerKg: 60,
      estimatedDays: { min: 7, max: 14 },
      available: true,
      description: 'Transport de fret national',
    },
  ],
  south: [
    {
      method: 'standard',
      basePrice: 2500,
      pricePerKg: 200,
      estimatedDays: { min: 4, max: 7 },
      available: true,
      description: 'Livraison vers le sud',
    },
    {
      method: 'express',
      basePrice: 4000,
      pricePerKg: 300,
      estimatedDays: { min: 2, max: 4 },
      available: true,
      description: 'Express vers le sud',
    },
    {
      method: 'freight',
      basePrice: 1800,
      pricePerKg: 120,
      estimatedDays: { min: 7, max: 14 },
      available: true,
      description: 'Fret vers le sud',
    },
  ],
};

// Incoterms explanations
const incotermsInfo: Record<Incoterm, { fullName: string; description: string; sellerResponsibility: string; buyerResponsibility: string }> = {
  EXW: {
    fullName: 'Ex Works (Départ usine)',
    description: 'Le vendeur met la disposition de l\'acheteur les marchandises dans ses locaux.',
    sellerResponsibility: 'Emballage minimal, mise à disposition',
    buyerResponsibility: 'Chargement, transport principal, assurance, douane',
  },
  FCA: {
    fullName: 'Free Carrier (Franco transporteur)',
    description: 'Le vendeur remet les marchandises au transporteur désigné par l\'acheteur.',
    sellerResponsibility: 'Chargement, export clearance',
    buyerResponsibility: 'Transport principal, assurance, import clearance',
  },
  CPT: {
    fullName: 'Carriage Paid To (Port payé jusqu\'à)',
    description: 'Le vendeur paie le transport jusqu\'au lieu de destination convenu.',
    sellerResponsibility: 'Export clearance, transport principal',
    buyerResponsurance: 'Assurance, risques après chargement, import clearance',
    buyerResponsibility: 'Assurance, risques après chargement, import clearance',
  },
  CIP: {
    fullName: 'Carriage and Insurance Paid To (Port payé, assurance comprise)',
    description: 'Similaire au CPT mais le vendeur doit aussi souscrire une assurance.',
    sellerResponsibility: 'Export clearance, transport principal, assurance',
    buyerResponsibility: 'Risques après chargement, import clearance',
  },
  DAP: {
    fullName: 'Delivered at Place (Rendu lieu de destination)',
    description: 'Le vendeur livre lorsque les marchandises sont mises à disposition.',
    sellerResponsibility: 'Transport jusqu\'à destination, déchargement non inclus',
    buyerResponsibility: 'Import clearance, déchargement',
  },
  DPU: {
    fullName: 'Delivered at Place Unloaded (Rendu lieu déchargé)',
    description: 'Le vendeur livre et décharge les marchandises au lieu de destination.',
    sellerResponsibility: 'Transport complet, déchargement',
    buyerResponsibility: 'Import clearance',
  },
  DDP: {
    fullName: 'Delivered Duty Paid (Rendu droits acquittés)',
    description: 'Le vendeur assume tous les coûts et risques.',
    sellerResponsibility: 'Tout (transport, assurance, douanes)',
    buyerResponsibility: 'Déchargement uniquement',
  },
};

// Method configuration
const methodConfig: Record<ShippingMethod, { label: string; icon: React.ReactNode; color: string }> = {
  standard: { label: 'Standard', icon: <Truck className="h-5 w-5" />, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  express: { label: 'Express', icon: <Package className="h-5 w-5" />, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  same_day: { label: 'Même jour', icon: <Clock className="h-5 w-5" />, color: 'bg-red-100 text-red-700 border-red-200' },
  economy: { label: 'Économique', icon: <Truck className="h-5 w-5" />, color: 'bg-green-100 text-green-700 border-green-200' },
  freight: { label: 'Fret', icon: <Weight className="h-5 w-5" />, color: 'bg-orange-100 text-orange-700 border-orange-200' },
};

// Format currency
function formatCurrency(amount: number, currency: string = 'DZD'): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: currency === 'DZD' ? 'DZD' : currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace('DZD', 'DA')
    .trim();
}

// Get region type based on distance
function getRegionType(distance: number): keyof typeof defaultRates {
  if (distance <= 100) return 'local';
  if (distance <= 350) return 'regional';
  if (distance <= 800) return 'national';
  return 'south';
}

// Calculate distance between two wilayas
function calculateDistance(originCode: string, destCode: string): number {
  const origin = algerianWilayas.find((w) => w.code === originCode);
  const dest = algerianWilayas.find((w) => w.code === destCode);
  
  if (!origin || !dest) return 0;
  
  // Simplified calculation using distance from Algiers as reference
  return Math.abs(origin.distanceFromAlgiers - dest.distanceFromAlgiers) + 
         Math.min(origin.distanceFromAlgiers, dest.distanceFromAlgiers) * 0.3;
}

export default function ShippingCalculator({
  rates = defaultRates,
  origin: initialOrigin,
  destination: initialDestination,
  onCalculate,
  className,
  currency = 'DZD',
  showInsuranceOption = true,
}: ShippingCalculatorProps) {
  // Form state
  const [originWilaya, setOriginWilaya] = useState(initialOrigin ?? '14'); // Default to Algiers
  const [destinationWilaya, setDestinationWilaja] = useState(initialDestination ?? '');
  const [weight, setWeight] = useState<number>(1); // kg
  const [dimensions, setDimensions] = useState({ length: 30, width: 20, height: 15 }); // cm
  const [selectedMethod, setSelectedMethod] = useState<ShippingMethod>('standard');
  const [includeInsurance, setIncludeInsurance] = useState(false);
  const [declaredValue, setDeclaredValue] = useState<number>(0);

  // Result state
  const [calculationResult, setCalculationResult] = useState<ShippingCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Get selected wilaya data
  const originData = useMemo(
    () => algerianWilayas.find((w) => w.code === originWilaya),
    [originWilaya]
  );
  const destinationData = useMemo(
    () => algerianWilayas.find((w) => w.code === destinationWilaya),
    [destinationWilaya]
  );

  // Calculate distance
  const distance = useMemo(() => {
    if (!originWilaya || !destinationWilaya) return 0;
    return calculateDistance(originWilaya, destinationWilaya);
  }, [originWilaya, destinationWilaya]);

  // Get available rates for this route
  const availableRates = useMemo(() => {
    if (!destinationData) return [];
    
    const regionType = getRegionType(destinationData.distanceFromAlgiers);
    return rates[regionType] ?? rates.regional;
  }, [destinationData, rates]);

  // Selected rate
  const selectedRate = useMemo(() => {
    return availableRates.find((r) => r.method === selectedMethod);
  }, [availableRates, selectedMethod]);

  // Perform calculation
  const handleCalculate = useCallback(async () => {
    if (!originData || !destinationData || !selectedRate) return;

    setIsCalculating(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Calculate costs
    let subtotal = selectedRate.basePrice + (selectedRate.pricePerKg ?? 0) * weight;

    // Add insurance if requested
    let insuranceFee = 0;
    if (includeInsurance && declaredValue > 0) {
      insuranceFee = declaredValue * 0.01; // 1% of declared value
    }

    // Fuel surcharge (based on distance)
    const fuelSurcharge = Math.round(distance * 2 * weight);

    // Handling fee
    const handlingFee = Math.min(500, Math.max(100, weight * 50));

    const totalCost = subtotal + insuranceFee + fuelSurcharge + handlingFee;

    // Estimated delivery dates
    const now = new Date();
    const minDelivery = new Date(now);
    minDelivery.setDate(minDelivery.getDate() + selectedRate.estimatedDays.min);
    const maxDelivery = new Date(now);
    maxDelivery.setDate(maxDelivery.getDate() + selectedRate.estimatedDays.max);

    const result: ShippingCalculationResult = {
      originWilaya: originData,
      destinationWilaya: destinationData,
      distance,
      selectedMethod,
      methodRate: selectedRate,
      subtotal,
      insuranceFee: includeInsurance ? insuranceFee : undefined,
      fuelSurcharge,
      handlingFee,
      totalCost,
      currency,
      estimatedDelivery: { min: minDelivery, max: maxDelivery },
    };

    setCalculationResult(result);
    setIsCalculating(false);
    onCalculate?.(result);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originData, destinationData, selectedRate, selectedMethod, weight, includeInsurance, declaredValue, distance, currency, onCalculate]);

  // Auto-calculate when inputs change (debounced would be better in production)
  React.useEffect(() => {
    if (originData && destinationData && selectedRate) {
      handleCalculate();
    }
  }, [originData, destinationData, selectedRate, handleCalculate]);

  // Reset calculation
  const handleReset = () => {
    setCalculationResult(null);
    setDestinationWilaja('');
    setWeight(1);
    setSelectedMethod('standard');
    setIncludeInsurance(false);
    setDeclaredValue(0);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-primary" />
              Calculateur d&apos;Expédition
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1">
              <RefreshCw className="h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Calculez vos frais de livraison à travers toute l&apos;Algérie
          </p>
        </CardHeader>

        <CardContent className="pt-0 space-y-6">
          {/* Origin & Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Origin */}
            <div className="space-y-2">
              <Label htmlFor="origin" className="flex items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4 text-green-500" />
                Wilaya d&apos;origine
              </Label>
              <Select value={originWilaya} onValueChange={setOriginWilaya}>
                <SelectTrigger id="origin">
                  <Navigation className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {algerianWilayas.map((wilaya) => (
                    <SelectItem key={wilaya.code} value={wilaya.code}>
                      {wilaya.code} - {wilaya.name}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({wilaya.region})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {originData && (
                <p className="text-xs text-muted-foreground">
                  Région: {originData.region}
                </p>
              )}
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <Label htmlFor="destination" className="flex items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4 text-red-500" />
                Wilaya de destination
              </Label>
              <Select value={destinationWilaya} onValueChange={setDestinationWilaja}>
                <SelectTrigger id="destination">
                  <Navigation className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {algerianWilayas.map((wilaya) => (
                    <SelectItem key={wilaya.code} value={wilaya.code}>
                      {wilaya.code} - {wilaya.name}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({wilaya.region})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {destinationData && (
                <p className="text-xs text-muted-foreground">
                  Distance approx.: ~{distance} km
                </p>
              )}
            </div>
          </div>

          {/* Package Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight" className="flex items-center gap-2 font-semibold">
                <Weight className="h-4 w-4" />
                Poids (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                min={0.1}
                step={0.1}
                value={weight}
                onChange={(e) => setWeight(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                aria-label="Poids du colis en kilogrammes"
              />
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-semibold">
                <Ruler className="h-4 w-4" />
                Dimensions (cm)
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="L"
                  value={dimensions.length}
                  onChange={(e) =>
                    setDimensions({ ...dimensions, length: parseInt(e.target.value) || 0 })
                  }
                  className="w-full"
                  aria-label="Longueur"
                />
                <span className="text-gray-400">×</span>
                <Input
                  type="number"
                  placeholder="l"
                  value={dimensions.width}
                  onChange={(e) =>
                    setDimensions({ ...dimensions, width: parseInt(e.target.value) || 0 })
                  }
                  className="w-full"
                  aria-label="Largeur"
                />
                <span className="text-gray-400">×</span>
                <Input
                  type="number"
                  placeholder="H"
                  value={dimensions.height}
                  onChange={(e) =>
                    setDimensions({ ...dimensions, height: parseInt(e.target.value) || 0 })
                  }
                  className="w-full"
                  aria-label="Hauteur"
                />
              </div>
            </div>

            {/* Insurance */}
            {showInsuranceOption && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-semibold">
                  <Shield className="h-4 w-4" />
                  Assurance optionnelle
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="insurance"
                    checked={includeInsurance}
                    onChange={(e) => setIncludeInsurance(e.target.checked)}
                    className="rounded border-gray-300"
                    aria-label="Inclure une assurance"
                  />
                  <label htmlFor="insurance" className="text-sm cursor-pointer">
                    Assurer le colis
                  </label>
                </div>
                {includeInsurance && (
                  <Input
                    type="number"
                    placeholder="Valeur déclarée (DA)"
                    value={declaredValue || ''}
                    onChange={(e) => setDeclaredValue(parseFloat(e.target.value) || 0)}
                    min={0}
                    aria-label="Valeur déclarée du colis"
                  />
                )}
              </div>
            )}
          </div>

          {/* Shipping Methods */}
          {availableRates.length > 0 && (
            <div className="space-y-3">
              <Label className="font-semibold">Méthode d&apos;expédition</Label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {availableRates.map((rate) => {
                  const config = methodConfig[rate.method];
                  const isSelected = rate.method === selectedMethod;
                  
                  // Quick price estimate
                  const estimatedPrice = rate.basePrice + (rate.pricePerKg ?? 0) * weight;

                  return (
                    <button
                      key={rate.method}
                      type="button"
                      disabled={!rate.available}
                      onClick={() => setSelectedMethod(rate.method)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all duration-200',
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:border-primary/30 hover:shadow-sm',
                        !rate.available && 'opacity-50 cursor-not-allowed'
                      )}
                      aria-pressed={isSelected}
                      aria-disabled={!rate.available}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div
                          className={cn(
                            'p-2 rounded-lg',
                            isSelected ? config.color : 'bg-muted'
                          )}
                        >
                          {config.icon}
                        </div>
                        
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>

                      <h4 className="font-medium text-sm mb-1">{config.label}</h4>
                      
                      <p className="text-lg font-bold text-primary mb-1">
                        {formatCurrency(estimatedPrice, currency)}
                      </p>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {rate.estimatedDays.min === 0
                            ? 'Même jour'
                            : `${rate.estimatedDays.min}-${rate.estimatedDays.max} jours`}
                        </span>
                      </div>

                      {rate.description && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                          {rate.description}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Calculation Results */}
          {calculationResult && (
            <>
              <Separator />

              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Récapitulatif du Coût
                    </h3>
                    
                    <Badge variant="outline" className="gap-1">
                      <ArrowRight className="h-3 w-3" />
                      {calculationResult.originWilaya.name} →{' '}
                      {calculationResult.destinationWilaya.name}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {/* Cost breakdown */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tarif de base</span>
                        <span>{formatCurrency(calculationResult.subtotal - ((calculationResult.methodRate.pricePerKg ?? 0) * weight), currency)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Poids ({weight} kg × {calculationResult.methodRate.pricePerKg ?? 0} DA/kg)
                        </span>
                        <span>{formatCurrency((calculationResult.methodRate.pricePerKg ?? 0) * weight, currency)}</span>
                      </div>

                      {calculationResult.fuelSurcharge && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            Surcharge carburant
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3" />
                              </TooltipTrigger>
                              <TooltipContent>
                                Calculée selon la distance (~{distance} km)
                              </TooltipContent>
                            </Tooltip>
                          </span>
                          <span>{formatCurrency(calculationResult.fuelSurcharge, currency)}</span>
                        </div>
                      )}

                      {calculationResult.handlingFee && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Frais de manutention</span>
                          <span>{formatCurrency(calculationResult.handlingFee, currency)}</span>
                        </div>
                      )}

                      {calculationResult.insuranceFee && (
                        <div className="flex justify-between text-green-600">
                          <span className="flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5" />
                            Assurance
                          </span>
                          <span>+{formatCurrency(calculationResult.insuranceFee, currency)}</span>
                        </div>
                      )}

                      <Separator />

                      <div className="flex justify-between font-bold text-base pt-1">
                        <span>Total estimé</span>
                        <span className="text-primary text-xl">
                          {formatCurrency(calculationResult.totalCost, currency)}
                        </span>
                      </div>
                    </div>

                    {/* Delivery estimate */}
                    <div className="mt-4 p-3 rounded-lg bg-white/50 border border-white/20">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium">Livraison estimée:</span>
                        <span>
                          entre le{' '}
                          {calculationResult.estimatedDelivery.min.toLocaleDateString('fr-DZ', {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          et le{' '}
                          {calculationResult.estimatedDelivery.max.toLocaleDateString('fr-DZ', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Incoterms Information */}
          <details className="group">
            <summary className="cursor-pointer flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
              <FileText className="h-4 w-4" />
              Comprendre les Incoterms
              <ChevronDownIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            
            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(incotermsInfo).map(([code, info]) => (
                <div
                  key={code}
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="font-mono font-bold">
                      {code}
                    </Badge>
                    <span className="font-medium text-sm">{info.fullName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{info.description}</p>
                  <div className="space-y-1 text-xs">
                    <p><strong>Vendeur:</strong> {info.sellerResponsibility}</p>
                    <p><strong>Acheteur:</strong> {info.buyerResponsibility}</p>
                  </div>
                </div>
              ))}
            </div>
          </details>

          {/* Info note */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-muted/50">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              Les tarifs affichés sont des estimations. Le prix final peut varier selon le volume exact,
              la zone de livraison précise, et les conditions actuelles du marché.
              Contactez-nous pour un devis personnalisé.
            </p>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// ChevronDown icon component
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}

// Export types and data
export type { ShippingCalculatorProps };
export { algerianWilayas, incotermsInfo, defaultRates };
