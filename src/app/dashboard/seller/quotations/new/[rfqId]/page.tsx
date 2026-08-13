'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Send,
  Save,
  Eye,
  FileText,
  MapPin,
  Calendar,
  Package,
  Calculator
} from 'lucide-react';

// Types
interface QuotationItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface RFQData {
  id: string;
  title: string;
  description?: string;
  buyerLocation: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
  currency: string;
  category: string;
  postedDate: string;
  expirationDate?: string;
}

// Mock RFQ data - in production this would come from API based on rfqId
const mockRFQData: RFQData = {
  id: 'rfq-001',
  title: 'Besoin urgent de ciment Portland CEM I 42.5',
  description: 'Recherche fournisseur pour approvisionnement régulier de ciment pour chantier à Alger. Le projet nécessite une livraison échelonnée sur 3 mois.',
  buyerLocation: 'Alger, Bab El Oued',
  quantity: 5000,
  unit: 'sac de 50kg',
  targetPrice: 6000,
  currency: 'DZD',
  category: 'Matériaux de Construction',
  postedDate: '2024-01-15',
  expirationDate: '2024-02-15',
};

export default function NewQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Form state
  const [rfqData, setRfqData] = useState<RFQData | null>(null);
  const [items, setItems] = useState<QuotationItem[]>([
    {
      id: '1',
      productName: '',
      quantity: 1,
      unit: mockRFQData.unit,
      unitPrice: 0,
      totalPrice: 0,
    },
  ]);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [taxRate, setTaxRate] = useState(19); // TPA Algeria default

  // Load RFQ data on mount
  React.useEffect(() => {
    const loadRFQ = async () => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // In production, fetch from API using params.rfqId
        console.log('Loading RFQ:', params.rfqId);
        setRfqData(mockRFQData);
        
        // Pre-fill first item with RFQ info
        setItems([
          {
            id: '1',
            productName: `Ciment Portland CEM I 42.5 (Réponse à: ${mockRFQData.title})`,
            quantity: mockRFQData.quantity,
            unit: mockRFQData.unit,
            unitPrice: mockRFQData.targetPrice || 5900,
            totalPrice: (mockRFQData.quantity * (mockRFQData.targetPrice || 5900)),
          },
        ]);
        
        // Set default valid until date (30 days from now)
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        setValidUntil(futureDate.toISOString().split('T')[0]);
      } catch (error) {
        console.error('Error loading RFQ:', error);
        alert('Erreur lors du chargement de l\'appel d\'offres');
      } finally {
        setIsLoading(false);
      }
    };

    loadRFQ();
  }, [params.rfqId]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        productName: '',
        quantity: 1,
        unit: 'unité',
        unitPrice: 0,
        totalPrice: 0,
      },
    ]);
  };

  const removeItem = (itemId: string) => {
    if (items.length <= 1) return; // Keep at least one item
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateItem = (itemId: string, field: keyof QuotationItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const updatedItem = { ...item, [field]: value };

        // Auto-calculate total when quantity or price changes
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.totalPrice = Number(updatedItem.quantity) * Number(updatedItem.unitPrice);
        }

        return updatedItem;
      })
    );
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const totalWithTax = subtotal + taxAmount;

  const handleSubmit = async (action: 'draft' | 'send') => {
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log('Submitting quotation:', {
        rfqId: params.rfqId,
        items,
        notes,
        validUntil,
        taxRate,
        subtotal,
        taxAmount,
        total: totalWithTax,
        status: action === 'send' ? 'SENT' : 'DRAFT',
      });

      alert(action === 'send' ? 'Devis envoyé avec succès !' : 'Devis sauvegardé en brouillon !');
      router.push('/dashboard/seller/quotations');
    } catch (error) {
      console.error('Error submitting quotation:', error);
      alert('Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de l&apos;appel d&apos;offres...</p>
        </div>
      </div>
    );
  }

  if (!rfqData) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Appel d&apos;offres introuvable</h2>
        <p className="text-gray-500 mt-2">L&apos;appel d&apos;offres demandé n&apos;existe pas ou a été supprimé.</p>
        <Button asChild variant="outline" className="mt-4">
          <a href="/dashboard/seller/rfqs">Retour aux Appels d&apos;Offres</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Créer un Devis</h1>
          <p className="text-gray-600 mt-1">Répondre à un appel d&apos;offres</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          {showPreview ? 'Modifier' : 'Aperçu'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className={showPreview ? 'lg:col-span-3' : 'lg:col-span-2'}>
          {!showPreview ? (
            <>
              {/* RFQ Details Card */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Détails de l&apos;Appel d&apos;Offre
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <h3 className="font-semibold text-lg text-gray-900">{rfqData.title}</h3>
                      {rfqData.description && (
                        <p className="text-gray-600 mt-1">{rfqData.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Localisation:</span>
                      <span className="font-medium">{rfqData.buyerLocation}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Quantité:</span>
                      <span className="font-medium">
                        {rfqData.quantity.toLocaleString('fr-FR')} {rfqData.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calculator className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Prix cible:</span>
                      <span className="font-medium">
                        {rfqData.targetPrice 
                          ? `${rfqData.targetPrice.toLocaleString('fr-DZ')} ${rfqData.currency}`
                          : 'Sur demande'
                        }
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Expire le:</span>
                      <span className="font-medium">
                        {rfqData.expirationDate 
                          ? new Date(rfqData.expirationDate).toLocaleDateString('fr-FR')
                          : 'Non spécifié'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Articles du Devis</CardTitle>
                  <Button size="sm" variant="outline" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" /> Ajouter Article
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={item.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Article {index + 1}</Badge>
                          {items.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" /> Supprimer
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2 space-y-2">
                            <Label>Nom du Produit *</Label>
                            <Input
                              placeholder="Nom ou description du produit"
                              value={item.productName}
                              onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Quantité *</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Unité</Label>
                            <Select
                              value={item.unit}
                              onValueChange={(value) => updateItem(item.id, 'unit', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unité">Unité</SelectItem>
                                <SelectItem value="kg">Kg</SelectItem>
                                <SelectItem value="tonne">Tonne</SelectItem>
                                <SelectItem value="mètre">Mètre</SelectItem>
                                <SelectItem value="m²">m²</SelectItem>
                                <SelectItem value="m³">m³</SelectItem>
                                <SelectItem value="litre">Litre</SelectItem>
                                <SelectItem value="sac">Sac</SelectItem>
                                <SelectItem value="palette">Palette</SelectItem>
                                <SelectItem value={rfqData.unit}>{rfqData.unit}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Prix Unitaire ({rfqData.currency}) *</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Total</Label>
                            <Input
                              value={`${item.totalPrice.toLocaleString('fr-DZ')} ${rfqData.currency}`}
                              disabled
                              className="bg-gray-50 font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Informations Complémentaires</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes / Conditions</Label>
                    <Textarea
                      id="notes"
                      placeholder="Ajoutez des notes, conditions particulières, délais de livraison..."
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="validUntil">Valide jusqu&apos;au *</Label>
                      <Input
                        id="validUntil"
                        type="date"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxRate">Taux de TVA (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="100"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Preview Mode */
            <Card>
              <CardHeader>
                <CardTitle>Aperçu du Devis</CardTitle>
                <CardDescription>Vérifiez les détails avant d&apos;envoyer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Header */}
                <div className="border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">DEVIS</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Réf: QT-{new Date().getFullYear()}-{String(Math.floor(Math.random() * 1000)).padStart(3, '0')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">AlgeriaTrade.dz</p>
                      <p className="text-sm text-gray-500">Votre Entreprise SARL</p>
                    </div>
                  </div>
                </div>

                {/* RFQ Reference */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">En réponse à:</p>
                  <p className="text-blue-900">{rfqData.title}</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Localisation: {rfqData.buyerLocation}
                  </p>
                </div>

                {/* Items Table */}
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Produit</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">Qté</th>
                      <th className="text-center py-2 px-3 text-sm font-medium text-gray-600">Unité</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">P.U.</th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter(i => i.productName).map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3 px-3 text-sm">{item.productName}</td>
                        <td className="py-3 px-3 text-sm text-center">{item.quantity}</td>
                        <td className="py-3 px-3 text-sm text-center">{item.unit}</td>
                        <td className="py-3 px-3 text-sm text-right">
                          {item.unitPrice.toLocaleString('fr-DZ')} {rfqData.currency}
                        </td>
                        <td className="py-3 px-3 text-sm text-right font-medium">
                          {item.totalPrice.toLocaleString('fr-DZ')} {rfqData.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2 max-w-xs ml-auto">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sous-total HT:</span>
                    <span>{subtotal.toLocaleString('fr-DZ')} {rfqData.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">TVA ({taxRate}%):</span>
                    <span>{taxAmount.toLocaleString('fr-DZ')} {rfqData.currency}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total TTC:</span>
                    <span className="text-green-600">
                      {totalWithTax.toLocaleString('fr-DZ')} {rfqData.currency}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium mb-2">Notes et Conditions:</p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{notes}</p>
                    </div>
                  </>
                )}

                {/* Validity */}
                <div className="bg-gray-50 p-3 rounded flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Ce devis est valide jusqu&apos;au: <strong>{new Date(validUntil).toLocaleDateString('fr-FR')}</strong></span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        {!showPreview && (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Résumé du Devis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Articles:</span>
                    <span className="font-medium">{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantité totale:</span>
                    <span className="font-medium">
                      {items.reduce((sum, i) => sum + i.quantity, 0).toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sous-total HT:</span>
                    <span>{subtotal.toLocaleString('fr-DZ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TVA ({taxRate}%):</span>
                    <span>{taxAmount.toLocaleString('fr-DZ')}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total TTC:</span>
                  <span className="text-green-600">
                    {totalWithTax.toLocaleString('fr-DZ')} DZD
                  </span>
                </div>

                <Separator />

                <div className="space-y-3 pt-2">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleSubmit('send')}
                    disabled={isSubmitting || items.some(i => !i.productName)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Envoi...' : 'Envoyer le Devis'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSubmit('draft')}
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Sauver en Brouillon
                  </Button>
                </div>

                {items.some(i => !i.productName) && (
                  <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    Veuillez remplir tous les champs obligatoires (*)
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preview Mode Actions */}
        {showPreview && (
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                    disabled={isSubmitting}
                  >
                    Retour à la modification
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit('draft')}
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Sauver en Brouillon
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleSubmit('send')}
                    disabled={isSubmitting || items.some(i => !i.productName)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Envoi en cours...' : 'Confirmer et Envoyer'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
