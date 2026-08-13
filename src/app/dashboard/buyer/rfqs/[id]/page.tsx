'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  Eye,
  Edit3,
  Copy,
  XCircle,
  CheckCircle2,
  MessageSquare,
  Scale,
  Award,
  MapPin,
  Calendar,
  Package,
  DollarSign,
  Clock,
  User,
  Building2,
  Star,
  ArrowLeft,
  Download,
  AlertTriangle
} from 'lucide-react';

// Mock RFQ data - in production this would come from API based on ID
const mockRFQ = {
  id: 'rfq-001',
  title: 'Fourniture de Ciment Portland CEM I 42.5',
  description: `Besoin de 500 tonnes de ciment Portland pour projet de construction à Alger.

Spécifications requises:
- Type: CEM I 42.5 selon norme NA 1603
- Conditionnement: Sac de 50kg sur palette
- Origine: Préférence production locale (SCUM, EREX, etc.)
- Livraison: Échelonnée sur 3 mois (200t mois 1, 150t mois 2, 150t mois 3)
- Lieu: Chantier Alger (Dar el Beida)

Documents techniques disponibles en pièce jointe.`,
  quantity: 500,
  unit: 'tonnes',
  targetPrice: 125000,
  currency: 'DZD',
  category: 'Matériaux Construction',
  status: 'QUOTATIONS_RECEIVED' as const,
  deliveryLocation: 'Alger (16) - Dar el Beida',
  requiredDeliveryDate: '2024-03-15',
  expirationDate: '2024-02-15',
  createdAt: '2024-01-10',
  updatedAt: '2024-01-14',
};

// Mock quotations data
const mockQuotations = [
  {
    id: 'qt-001',
    rfqId: 'rfq-001',
    companyId: 'comp-001',
    companyName: 'Cimenterie d\'Algérie - SCUM',
    isVerified: true,
    rating: 4.8,
    responseRate: 95,
    totalPrice: 62500000,
    currency: 'DZD',
    validUntil: '2024-02-28',
    notes: 'Prix négociable pour commande récurrente. Livraison gratuite sur Alger.',
    status: 'SENT' as const,
    submittedAt: '2024-01-12',
    items: [
      { productName: 'Ciment Portland CEM I 42.5', quantity: 500, unitPrice: 125000, unit: 'tonne', totalPrice: 62500000 }
    ]
  },
  {
    id: 'qt-002',
    rfqId: 'rfq-001',
    companyId: 'comp-002',
    companyName: 'EREX - Usine d\'El Hamdania',
    isVerified: true,
    rating: 4.6,
    responseRate: 88,
    totalPrice: 61000000,
    currency: 'DZD',
    validUntil: '2024-02-25',
    notes: 'Qualité premium. Possibilité de visite usine. Paiement 30j/60j possible.',
    status: 'SENT' as const,
    submittedAt: '2024-01-13',
    items: [
      { productName: 'Ciment Portland CEM I 42.5', quantity: 500, unitPrice: 122000, unit: 'tonne', totalPrice: 61000000 }
    ]
  },
  {
    id: 'qt-003',
    rfqId: 'rfq-001',
    companyId: 'comp-003',
    companyName: 'Villa Import SARL',
    isVerified: false,
    rating: 4.2,
    responseRate: 72,
    totalPrice: 58500000,
    currency: 'DZD',
    validUntil: '2024-02-20',
    notes: 'Import Espagne. Délai 45 jours. Prix très compétitif.',
    status: 'VIEWED' as const,
    submittedAt: '2024-01-11',
    items: [
      { productName: 'Cement Portland CEM I 42.5', quantity: 500, unitPrice: 117000, unit: 'tonne', totalPrice: 58500000 }
    ]
  },
];

type Quotation = typeof mockQuotations[0];
type QuotationStatus = Quotation['status'];

export default function RFQDetailPage() {
  const params = useParams();
  const [selectedQuotations, setSelectedQuotations] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [awardDialogOpen, setAwardDialogOpen] = useState(false);
  const [selectedForAward, setSelectedForAward] = useState<string | null>(null);

  // Handle quotation selection for comparison
  const toggleQuotationSelection = (id: string) => {
    setSelectedQuotations(prev => 
      prev.includes(id) 
        ? prev.filter(qid => qid !== id)
        : [...prev, id]
    );
  };

  // Handle quotation actions
  const handleAccept = async (quotationId: string) => {
    console.log('Accept quotation:', quotationId);
    setSelectedForAward(quotationId);
    setAwardDialogOpen(true);
  };

  const handleReject = async (quotationId: string) => {
    console.log('Reject quotation:', quotationId);
  };

  const handleNegotiate = async (quotationId: string) => {
    console.log('Negotiate quotation:', quotationId);
  };

  const confirmAward = async () => {
    if (!selectedForAward) return;
    console.log('Award RFQ to:', selectedForAward);
    setAwardDialogOpen(false);
    // In production, this would call an API to award the RFQ
  };

  // Get status label for quotations
  const getQuotationStatusLabel = (status: QuotationStatus): string => {
    const labels: Record<QuotationStatus, string> = {
      DRAFT: 'Brouillon',
      SENT: 'Nouveau',
      VIEWED: 'Lu',
      ACCEPTED: 'Accepté',
      REJECTED: 'Rejeté',
      EXPIRED: 'Expiré'
    };
    return labels[status] || status;
  };

  // Get quotations selected for comparison
  const quotationsToCompare = mockQuotations.filter(q => selectedQuotations.includes(q.id));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/buyer/rfqs">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{mockRFQ.title}</h1>
              <StatusBadge status={mockRFQ.status} />
            </div>
            <p className="text-gray-600 mt-1">Créé le {new Date(mockRFQ.createdAt).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
          {(mockRFQ.status === 'DRAFT' || mockRFQ.status === 'PUBLISHED') && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/buyer/rfqs/${params.id}/edit`}>
                <Edit3 className="h-4 w-4 mr-2" />
                Modifier
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* RFQ Details */}
          <Card>
            <CardHeader>
              <CardTitle>Détails de l&apos;Appel d&apos;Offre</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 whitespace-pre-wrap">{mockRFQ.description}</p>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Quantité:</span>
                    <span className="font-medium">{mockRFQ.quantity.toLocaleString('fr-DZ')} {mockRFQ.unit}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Prix cible:</span>
                    <span className="font-medium">{mockRFQ.targetPrice.toLocaleString('fr-DZ')} {mockRFQ.currency}/unité</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Catégorie:</span>
                    <Badge variant="outline">{mockRFQ.category}</Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Livraison:</span>
                    <span className="font-medium">{mockRFQ.deliveryLocation}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Date souhaitée:</span>
                    <span className="font-medium">{new Date(mockRFQ.requiredDeliveryDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Expiration des devis:</span>
                    <span className={`font-medium ${new Date(mockRFQ.expirationDate) < new Date() ? 'text-red-600' : ''}`}>
                      {new Date(mockRFQ.expirationDate).toLocaleDateString('fr-FR')}
                      {new Date(mockRFQ.expirationDate) < new Date() && ' (Expiré)'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Received Quotations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Devis Reçus ({mockQuotations.length})</CardTitle>
                <CardDescription>Comparez et sélectionnez le meilleur devis</CardDescription>
              </div>
              
              {selectedQuotations.length >= 2 && (
                <Button onClick={() => setIsCompareOpen(true)} className="gap-2">
                  <Scale className="h-4 w-4" />
                  Comparer ({selectedQuotations.length})
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {mockQuotations.length > 0 ? (
                mockQuotations.map((quotation) => (
                  <div
                    key={quotation.id}
                    className={`border rounded-lg p-4 transition-all ${
                      selectedQuotations.includes(quotation.id) 
                        ? 'border-green-500 bg-green-50' 
                        : 'hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {/* Checkbox for comparison + Header */}
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedQuotations.includes(quotation.id)}
                        onChange={() => toggleQuotationSelection(quotation.id)}
                        className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      
                      <div className="flex-1 min-w-0">
                        {/* Supplier Info */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{quotation.companyName}</span>
                                {quotation.isVerified && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    ✓ Vérifié
                                  </Badge>
                                )}
                                <Badge 
                                  variant={quotation.status === 'SENT' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {getQuotationStatusLabel(quotation.status)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                                  {quotation.rating}
                                </span>
                                <span>Taux de réponse: {quotation.responseRate}%</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Price */}
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-600">
                              {(quotation.totalPrice / 1000).toLocaleString('fr-DZ')} K{quotation.currency}
                            </p>
                            <p className="text-xs text-gray-500">
                              Soit {(quotation.totalPrice / mockRFQ.quantity).toLocaleString('fr-DZ')} {quotation.currency}/{mockRFQ.unit}
                            </p>
                          </div>
                        </div>

                        {/* Notes excerpt */}
                        {quotation.notes && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            &ldquo;{quotation.notes}&rdquo;
                          </p>
                        )}

                        {/* Footer with actions and validity */}
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Valide jusqu&apos;au {new Date(quotation.validUntil).toLocaleDateString('fr-FR')}</span>
                            <span>•</span>
                            <span>Envoyé le {new Date(quotation.submittedAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleNegotiate(quotation.id)}
                            >
                              <MessageSquare className="h-3.5 w-3.5 mr-1" />
                              Négocier
                            </Button>
                            
                            {quotation.status === 'SENT' || quotation.status === 'VIEWED' ? (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleReject(quotation.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Rejeter
                                </Button>
                                <Button 
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleAccept(quotation.id)}
                                >
                                  <Award className="h-3.5 w-3.5 mr-1" />
                                  Attribuer
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun devis reçu pour le moment</p>
                  <p className="text-sm mt-1">Les fournisseurs seront notifiés de votre appel d&apos;offre</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Devis reçus</span>
                <span className="font-bold text-lg">{mockQuotations.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Prix le plus bas</span>
                <span className="font-medium text-green-600">
                  {Math.min(...mockQuotations.map(q => q.totalPrice)).toLocaleString('fr-DZ')} DZD
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Prix le plus haut</span>
                <span className="font-medium">
                  {Math.max(...mockQuotations.map(q => q.totalPrice)).toLocaleString('fr-DZ')} DZD
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Économie potentielle</span>
                <span className="font-bold text-green-600">
                  {((Math.max(...mockQuotations.map(q => q.totalPrice)) - Math.min(...mockQuotations.map(q => q.totalPrice))) / 1000).toLocaleString('fr-DZ')} K DZD
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <h3 className="font-medium text-blue-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Prochaines étapes
                </h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                    Comparez les devis reçus côte à côte
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                    Contactez les fournisseurs si nécessaire
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                    Attribuez l&apos;AO au fournisseur choisi
                  </li>
                </ul>
                
                {selectedQuotations.length >= 2 && (
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                    onClick={() => setIsCompareOpen(true)}
                  >
                    <Scale className="h-4 w-4 mr-2" />
                    Comparer les Devis Sélectionnés
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Comparison Dialog */}
      <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comparaison des Devis</DialogTitle>
            <DialogDescription>
              Comparez côte à côte les devis sélectionnés
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-600 border-b">Critère</th>
                  {quotationsToCompare.map((q) => (
                    <th key={q.id} className="text-left p-3 font-medium text-gray-900 border-b min-w-[250px]">
                      <div className="flex items-center gap-2">
                        {q.companyName}
                        {q.isVerified && (
                          <Badge variant="outline" className="text-xs bg-green-50">✓</Badge>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border-b font-medium text-gray-600">Prix Total</td>
                  {quotationsToCompare.map((q) => (
                    <td key={q.id} className="p-3 border-b font-bold text-green-600">
                      {(q.totalPrice / 1000).toLocaleString('fr-DZ')} K DZD
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 border-b font-medium text-gray-600">Prix Unitaire</td>
                  {quotationsToCompare.map((q) => (
                    <td key={q.id} className="p-3 border-b">
                      {(q.totalPrice / mockRFQ.quantity).toLocaleString('fr-DZ')} DZD/{mockRFQ.unit}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 border-b font-medium text-gray-600">Note Fournisseur</td>
                  {quotationsToCompare.map((q) => (
                    <td key={q.id} className="p-3 border-b">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        {q.rating}/5
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 border-b font-medium text-gray-600">Taux de Réponse</td>
                  {quotationsToCompare.map((q) => (
                    <td key={q.id} className="p-3 border-b">{q.responseRate}%</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 border-b font-medium text-gray-600">Statut Vérification</td>
                  {quotationsToCompare.map((q) => (
                    <td key={q.id} className="p-3 border-b">
                      {q.isVerified ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">Vérifié</Badge>
                      ) : (
                        <Badge variant="outline">Non vérifié</Badge>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 border-b font-medium text-gray-600">Validité</td>
                  {quotationsToCompare.map((q) => (
                    <td key={q.id} className="p-3 border-b">
                      {new Date(q.validUntil).toLocaleDateString('fr-FR')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 border-b font-medium text-gray-600">Notes</td>
                  {quotationsToCompare.map((q) => (
                    <td key={q.id} className="p-3 border-b text-sm text-gray-600">
                      {q.notes || '-'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-gray-600">Action</td>
                  {quotationsToCompare.map((q) => (
                    <td key={q.id} className="p-3">
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 w-full"
                        onClick={() => {
                          setIsCompareOpen(false);
                          handleAccept(q.id);
                        }}
                      >
                        <Award className="h-4 w-4 mr-1" />
                        Attribuer
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Award Confirmation Dialog */}
      <Dialog open={awardDialogOpen} onOpenChange={setAwardDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Award className="h-5 w-5" />
              Confirmer l&apos;Attribution
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir attribuer cet appel d&apos;offre ?
            </DialogDescription>
          </DialogHeader>
          
          {selectedForAward && (() => {
            const quotation = mockQuotations.find(q => q.id === selectedForAward);
            if (!quotation) return null;
            
            return (
              <div className="py-4 space-y-3">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold">{quotation.companyName}</p>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    {(quotation.totalPrice / 1000).toLocaleString('fr-DZ')} K DZD
                  </p>
                </div>
                
                <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Cette action est irréversible. Les autres fournisseurs seront notifiés.
                </div>
                
                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={() => setAwardDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={confirmAward}
                  >
                    Confirmer l&apos;Attribution
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
