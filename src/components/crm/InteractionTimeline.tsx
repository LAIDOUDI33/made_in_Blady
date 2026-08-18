'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  ShoppingCart,
  Bot,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Plus,
  MoreHorizontal,
  Clock,
  Smile,
  Meh,
  Frown,
} from 'lucide-react'

// Types
interface InteractionData {
  id: string
  contactId: string
  leadId?: string
  companyId: string
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'SYSTEM' | 'CHAT' | 'QUOTE_SENT' | 'ORDER_PLACED'
  direction: 'INBOUND' | 'OUTBOUND'
  subject: string
  content: string
  duration?: number
  channel?: string
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
  nextSteps?: string
  attachmentUrls: string[]
  automated: boolean
  createdBy: string
  createdAt: Date
  contactName?: string
  leadName?: string
}

interface InteractionTimelineProps {
  contactId?: string
  leadId?: string
  companyId?: string
  limit?: number
}

// Sample data
const sampleInteractions: InteractionData[] = [
  {
    id: '1',
    contactId: 'contact1',
    leadId: 'lead1',
    companyId: 'company1',
    type: 'CALL',
    direction: 'OUTBOUND',
    subject: 'Appel de suivi - Proposition commerciale',
    content: 'Discussion sur la proposition envoyée la semaine dernière. M. Benali a posé des questions sur les délais de livraison et les conditions de paiement. Il semble intéressé mais veut comparer avec un autre fournisseur.',
    duration: 25,
    channel: 'Téléphone',
    sentiment: 'POSITIVE',
    nextSteps: 'Envoyer les informations complémentaires sur les délais. Planifier une réunion pour finaliser.',
    attachmentUrls: [],
    automated: false,
    createdBy: 'user1',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    contactName: 'Ahmed Benali',
    leadName: 'SARL Technologie Algerienne',
  },
  {
    id: '2',
    contactId: 'contact1',
    leadId: 'lead1',
    companyId: 'company1',
    type: 'EMAIL',
    direction: 'INBOUND',
    subject: 'RE: Demande de devis - Solutions Cloud',
    content: 'Bonjour, Merci pour votre proposition. Nous souhaiterions avoir plus de détails sur les options de personnalisation. Pourriez-vous nous envoyer une version détaillée ? Cordialement, A. Benali',
    channel: 'Email',
    sentiment: 'POSITIVE',
    attachmentUrls: [],
    automated: false,
    createdBy: 'user1',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    contactName: 'Ahmed Benali',
  },
  {
    id: '3',
    contactId: 'contact1',
    leadId: 'lead1',
    companyId: 'company1',
    type: 'MEETING',
    direction: 'OUTBOUND',
    subject: 'Réunion de découverte',
    content: 'Première réunion avec M. Benali pour comprendre ses besoins. Présentation de nos solutions cloud. Très bon accueil. Besoins identifiés : migration de données, formation équipe, support technique.',
    duration: 90,
    channel: 'Visioconférence (Zoom)',
    sentiment: 'POSITIVE',
    nextSteps: 'Préparer proposition personnalisée basée sur les besoins identifiés.',
    attachmentUrls: ['presentation.pdf', 'notes-reunion.docx'],
    automated: false,
    createdBy: 'user1',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    contactName: 'Ahmed Benali',
    leadName: 'SARL Technologie Algerienne',
  },
  {
    id: '4',
    contactId: 'contact1',
    companyId: 'company1',
    type: 'NOTE',
    direction: 'OUTBOUND',
    subject: 'Note interne - Profil client',
    content: 'Ahmed Benali est le Directeur Technique de SARL Technologie Algerienne. C\'est un décideur clé. L\'entreprise compte environ 50 employés. Budget estimé pour ce projet: 2-3 millions DZD. Décision prévue fin Q1 2024.',
    automated: false,
    createdBy: 'user1',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
    contactName: 'Ahmed Benali',
  },
  {
    id: '5',
    contactId: 'contact1',
    companyId: 'company1',
    type: 'SYSTEM',
    direction: 'INBOUND',
    subject: 'Ouverture de formulaire de contact',
    content: 'Le contact a soumis le formulaire "Demander un devis" depuis la page produit Solutions Cloud.',
    automated: true,
    createdBy: 'system',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    contactName: 'Ahmed Benali',
  },
]

export default function InteractionTimeline({ 
  contactId, 
  leadId, 
  companyId, 
  limit = 20 
}: InteractionTimelineProps) {
  const [interactions, setInteractions] = useState<InteractionData[]>(sampleInteractions)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterDirection, setFilterDirection] = useState<string>('all')

  // Fetch interactions
  useEffect(() => {
    if (contactId || leadId) {
      // In production, fetch from API
      console.log('Fetching interactions for:', { contactId, leadId })
    }
  }, [contactId, leadId])

  // Filter interactions
  const filteredInteractions = interactions.filter(interaction => {
    if (filterType !== 'all' && interaction.type !== filterType) return false
    if (filterDirection !== 'all' && interaction.direction !== filterDirection) return false
    return true
  }).slice(0, limit)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CALL': return <Phone className="h-4 w-4" />
      case 'EMAIL': return <Mail className="h-4 w-4" />
      case 'MEETING': return <Calendar className="h-4 w-4" />
      case 'CHAT': return <MessageSquare className="h-4 w-4" />
      case 'QUOTE_SENT': return <FileText className="h-4 w-4" />
      case 'ORDER_PLACED': return <ShoppingCart className="h-4 w-4" />
      case 'SYSTEM': return <Bot className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CALL': return 'Appel'
      case 'EMAIL': return 'Email'
      case 'MEETING': return 'Réunion'
      case 'CHAT': return 'Chat'
      case 'NOTE': return 'Note'
      case 'QUOTE_SENT': return 'Devis envoyé'
      case 'ORDER_PLACED': return 'Commande passée'
      case 'SYSTEM': return 'Système'
      default: return type
    }
  }

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'POSITIVE': return <Smile className="h-4 w-4 text-green-500" />
      case 'NEGATIVE': return <Frown className="h-4 w-4 text-red-500" />
      default: return <Meh className="h-4 w-4 text-gray-400" />
    }
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - new Date(date).getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`
    
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: new Date(date).getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null
    
    if (minutes < 60) return `${minutes} min`
    
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`
  }

  // Group interactions by date
  const groupedInteractions = filteredInteractions.reduce((groups, interaction) => {
    const dateKey = new Date(interaction.createdAt).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: new Date(interaction.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    })
    
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(interaction)
    
    return groups
  }, {} as Record<string, InteractionData[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Historique des interactions</h3>
          <p className="text-sm text-gray-500">{filteredInteractions.length} interactions</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filters */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] h-9">
              <Filter className="mr-2 h-3.5 w-3.5" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              <SelectItem value="CALL">Appels</SelectItem>
              <SelectItem value="EMAIL">Emails</SelectItem>
              <SelectItem value="MEETING">Réunions</SelectItem>
              <SelectItem value="NOTE">Notes</SelectItem>
              <SelectItem value="SYSTEM">Système</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterDirection} onValueChange={setFilterDirection}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="INBOUND">Entrants</SelectItem>
              <SelectItem value="OUTBOUND">Sortants</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> Ajouter
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="p-0">
          {Object.keys(groupedInteractions).length > 0 ? (
            <div className="divide-y">
              {Object.entries(groupedInteractions).map(([date, interactionsForDate]) => (
                <div key={date}>
                  {/* Date header */}
                  <div className="px-4 py-2 bg-gray-50 sticky top-0">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {date}
                    </span>
                  </div>

                  {/* Interactions for this date */}
                  <div className="divide-y divide-gray-100">
                    {interactionsForDate.map((interaction) => (
                      <div key={interaction.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex gap-4">
                          {/* Icon & Direction */}
                          <div className="flex-shrink-0 relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              interaction.direction === 'INBOUND' 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-green-100 text-green-600'
                            }`}>
                              {getTypeIcon(interaction.type)}
                            </div>
                            
                            {/* Direction indicator */}
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                              interaction.direction === 'INBOUND' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-green-500 text-white'
                            }`}>
                              {interaction.direction === 'INBOUND' 
                                ? <ArrowDownLeft className="h-3 w-3" />
                                : <ArrowUpRight className="h-3 w-3" />
                              }
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="font-medium text-sm">{interaction.subject}</h4>
                                
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <Badge variant="outline" className="text-xs gap-1">
                                    {getTypeIcon(interaction.type)}
                                    {getTypeLabel(interaction.type)}
                                  </Badge>
                                  
                                  {interaction.channel && (
                                    <Badge variant="secondary" className="text-xs">
                                      {interaction.channel}
                                    </Badge>
                                  )}
                                  
                                  {interaction.duration && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDuration(interaction.duration)}
                                    </span>
                                  )}
                                  
                                  {interaction.sentiment && (
                                    <span className="flex items-center gap-1" title={`Sentiment: ${interaction.sentiment}`}>
                                      {getSentimentIcon(interaction.sentiment)}
                                    </span>
                                  )}
                                  
                                  {interaction.automated && (
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <Bot className="h-3 w-3" />
                                      Automatique
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  {formatRelativeTime(interaction.createdAt)}
                                </span>
                                
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Content preview */}
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {interaction.content}
                            </p>

                            {/* Next steps */}
                            {interaction.nextSteps && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700 flex items-start gap-2">
                                <ArrowRightIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span><strong>Prochaines étapes:</strong> {interaction.nextSteps}</span>
                              </div>
                            )}

                            {/* Attachments */}
                            {interaction.attachmentUrls.length > 0 && (
                              <div className="mt-2 flex items-center gap-2">
                                {interaction.attachmentUrls.map((url, idx) => (
                                  <Badge key={idx} variant="outline" className="gap-1 cursor-pointer hover:bg-gray-100">
                                    <FileText className="h-3 w-3" />
                                    {url.split('/').pop()}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Related entities */}
                            {(interaction.contactName || interaction.leadName) && (
                              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                <User className="h-3 w-3" />
                                {interaction.contactName}
                                {interaction.leadName && (
                                  <>
                                    <span>•</span>
                                    <span className="text-blue-600">{interaction.leadName}</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">Aucune interaction trouvée</h3>
              <p className="text-sm text-gray-500">Commencez à suivre vos interactions avec ce contact</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14"/>
      <path d="m12 5 7 7-7 7"/>
    </svg>
  )
}
