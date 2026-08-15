'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Package,
  Tag,
  TrendingDown,
  Calculator,
  Check,
  Star,
  Info,
  ArrowRight,
  PiggyBank,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export interface BulkPricingTier {
  id: string;
  minQuantity: number;
  maxQuantity?: number; // undefined means "and above"
  unitPrice: number;
  currency?: string;
  discountPercent?: number;
  savingsPerUnit?: number;
  isBestValue?: boolean;
  estimatedDeliveryDays?: number;
  stockAvailable?: number;
}

interface BulkPricingTableProps {
  tiers: BulkPricingTier[];
  currentQuantity?: number;
  onTierSelect?: (tier: BulkPricingTier) => void;
  currency?: string;
  className?: string;
  showSavingsCalculation?: boolean;
  basePrice?: number;
}

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

// Format quantity range
function formatQuantityRange(tier: BulkPricingTier): string {
  if (tier.maxQuantity) {
    return `${tier.minQuantity.toLocaleString('fr-DZ')} - ${tier.maxQuantity.toLocaleString('fr-DZ')}`;
  }
  return `${tier.minQuantity.toLocaleString('fr-DZ')}+`;
}

// Calculate total savings
function calculateTotalSavings(
  tier: BulkPricingTier,
  quantity: number,
  basePrice: number
): number {
  const tierTotal = tier.unitPrice * quantity;
  const baseTotal = basePrice * quantity;
  return baseTotal - tierTotal;
}

// Get best value tier
function getBestValueTier(tiers: BulkPricingTier[]): BulkPricingTier | null {
  // First check if any is marked as best value
  const markedBest = tiers.find((t) => t.isBestValue);
  if (markedBest) return markedBest;

  // Otherwise find the one with highest discount or lowest price per unit
  if (tiers.length === 0) return null;

  return tiers.reduce((best, current) => {
    if (!best) return current;
    return (current.discountPercent || 0) > (best.discountPercent || 0)
      ? current
      : best;
  }, tiers[0] as BulkPricingTier | null);
}

export default function BulkPricingTable({
  tiers,
  currentQuantity = 1,
  onTierSelect,
  currency = 'DZD',
  className,
  showSavingsCalculation = true,
  basePrice,
}: BulkPricingTableProps) {
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

  // Determine base price if not provided (use lowest tier price)
  const effectiveBasePrice = basePrice ?? tiers[0]?.unitPrice ?? 0;

  // Find best value tier
  const bestValueTier = useMemo(() => getBestValueTier(tiers), [tiers]);

  // Find current applicable tier based on quantity
  const currentTier = useMemo(() => {
    return tiers.find(
      (t) =>
        currentQuantity >= t.minQuantity &&
        (t.maxQuantity === undefined || currentQuantity <= t.maxQuantity)
    );
  }, [tiers, currentQuantity]);

  // Calculate potential savings for selected tier
  const selectedSavings = useMemo(() => {
    if (!selectedTierId || !showSavingsCalculation) return null;
    const selected = tiers.find((t) => t.id === selectedTierId);
    if (!selected) return null;

    const targetQty = Math.max(currentQuantity, selected.minQuantity);
    return {
      tier: selected,
      quantity: targetQty,
      savings: calculateTotalSavings(selected, targetQty, effectiveBasePrice),
      totalPrice: selected.unitPrice * targetQty,
    };
  }, [selectedTierId, tiers, showSavingsCalculation, currentQuantity, effectiveBasePrice]);

  const handleTierSelect = (tier: BulkPricingTier) => {
    setSelectedTierId(tier.id);
    onTierSelect?.(tier);
  };

  if (tiers.length === 0) {
    return null;
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-primary" />
            Tarifs en Gros
          </CardTitle>
          {currentTier && (
            <Badge variant="outline" className="gap-1">
              <Tag className="h-3 w-3" />
              Quantité actuelle: {currentQuantity.toLocaleString('fr-DZ')}
            </Badge>
          )}
        </div>

        {/* Savings summary when a tier is selected */}
        {selectedSavings && (
          <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Économie potentielle:
                </span>
                <span className="text-lg font-bold text-green-700">
                  +{formatCurrency(selectedSavings.savings, currency)}
                </span>
              </div>
              <div className="text-xs text-green-600">
                Pour {selectedSavings.quantity.toLocaleString('fr-DZ')} unités
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <TooltipProvider delayDuration={200}>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Quantité</TableHead>
                  <TableHead>Prix Unitaire</TableHead>
                  <TableHead className="hidden sm:table-cell">Remise</TableHead>
                  {showSavingsCalculation && (
                    <TableHead className="hidden md:table-cell">
                      Économie/Unité
                    </TableHead>
                  )}
                  <TableHead className="hidden lg:table-cell">Livraison</TableHead>
                  <TableHead className="w-[100px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers.map((tier) => {
                  const isBestValue = tier.id === bestValueTier?.id;
                  const isSelected = tier.id === selectedTierId;
                  const isCurrentTier = tier.id === currentTier?.id;
                  const isInQuantityRange =
                    currentQuantity >= tier.minQuantity &&
                    (tier.maxQuantity === undefined ||
                      currentQuantity <= tier.maxQuantity);

                  // Calculate savings per unit compared to base price
                  const savingsPerUnit =
                    effectiveBasePrice > tier.unitPrice
                      ? effectiveBasePrice - tier.unitPrice
                      : 0;

                  return (
                    <TableRow
                      key={tier.id}
                      className={cn(
                        'cursor-pointer transition-all duration-200',
                        isBestValue && 'bg-amber-50 border-amber-200',
                        isSelected && 'bg-primary/5',
                        isCurrentTier && 'bg-blue-50/50',
                        'hover:bg-muted/50'
                      )}
                      onClick={() => handleTierSelect(tier)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleTierSelect(tier);
                        }
                      }}
                      aria-selected={isSelected}
                    >
                      {/* Quantity range */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatQuantityRange(tier)}
                          </span>
                          {isBestValue && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge className="bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100 gap-0.5 px-1.5 py-0">
                                  <Star className="h-3 w-3" />
                                  Meilleur rapport
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ce palier offre la meilleure valeur</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {isInQuantityRange && !isCurrentTier && (
                            <Badge
                              variant="secondary"
                              className="text-xs"
                            >
                              Disponible
                            </Badge>
                          )}
                        </div>
                        {tier.stockAvailable !== undefined &&
                          tier.stockAvailable < 1000 && (
                            <p className="text-xs text-orange-600 mt-0.5">
                              Stock: {tier.stockAvailable.toLocaleString('fr-DZ')}
                            </p>
                          )}
                      </TableCell>

                      {/* Unit price */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'font-bold text-lg',
                              isBestValue ? 'text-amber-700' : 'text-gray-900'
                            )}
                          >
                            {formatCurrency(tier.unitPrice, currency)}
                          </span>
                          {isCurrentTier && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>
                      </TableCell>

                      {/* Discount percentage */}
                      <TableCell className="hidden sm:table-cell">
                        {tier.discountPercent !== undefined &&
                        tier.discountPercent > 0 ? (
                          <Badge
                            variant="outline"
                            className="gap-1 bg-green-50 text-green-700 border-green-200"
                          >
                            <TrendingDown className="h-3 w-3" />
                            -{tier.discountPercent}%
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>

                      {/* Savings per unit */}
                      {showSavingsCalculation && (
                        <TableCell className="hidden md:table-cell">
                          {savingsPerUnit > 0 ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <Calculator className="h-4 w-4" />
                              <span className="font-medium">
                                -{formatCurrency(savingsPerUnit, currency)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                      )}

                      {/* Estimated delivery */}
                      <TableCell className="hidden lg:table-cell">
                        {tier.estimatedDeliveryDays !== undefined ? (
                          <span className="text-sm text-gray-600">
                            {tier.estimatedDeliveryDays <= 3 ? (
                              <span className="text-green-600 font-medium">
                                {tier.estimatedDeliveryDays}j
                              </span>
                            ) : tier.estimatedDeliveryDays <= 7 ? (
                              <span className="text-yellow-600">
                                {tier.estimatedDeliveryDays}j
                              </span>
                            ) : (
                              <span>{tier.estimatedDeliveryDays}j</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>

                      {/* Action button */}
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={
                            isSelected || isCurrentTier ? 'default' : 'outline'
                          }
                          className={cn(
                            'gap-1',
                            isBestValue && !isSelected && 'border-amber-400 text-amber-700 hover:bg-amber-50'
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTierSelect(tier);
                          }}
                          aria-label={`Sélectionner le tarif ${formatQuantityRange(tier)}`}
                        >
                          {(isSelected || isCurrentTier) ? (
                            <>
                              <Check className="h-4 w-4" />
                              Sélectionné
                            </>
                          ) : (
                            <>
                              Sélectionner
                              <ArrowRight className="h-3 w-3" />
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TooltipProvider>

        {/* Info footer */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              Les prix en gros s&apos;appliquent automatiquement lorsque vous
              atteignez les quantités minimales. Les délais de livraison peuvent
              varier selon la disponibilité des stocks.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Export types
export type { BulkPricingTableProps };
