'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import InteractionTimeline from './InteractionTimeline'
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  MapPin,
  Building2,
  Linkedin,
  Clock,
  Edit2,
  Save,
  X,
  UserPlus,
  Tag,
  FileText,
} from 'lucide-react'

// Types
interface ContactData {
  id: string
  companyId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  mobile?: string
  jobTitle: string
  department?: string
  role: string
  linkedinUrl?: string
  avatarUrl?: string
  preferredLanguage: 'AR' | 'FR' | 'EN'
  preferredContactMethod: 'EMAIL' | 'PHONE' | 'WHATSAPP'
  timezone: string
  tags: string[]
  notes: string
  lastInteractionAt?: Date
  createdAt: Date
  updatedAt: Date
  interactionCount?: number
}

interface ContactDetailProps {
  contactId?: string
  contact?: ContactData
  onBack?: () => void
}

// Sample data for demonstration
const sampleContact: ContactData = {
  id: '1',
  companyId: 'company1',
  firstName: 'Ahmed',
  lastName: 'Benali',
  email: 'ahmed.benali@technologie-dz.dz',
  phone: '+213 555 123 456',
  mobile: '+213 661 234 567',
  jobTitle: 'Directeur Technique',
  department: 'IT',
  role: 'DECISION_MAKER',
  linkedinUrl: 'https://dz.linkedin.com/in/ahmedbenali',
  avatarUrl: undefined,
  preferredLanguage: 'FR',
  preferredContactMethod: 'EMAIL',
  timezone: 'Africa/Algiers',
  tags: ['vip', 'decision-maker', 'tech-savvy'],
  notes: 'Principal contact pour les décisions techniques. Très intéressé par nos solutions cloud.',
  lastInteractionAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-20'),
  interactionCount: 12,
}

export default function ContactDetail({ contactId, contact: initialContact, onBack }: ContactDetailProps) {
  const [contact, setContact] = useState<ContactData>(initialContact || sampleContact)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<ContactData>({ ...contact })
  const [activeTab, setActiveTab] = useState('info')

  // Fetch contact data if ID provided
  useEffect(() => {
    if (contactId && !initialContact) {
      // In production, fetch from API
      console.log('Fetching contact:', contactId)
    }
  }, [contactId, initialContact])

  const handleSave = async () => {
    try {
      // In production, save to API
      setContact({ ...editData })
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving contact:', error)
    }
  }

  const handleCancel = () => {
    setEditData({ ...contact })
    setIsEditing(false)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'DECISION_MAKER': return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'INFLUENCER': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'TECHNICAL': return 'bg-green-100 text-green-700 border-green-300'
      case 'FINANCIAL': return 'bg-amber-100 text-amber-700 border-amber-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <X className="h-5 w-5" />
            </Button>
          )}
          
          <Avatar className="h-16 w-16">
            <AvatarImage src={contact.avatarUrl} />
            <AvatarFallback className="bg-orange-100 text-orange-700 text-xl font-medium">
              {contact.firstName[0]}{contact.lastName[0]}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h1 className="text-2xl font-bold">
              {contact.firstName} {contact.lastName}
            </h1>
            <p className="text-gray-500">{contact.jobTitle}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={getRoleBadgeColor(contact.role)}>
                {contact.role.replace('_', ' ')}
              </Badge>
              {contact.department && (
                <Badge variant="secondary">{contact.department}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="mr-2 h-4 w-4" /> Modifier
              </Button>
              <Button>
                <MessageSquare className="mr-2 h-4 w-4" /> Contacter
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" /> Enregistrer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Phone className="h-4 w-4" /> Appeler
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Mail className="h-4 w-4" /> Email
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <MessageSquare className="h-4 w-4" /> WhatsApp
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" /> Réunion
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" /> Créer prospect
            </Button>
            
            <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              Dernière interaction: {contact.lastInteractionAt?.toLocaleDateString('fr-FR')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="interactions">Interactions ({contact.interactionCount || 0})</TabsTrigger>
          <TabsTrigger value="notes">Notes & Tags</TabsTrigger>
        </TabsList>

        {/* Contact Info Tab */}
        <TabsContent value="info" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Prénom</label>
                        <Input 
                          value={editData.firstName}
                          onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Nom</label>
                        <Input 
                          value={editData.lastName}
                          onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <Input 
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Téléphone</label>
                        <Input 
                          value={editData.phone}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Mobile</label>
                        <Input 
                          value={editData.mobile || ''}
                          onChange={(e) => setEditData({ ...editData, mobile: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Poste</label>
                        <Input 
                          value={editData.jobTitle}
                          onChange={(e) => setEditData({ ...editData, jobTitle: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Département</label>
                        <Input 
                          value={editData.department || ''}
                          onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 pb-3 border-b">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">{contact.email}</a>
                    </div>
                    
                    <div className="flex items-center gap-3 pb-3 border-b">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{contact.phone}</span>
                    </div>
                    
                    {contact.mobile && (
                      <div className="flex items-center gap-3 pb-3 border-b">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{contact.mobile}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 pb-3 border-b">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span>{contact.jobTitle}{contact.department ? ` - ${contact.department}` : ''}</span>
                    </div>
                    
                    {contact.linkedinUrl && (
                      <div className="flex items-center gap-3">
                        <Linkedin className="h-4 w-4 text-gray-400" />
                        <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Profil LinkedIn
                        </a>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Preferences & Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Préférences & Métadonnées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Rôle</label>
                      <Select 
                        value={editData.role} 
                        onValueChange={(v) => setEditData({ ...editData, role: v })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DECISION_MAKER">Décideur</SelectItem>
                          <SelectItem value="INFLUENCEUR">Influenceur</SelectItem>
                          <SelectItem value="TECHNIQUE">Technique</SelectItem>
                          <SelectItem value="FINANCIER">Financier</SelectItem>
                          <SelectItem value="UTILISATEUR_FINAL">Utilisateur final</SelectItem>
                          <SelectItem value="AUTRE">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Langue préférée</label>
                      <Select 
                        value={editData.preferredLanguage} 
                        onValueChange={(v) => setEditData({ ...editData, preferredLanguage: v as any })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FR">Français</SelectItem>
                          <SelectItem value="AR">العربية</SelectItem>
                          <SelectItem value="EN">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Méthode de contact préférée</label>
                      <Select 
                        value={editData.preferredContactMethod} 
                        onValueChange={(v) => setEditData({ ...editData, preferredContactMethod: v as any })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EMAIL">Email</SelectItem>
                          <SelectItem value="PHONE">Téléphone</SelectItem>
                          <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-gray-500">Rôle</span>
                      <Badge variant="outline" className={getRoleBadgeColor(contact.role)}>
                        {contact.role.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-gray-500">Langue préférée</span>
                      <span className="text-sm font-medium">
                        {contact.preferredLanguage === 'FR' ? 'Français' : 
                         contact.preferredLanguage === 'AR' ? 'العربية' : 'English'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-gray-500">Contact préféré</span>
                      <span className="text-sm font-medium">
                        {contact.preferredContactMethod === 'EMAIL' ? 'Email' : 
                         contact.preferredContactMethod === 'PHONE' ? 'Téléphone' : 'WhatsApp'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-gray-500">Fuseau horaire</span>
                      <span className="text-sm font-medium">{contact.timezone}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-500">Créé le</span>
                      <span className="text-sm font-medium">
                        {new Date(contact.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-500">Dernière modification</span>
                      <span className="text-sm font-medium">
                        {new Date(contact.updatedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Interactions Tab */}
        <TabsContent value="interactions" className="mt-6">
          <InteractionTimeline contactId={contact.id} companyId={contact.companyId} />
        </TabsContent>

        {/* Notes & Tags Tab */}
        <TabsContent value="notes" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editData.notes || ''}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    placeholder="Ajouter des notes sur ce contact..."
                    rows={8}
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    {contact.notes ? (
                      <p className="whitespace-pre-wrap text-gray-700">{contact.notes}</p>
                    ) : (
                      <p className="text-gray-400 italic">Aucune note</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-5 w-5" /> Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(contact.tags || []).map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                  
                  {(!contact.tags || contact.tags.length === 0) && !isEditing && (
                    <p className="text-gray-400 italic">Aucun tag</p>
                  )}
                </div>
                
                {isEditing && (
                  <div className="mt-4">
                    <Input placeholder="Ajouter un tag..." className="mb-2" />
                    <p className="text-xs text-gray-500">Appuyez sur Entrée pour ajouter</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
