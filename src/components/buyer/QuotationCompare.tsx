'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Scale,
  Star,
  CheckCircle2,
  X,
  Award,
  TrendingDown,
  MessageSquare
} from 'lucide-react';

export interface QuotationCompareData {
  id: string;
  rfqId: string;
  companyName: string;
  companyId: string;
  isVerified: boolean;
  rating: number;
  responseRate: number;
  totalPrice: number;
  currency: string;
  validUntil: string;
  notes?: string;
  status: string;
  submittedAt: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    unit: string;
    totalPrice: number;
  }[];
}

interface QuotationCompareProps {
  quotations: QuotationCompareData[];
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (quotationId: string) => void;
  onNegotiate?: (quotationId: string) => void;
}

export function QuotationCompare({
  quotations,
  isOpen,
  onClose,
  onAccept,
  onNegotiate
}: QuotationCompareProps) {
  if (quotations.length < 2) {
    return null;
  }

  // Find best price
  const prices = quotations.map(q => q.totalPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const savings = maxPrice - minPrice;
  const savingsPercent = ((savings / maxPrice) * 100).toFixed(1);

  // Find best rated
  const bestRated = quotations.reduce((best, current) => 
    current.rating > best.rating ? current : best
  );

  // Find fastest response rate
  const bestResponseRate = quotations.reduce((best, current) => 
    current.responseRate > best.responseRate ? current : best
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Comparaison des Devis ({quotations.length})
          </DialogTitle>
          <DialogDescription>
            Comparez côte à côte les devis reçus pour votre appel d&apos;offre
          </DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <TrendingDown className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="text-sm text-green-700">Économie potentielle</p>
              <p className="text-xl font-bold text-green-800">
                {(savings / 1000).toLocaleString('fr-DZ')} K DZD
              </p>
              <p className="text-xs text-green-600">({savingsPercent}% d&apos;économie)</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <p className="text-sm text-blue-700">Meilleure note</p>
              <p className="font-semibold text-blue-800">{bestRated.companyName}</p>
              <p className="text-sm text-blue-600">{bestRated.rating}/5 ⭐</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <p className="text-sm text-purple-700">Meilleur taux de réponse</p>
              <p className="font-semibold text-purple-800">{bestResponseRate.companyName}</p>
              <p className="text-sm text-purple-600">{bestResponseRate.responseRate}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Table */}
        <div className="mt-6 overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold min-w-[150px]">Critère</TableHead>
                {quotations.map((q) => (
                  <TableHead key={q.id} className="font-semibold text-center min-w-[180px]">
                    <div className="flex flex-col items-center gap-1">
                      <span>{q.companyName}</span>
                      {q.isVerified && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          ✓ Vérifié
                        </Badge>
                      )}
                      {q.totalPrice === minPrice && (
                        <Badge variant="default" className="text-xs bg-yellow-500 hover:bg-yellow-500">
                          Meilleur prix
                        </Badge>
                      )}
                      {q.id === bestRated.id && q.totalPrice !== minPrice && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          ★ Meilleur noté
                        </Badge>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Price Row */}
              <TableRow className={cn(minPrice > 0 && 'font-bold')}>
                <TableCell className="font-medium bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    💰 Prix Total
                  </div>
                </TableCell>
                {quotations.map((q) => (
                  <TableCell 
                    key={q.id} 
                    className={cn(
                      'text-center',
                      q.totalPrice === minPrice && 'bg-green-50 text-green-700 font-bold'
                    )}
                  >
                    {(q.totalPrice / 1000).toLocaleString('fr-DZ')} K DZD
                  </TableCell>
                ))}
              </TableRow>

              {/* Unit Price Row */}
              <TableRow>
                <TableCell className="font-medium bg-gray-50/50">💵 Prix Unitaire Moyen</TableCell>
                {quotations.map((q) => {
                  const avgUnitPrice = q.items.length > 0 
                    ? q.totalPrice / q.items.reduce((sum, item) => sum + item.quantity, 0)
                    : 0;
                  return (
                    <TableCell key={q.id} className="text-center">
                      {avgUnitPrice.toLocaleString('fr-DZ')} DZD/unité
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Rating Row */}
              <TableRow>
                <TableCell className="font-medium bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    Note Fournisseur
                  </div>
                </TableCell>
                {quotations.map((q) => (
                  <TableCell key={q.id} className="text-center">
                    <span className={cn(
                      'inline-flex items-center gap-1',
                      q.id === bestRated.id && 'font-bold text-blue-600'
                    )}>
                      {q.rating}
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    </span>
                  </TableCell>
                ))}
              </TableRow>

              {/* Response Rate Row */}
              <TableRow>
                <TableCell className="font-medium bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    📊 Taux de Réponse
                  </div>
                </TableCell>
                {quotations.map((q) => (
                  <TableCell key={q.id} className={cn(
                    'text-center',
                    q.id === bestResponseRate.id && 'font-bold text-purple-600'
                  )}>
                    {q.responseRate}%
                  </TableCell>
                ))}
              </TableRow>

              {/* Verification Row */}
              <TableRow>
                <TableCell className="font-medium bg-gray-50/50">✓ Vérification</TableCell>
                {quotations.map((q) => (
                  <TableCell key={q.id} className="text-center">
                    {q.isVerified ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Vérifié
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Non vérifié</Badge>
                    )}
                  </TableCell>
                ))}
              </TableRow>

              {/* Validity Row */}
              <TableRow>
                <TableCell className="font-medium bg-gray-50/50">📅 Validité</TableCell>
                {quotations.map((q) => (
                  <TableCell key={q.id} className="text-center text-sm">
                    {new Date(q.validUntil).toLocaleDateString('fr-FR')}
                  </TableCell>
                ))}
              </TableRow>

              {/* Notes Row */}
              <TableRow>
                <TableCell className="font-medium bg-gray-50/50 align-top pt-4">📝 Notes</TableCell>
                {quotations.map((q) => (
                  <TableCell key={q.id} className="text-sm max-w-[200px]">
                    <p className="line-clamp-3">{q.notes || '-'}</p>
                  </TableCell>
                ))}
              </TableRow>

              {/* Items Detail Section */}
              <TableRow>
                <TableCell colSpan={quotations.length + 1} className="p-0">
                  <div className="p-4 bg-gray-50">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      📦 Détail des Articles
                    </h4>
                    
                    {/* Group items by name across all quotations */}
                    {(() => {
                      // Get all unique item names
                      const allItemNames = [...new Set(
                        quotations.flatMap(q => q.items.map(i => i.productName))
                      )];

                      return (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Article</TableHead>
                              {quotations.map(q => (
                                <TableHead key={q.id} className="text-center">
                                  Qté
                                </TableHead>
                              ))}
                              {quotations.map(q => (
                                <TableHead key={q.id} className="text-center">
                                  Prix Unit.
                                </TableHead>
                              ))}
                              {quotations.map(q => (
                                <TableHead key={q.id} className="text-center">
                                  Total
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allItemNames.map((itemName, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{itemName}</TableCell>
                                {quotations.map(q => {
                                  const item = q.items.find(i => i.productName === itemName);
                                  return (
                                    <TableCell key={q.id} className="text-center">
                                      {item ? item.quantity.toLocaleString('fr-DZ') : '-'}
                                    </TableCell>
                                  );
                                })}
                                {quotations.map(q => {
                                  const item = q.items.find(i => i.productName === itemName);
                                  return (
                                    <TableCell key={q.id} className="text-center">
                                      {item ? item.unitPrice.toLocaleString('fr-DZ') : '-'}
                                    </TableCell>
                                  );
                                })}
                                {quotations.map(q => {
                                  const item = q.items.find(i => i.productName === itemName);
                                  return (
                                    <TableCell key={q.id} className="text-center font-medium">
                                      {item ? item.totalPrice.toLocaleString('fr-DZ') : '-'}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      );
                    })()}
                  </div>
                </TableCell>
              </TableRow>

              {/* Actions Row */}
              <TableRow>
                <TableCell className="font-medium bg-gray-50/50 align-top pt-4">🎯 Action</TableCell>
                {quotations.map((q) => (
                  <TableCell key={q.id} className="text-center">
                    <div className="flex flex-col gap-2">
                      {onAccept && (
                        <Button
                          size="sm"
                          className={cn(
                            'w-full',
                            q.totalPrice === minPrice 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-white border-green-600 text-green-600 hover:bg-green-50'
                          )}
                          onClick={() => onAccept(q.id)}
                        >
                          <Award className="h-3.5 w-3.5 mr-1" />
                          Attribuer
                        </Button>
                      )}
                      
                      {onNegotiate && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => onNegotiate(q.id)}
                        >
                          <MessageSquare className="h-3.5 w-3.5 mr-1" />
                          Négocier
                        </Button>
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          
          <p className="text-sm text-gray-500">
            Les prix affichés sont en DZD (Dinar Algérien)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
