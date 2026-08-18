'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Scale,
  ArrowLeft,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Handshake,
  TrendingDown,
  Calculator,
  Package,
  User,
  Building2,
  MessageSquare,
  Send,
  Plus,
  Calendar,
  Tag
} from 'lucide-react'

// Types
type NegotiationStatus = 'pending' | 'countered' | 'accepted' | 'rejected' | 'expired'

interface Offer {
  id: string
  price: number
  percentOff: number
  message: string
  timestamp: string
  author: {
    name: string
    role: 'buyer' | 'seller' | 'admin'
    avatar?: string
  }
  isCounterOffer?: boolean
}

interface NegotiationDetail {
  id: string
  productId: string
  productName: string
  category: string
  description: string
  buyer: {
    name: string
    id: string
    company: string
  }
  seller: {
    name: string
    id: string
    company: string
  }
  originalPrice: number
  currentBestOffer: number
  status: NegotiationStatus
  createdAt: string
  expiresAt: string
  offers: Offer[]
  relatedOrderId?: string
}

// Mock data for a single negotiation
const mockNegotiationDetail: NegotiationDetail = {
  id: 'NEG-001',
  productId: 'P001',
  productName: 'Ciment Portland CEM I 42.5',
  category: 'Matériaux Construction',
  description: 'Ciment Portland de haute qualité CEM I 42.5, conforme aux normes algériennes NA 202. Sac de 50kg. Idéal pour les travaux de construction et béton armé.',
  buyer: {
    name: 'Karim Benali',
    id: 'B004',
    company: 'Bâtiments & Travaux SPA',
  },
  seller: {
    name: 'Amine Hadjoudja',
    id: 'S004',
    company: "Ciment d'Algérie",
  },
  originalPrice: 18500,
  currentBestOffer: 16200,
  status: 'countered',
  createdAt: '10/03/2024 09:30',
  expiresAt: '20/03/2024 23:59',
  relatedOrderId: undefined,
  offers: [
    {
      id: 'OFF-001',
      price: 18500,
      percentOff: 0,
      message: 'Bonjour, nous souhaitons commander 500 sacs de ciment pour notre chantier à Alger. Pouvez-vous nous proposer votre meilleur prix ?',
      timestamp: '10/03/2024 09:30',
      author: { name: 'Karim Benali', role: 'buyer' },
      isCounterOffer: false,
    },
    {
      id: 'OFF-002',
      price: 17800,
      percentOff: 3.8,
      message: 'Merci pour votre demande. Pour une commande de cette importance, nous pouvons vous offrir une remise de 3.8%. Prix : 17,800 د.ج par sac.',
      timestamp: '10/03/2024 14:15',
      author: { name: 'Amine Hadjoudja', role: 'seller' },
      isCounterOffer: true,
    },
    {
      id: 'OFF-003',
      price: 16800,
      percentOff: 9.2,
      message: 'Nous apprécions l\'offre, mais avec la quantité commandée et la relation commerciale envisagée sur le long terme, nous visons un prix autour de 16,800 د.ج.',
      timestamp: '12/03/2024 10:45',
      author: { name: 'Karim Benali', role: 'buyer' },
      isCounterOffer: true,
    },
    {
      id: 'OFF-004',
      price: 17200,
      percentOff: 7.0,
      message: 'Après validation avec notre direction, nous pouvons descendre à 17,200 د.ج. C\'est notre meilleure offre pour maintenir la qualité que vous connaissez.',
      timestamp: '13/03/2024 16:30',
      author: { name: 'Amine Hadjoudja', role: 'seller' },
      isCounterOffer: true,
    },
    {
      id: 'OFF-005',
      price: 16200,
      percentOff: 12.4,
      message: 'C\'est notre offre finale. Nous avons également un besoin urgent de 200 tonnes supplémentaires pour le trimestre prochain si ce prix est accepté.',
      timestamp: '15/03/2024 14:30',
      author: { name: 'Karim Benali', role: 'buyer' },
      isCounterOffer: true,
    },
  ],
}

// Helper functions
function formatDZD(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' د.ج'
}

function getStatusConfig(status: NegotiationStatus) {
  switch (status) {
    case 'pending':
      return { label: 'En attente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock }
    case 'countered':
      return { label: 'Contre-offre en cours', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Scale }
    case 'accepted':
      return { label: 'Acceptée', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle }
    case 'rejected':
      return { label: 'Rejetée', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle }
    case 'expired':
      return { label: 'Expirée', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: Clock }
  }
}

function getRoleBadge(role: string) {
  switch (role) {
    case 'buyer':
      return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Acheteur</Badge>
    case 'seller':
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Vendeur</Badge>
    case 'admin':
      return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">Admin</Badge>
    default:
      return null
  }
}

export default function NegotiationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const negotiationId = params.id as string
  
  const [negotiation] = useState<NegotiationDetail>(mockNegotiationDetail)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionType, setActionType] = useState<string>('')
  const [adminPrice, setAdminPrice] = useState('')
  const [adminMessage, setAdminMessage] = useState('')

  const statusConfig = getStatusConfig(negotiation.status)
  const StatusIcon = statusConfig.icon

  // Calculate profit margin (simulated)
  const estimatedCost = negotiation.originalPrice * 0.65 // Assume 35% margin
  const currentMargin = ((negotiation.currentBestOffer - estimatedCost) / negotiation.currentBestOffer) * 100
  const originalMargin = ((negotiation.originalPrice - estimatedCost) / negotiation.originalPrice) * 100

  const handleAdminAction = () => {
    console.log(`Executing action ${actionType} with price ${adminPrice}`)
    setShowActionDialog(false)
    setAdminPrice('')
    setAdminMessage('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Détail Négociation</h1>
                <p className="text-xs text-gray-500">{negotiation.id}</p>
              </div>
            </div>

            <Badge variant="outline" className={statusConfig.color}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Product Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  {negotiation.productName}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{negotiation.category}</Badge>
                  <span className="text-sm text-gray-500">ID Produit: {negotiation.productId}</span>
                </div>
              </div>
              
              <div className="text-right space-y-1">
                <p className="text-sm text-gray-500">Meilleure offre actuelle</p>
                <p className="text-2xl font-bold text-emerald-600">{formatDZD(negotiation.currentBestOffer)}</p>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  -{((1 - negotiation.currentBestOffer / negotiation.originalPrice) * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{negotiation.description}</p>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Acheteur</p>
                  <p className="font-medium">{negotiation.buyer.name}</p>
                  <p className="text-xs text-gray-400">{negotiation.buyer.company}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Vendeur</p>
                  <p className="font-medium">{negotiation.seller.name}</p>
                  <p className="text-xs text-gray-400">{negotiation.seller.company}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Créée le</p>
                  <p className="font-medium">{negotiation.createdAt}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Expire le</p>
                  <p className="font-medium">{negotiation.expiresAt}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Offers Timeline */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-gray-500" />
 Historique des offres ({negotiation.offers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {negotiation.offers.map((offer, index) => (
                    <div key={offer.id} className={`relative pl-8 pb-6 ${index !== negotiation.offers.length - 1 ? 'border-l-2 border-gray-200' : ''}`}>
                      {/* Timeline dot */}
                      <div className={`absolute left-0 top-0 w-4 h-4 rounded-full border-2 ${
                        offer.author.role === 'buyer' 
                          ? 'border-blue-500 bg-blue-100' 
                          : offer.author.role === 'seller'
                          ? 'border-emerald-500 bg-emerald-100'
                          : 'border-purple-500 bg-purple-100'
                      }`} style={{ transform: 'translateX(-50%)' }} />
                      
                      <div className={`rounded-lg p-4 ${
                        offer.author.role === 'buyer' 
                          ? 'bg-blue-50 border border-blue-100' 
                          : 'bg-emerald-50 border border-emerald-100'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className={
                                offer.author.role === 'buyer' 
                                  ? 'bg-blue-200 text-blue-700 text-xs' 
                                  : 'bg-emerald-200 text-emerald-700 text-xs'
                              }>
                                {offer.author.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium text-sm">{offer.author.name}</span>
                              {getRoleBadge(offer.author.role)}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            {offer.isCounterOffer && (
                              <Badge variant="outline" className="text-xs mb-1 bg-orange-50 text-orange-600 border-orange-200">
                                Contre-offre
                              </Badge>
                            )}
                            <p className="text-xs text-gray-500">{offer.timestamp}</p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">{offer.message}</p>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-inherit">
                          <div>
                            <span className="text-sm text-gray-500">Prix proposé:</span>
                            <span className="ml-2 font-semibold text-lg">{formatDZD(offer.price)}</span>
                          </div>
                          {offer.percentOff > 0 && (
                            <Badge variant="outline" className={offer.percentOff >= 10 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}>
                              <TrendingDown className="mr-1 h-3 w-3" />
                              -{offer.percentOff.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                        
                        {/* Highlight best offer */}
                        {offer.price === negotiation.currentBestOffer && (
                          <div className="mt-3 p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded border border-amber-200 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-700">Meilleure offre actuelle</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Actions Panel */}
          <div className="space-y-6">
            {/* Profit Margin Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-purple-500" />
                  Calculateur de marge
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Prix initial</p>
                    <p className="font-semibold">{formatDZD(negotiation.originalPrice)}</p>
                    <p className="text-xs text-emerald-600">Marge: {originalMargin.toFixed(1)}%</p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-gray-500">Offre actuelle</p>
                    <p className="font-semibold text-blue-700">{formatDZD(negotiation.currentBestOffer)}</p>
                    <p className={`text-xs ${currentMargin > 20 ? 'text-emerald-600' : currentMargin > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      Marge: {currentMargin.toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Coût estimé:</span>
                    <span>{formatDZD(estimatedCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Bénéfice potentiel:</span>
                    <span className="font-medium text-emerald-600">{formatDZD(negotiation.currentBestOffer - estimatedCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium pt-2 border-t">
                    <span>Économie acheteur:</span>
                    <span className="text-blue-600">{formatDZD(negotiation.originalPrice - negotiation.currentBestOffer)}</span>
                  </div>
                </div>
                
                {currentMargin < 15 && (
                  <div className="mt-3 p-2 bg-red-50 rounded border border-red-200 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700">
                      Attention: La marge est inférieure au seuil recommandé de 15%.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin Action Panel */}
            <Card className="border-purple-300 bg-purple-50/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Handshake className="h-5 w-5 text-purple-500" />
                  Actions Admin
                </CardTitle>
                <CardDescription>Intervenir dans cette négociation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => { setActionType('propose'); setShowActionDialog(true); }}
                >
                  <Tag className="mr-2 h-4 w-4" />
                  Proposer un prix
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-green-700 hover:text-green-800"
                  onClick={() => { setActionType('accept'); setShowActionDialog(true); }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accepter au nom du vendeur
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-700 hover:text-red-800"
                  onClick={() => { setActionType('reject'); setShowActionDialog(true); }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rejeter l&apos;offre
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => { setActionType('extend'); setShowActionDialog(true); }}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Prolonger le délai
                </Button>
                
                {negotiation.relatedOrderId && (
                  <Button 
                    variant="default" 
                    className="w-full justify-start mt-4"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Voir la commande associée
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nombre d&apos;offres</span>
                    <span className="font-medium">{negotiation.offers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Réduction totale obtenue</span>
                    <span className="font-medium text-emerald-600">
                      -{((1 - negotiation.currentBestOffer / negotiation.originalPrice) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Économie potentielle</span>
                    <span className="font-medium text-blue-600">
                      {formatDZD(negotiation.originalPrice - negotiation.currentBestOffer)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Admin Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'propose' && 'Proposer un prix'}
              {actionType === 'accept' && 'Confirmer l\'acceptation'}
              {actionType === 'reject' && 'Confirmer le rejet'}
              {actionType === 'extend' && 'Prolonger le délai'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'propose' && 'Entrez votre proposition de prix de compromis.'}
              {actionType === 'accept' && `Vous allez accepter l'offre de ${formatDZD(negotiation.currentBestOffer)} au nom du vendeur.`}
              {actionType === 'reject' && 'Cette action est irréversible. Le vendeur et l\'acheteur en seront notifiés.'}
              {actionType === 'extend' && 'Définissez la nouvelle date d\'expiration de la négociation.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {(actionType === 'propose' || actionType === 'extend') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {actionType === 'propose' ? 'Prix proposé (د.ج)' : 'Nouvelle date d\'expiration'}
                </label>
                {actionType === 'propose' ? (
                  <Input
                    type="number"
                    value={adminPrice}
                    onChange={(e) => setAdminPrice(e.target.value)}
                    placeholder={negotiation.currentBestOffer.toString()}
                  />
                ) : (
                  <Input
                    type="date"
                    value={adminPrice}
                    onChange={(e) => setAdminPrice(e.target.value)}
                  />
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Message (optionnel)</label>
              <Textarea
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                placeholder="Ajoutez un commentaire pour les parties..."
                rows={3}
              />
            </div>
            
            {actionType === 'propose' && adminPrice && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p>Réduction proposée: <strong>-{(1 - parseFloat(adminPrice) / negotiation.originalPrice * 100).toFixed(1)}%</strong></p>
                <p>Marge estimée: <strong>{(((parseFloat(adminPrice) || 0) - estimatedCost) / (parseFloat(adminPrice) || 1) * 100).toFixed(1)}%</strong></p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdminAction} className={
              actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
              actionType === 'accept' ? 'bg-green-600 hover:bg-green-700' : ''
            }>
              {actionType === 'propose' && 'Envoyer la proposition'}
              {actionType === 'accept' && 'Confirmer l\'acceptation'}
              {actionType === 'reject' && 'Confirmer le rejet'}
              {actionType === 'extend' && 'Prolonger'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
