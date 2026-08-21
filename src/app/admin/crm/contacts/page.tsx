'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Users,
  Search,
  Plus,
  Download,
  Upload,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  Building2,
  MapPin,
  Tag,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  MessageSquare,
  FileText,
  Star,
  UserPlus,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  Globe,
} from 'lucide-react'

// Types
interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  position: string
  city: string
  wilaya: string
  status: 'active' | 'inactive' | 'prospect' | 'client'
  tags: string[]
  createdAt: Date
  lastContact: Date | null
  notes: string
}

// Mock Data - 25 Algerian Company Contacts
const mockContacts: Contact[] = [
  {
    id: '1',
    firstName: 'Karim',
    lastName: 'Benali',
    email: 'k.benali@algertech.dz',
    phone: '+213 555 123 456',
    company: 'AlgerTech Solutions',
    position: 'Directeur Général',
    city: 'Alger',
    wilaya: '16',
    status: 'client',
    tags: ['IT', 'Premium', 'Partenaire'],
    createdAt: new Date('2023-06-15'),
    lastContact: new Date('2024-01-18'),
    notes: 'Client stratégique, intérêt pour expansion régionale',
  },
  {
    id: '2',
    firstName: 'Sara',
    lastName: 'Hamadi',
    email: 's.hamadi@condor.dz',
    phone: '+213 555 234 567',
    company: 'Condor Algérie',
    position: 'Directrice Achats',
    city: 'Boumerdès',
    wilaya: '35',
    status: 'active',
    tags: ['Électroménager', 'Distribution', 'Hot'],
    createdAt: new Date('2023-08-22'),
    lastContact: new Date('2024-01-19'),
    notes: 'Projet en cours de négociation - équipements industriels',
  },
  {
    id: '3',
    firstName: 'Nadia',
    lastName: 'Cherif',
    email: 'n.cherif@naftal.dz',
    phone: '+213 661 345 678',
    company: 'Naftal',
    position: 'Chef de Projet',
    city: 'Alger',
    wilaya: '16',
    status: 'active',
    tags: ['Pétrole', 'Gaz', 'B2B'],
    createdAt: new Date('2023-09-10'),
    lastContact: new Date('2024-01-17'),
    notes: 'Besoin urgent en solutions de gestion logistique',
  },
  {
    id: '4',
    firstName: 'Omar',
    lastName: 'Boudiaf',
    email: 'o.boudiaf@cevital.dz',
    phone: '+213 555 456 789',
    company: 'Cevital Group',
    position: 'Responsable Approvisionnement',
    city: 'Béjaïa',
    wilaya: '06',
    status: 'client',
    tags: ['Agroalimentaire', 'Grande entreprise'],
    createdAt: new Date('2023-05-20'),
    lastContact: new Date('2024-01-15'),
    notes: 'Contrat annuel en renouvellement',
  },
  {
    id: '5',
    firstName: 'Lina',
    lastName: 'Messaoudi',
    email: 'l.messaoudi@ifri.dz',
    phone: '+213 771 567 890',
    company: 'IFRI',
    position: 'Directrice Marketing',
    city: 'Alger',
    wilaya: '16',
    status: 'active',
    tags: ['Boissons', 'Distribution nationale'],
    createdAt: new Date('2023-07-05'),
    lastContact: new Date('2024-01-14'),
    notes: 'Intéressée par nos solutions CRM',
  },
  {
    id: '6',
    firstName: 'Youssef',
    lastName: 'Amrani',
    email: 'y.amrani@sonatrach.dz',
    phone: '+213 661 678 901',
    company: 'Sonatrach',
    position: 'Directeur IT',
    city: 'Hassi Messaoud',
    wilaya: '30',
    status: 'active',
    tags: ['Énergie', 'Pétrole', 'Gouvernement'],
    createdAt: new Date('2023-04-12'),
    lastContact: new Date('2024-01-16'),
    notes: 'Grand projet digitalisation en préparation',
  },
  {
    id: '7',
    firstName: 'Fatima',
    lastName: 'Zerhouni',
    email: 'f.zerhouni@sider.dz',
    phone: '+213 555 789 012',
    company: 'Sider',
    position: 'DRH',
    city: 'Annaba',
    wilaya: '36',
    status: 'prospect',
    tags: ['Métallurgie', 'Ressources humaines'],
    createdAt: new Date('2023-11-28'),
    lastContact: null,
    notes: 'Prospect froid à réactiver',
  },
  {
    id: '8',
    firstName: 'Mohamed',
    lastName: 'Kaci',
    email: 'm.kaci@airalgerie.dz',
    phone: '+213 21 987 654',
    company: 'Air Algérie',
    position: 'Chef Service Achat',
    city: 'Alger',
    wilaya: '16',
    status: 'client',
    tags: ['Aviation', 'Transport'],
    createdAt: new Date('2023-03-08'),
    lastContact: new Date('2024-01-10'),
    notes: 'Fournisseur agréé depuis 2019',
  },
  {
    id: '9',
    firstName: 'Amina',
    lastName: 'Belkacem',
    email: 'a.belkacem@algerie-telecom.dz',
    phone: '+213 555 111 222',
    company: 'Algérie Télécom',
    position: 'Directrice Innovation',
    city: 'Alger',
    wilaya: '16',
    status: 'active',
    tags: ['Télécom', 'Innovation', 'Public'],
    createdAt: new Date('2023-09-15'),
    lastContact: new Date('2024-01-12'),
    notes: 'Partenariat potentiel R&D',
  },
  {
    id: '10',
    firstName: 'Rachid',
    lastName: 'Mokrani',
    email: 'r.mokrani@eng.dz',
    phone: '+213 29 333 444',
    company: 'ENG (Entreprise Nationale des Granulats)',
    position: 'DG Adjoint',
    city: 'Constantine',
    wilaya: '25',
    status: 'prospect',
    tags: ['Construction', 'Matériaux', 'Public'],
    createdAt: new Date('2023-12-01'),
    lastContact: null,
    notes: 'Nouveau prospect - premier contact à faire',
  },
  {
    id: '11',
    firstName: 'Samira',
    lastName: 'Hadji',
    email: 's.hadji@nedromy.dz',
    phone: '+213 48 444 555',
    company: 'Nedromy Pharma',
    position: 'Responsable Qualité',
    city: 'Tlemcen',
    wilaya: '13',
    status: 'active',
    tags: ['Pharmaceutique', 'Qualité'],
    createdAt: new Date('2023-10-20'),
    lastContact: new Date('2024-01-08'),
    notes: 'Exigences qualité strictes',
  },
  {
    id: '12',
    firstName: 'Abdelkrim',
    lastName: 'Bensalah',
    email: 'a.bensalah@bim-dz.dz',
    phone: '+213 555 666 777',
    company: 'BIM Bank',
    position: 'DSI',
    city: 'Alger',
    wilaya: '16',
    status: 'client',
    tags: ['Banque', 'Finance', 'IT'],
    createdAt: new Date('2023-02-14'),
    lastContact: new Date('2024-01-19'),
    notes: 'Migration système en cours',
  },
  {
    id: '13',
    firstName: 'Dalia',
    lastName: 'Bouazza',
    email: 'd.bouazza@setifis.dz',
    phone: '+213 36 777 888',
    company: 'Setifis',
    position: 'Commerciale',
    city: 'Sétif',
    wilaya: '19',
    status: 'inactive',
    tags: ['Textile', 'Industrie'],
    createdAt: new Date('2023-01-30'),
    lastContact: new Date('2023-09-20'),
    notes: 'Contact inactif depuis 4 mois',
  },
  {
    id: '14',
    firstName: 'Nabil',
    lastName: 'Guendouz',
    email: 'n.guendouz@cooperativa.dz',
    phone: '+213 29 888 999',
    company: 'Cooperativa Agro',
    position: 'PDG',
    city: 'Blida',
    wilaya: '09',
    status: 'prospect',
    tags: ['Agriculture', 'Coopérative'],
    createdAt: new Date('2023-12-15'),
    lastContact: null,
    notes: 'Réunion planifiée la semaine prochaine',
  },
  {
    id: '15',
    firstName: 'Meriem',
    lastName: 'Attiyah',
    email: 'm.attiyah@orasc.dz',
    phone: '+213 41 123 000',
    company: 'ORASC (Organisation Régionale de la Santé)',
    position: 'Responsable Achats',
    city: 'Oran',
    wilaya: '31',
    status: 'active',
    tags: ['Santé', 'Public', 'Urgent'],
    createdat: new Date('2023-11-05'),
    lastContact: new Date('2024-01-18'),
    notes: 'Appel d\'offres en cours',
  },
  {
    id: '16',
    firstName: 'Kamel',
    lastName: 'Messaoud',
    email: 'k.messaoud@sim.dz',
    phone: '+213 49 234 111',
    company: 'SIM (Société Industrielle des Matériaux)',
    position: 'Directeur Technique',
    city: 'Skikda',
    wilaya: '21',
    status: 'client',
    tags: ['Industrie', 'Pétrochimie'],
    createdAt: new Date('2023-06-01'),
    lastContact: new Date('2024-01-11'),
    notes: 'Maintenance annuelle prévue',
  },
  {
    id: '17',
    firstName: 'Wassila',
    lastName: 'Kerdjouj',
    email: 'w.kerdjouj@canal-algerie.dz',
    phone: '+213 23 345 222',
    company: 'Canal Algérie',
    position: 'Productrice',
    city: 'Alger',
    wilaya: '16',
    status: 'active',
    tags: ['Média', 'Communication'],
    createdAt: new Date('2023-08-10'),
    lastContact: new Date('2024-01-13'),
    notes: 'Collaboration éventuelle sur contenu',
  },
  {
    id: '18',
    firstName: 'Tarek',
    lastName: 'Boukerma',
    email: 't.boukerma@gema.dz',
    phone: '+213 29 456 333',
    company: 'GEMA (Groupement des Entreprises du M\'Sila)',
    position: 'Secrétaire Général',
    city: 'M\'sila',
    wilaya: '28',
    status: 'prospect',
    tags: ['Association', 'PME'],
    createdAt: new Date('2023-12-20'),
    lastContact: null,
    notes: 'Réseau de PME intéressées',
  },
  {
    id: '19',
    firstName: 'Nouria',
    lastName: 'Haddadi',
    email: 'n.haddadi@nca-rustasa.dz',
    phone: '+213 37 567 444',
    company: 'NCA Rustasa',
    position: 'DRH',
    city: 'Annaba',
    wilaya: '36',
    status: 'active',
    tags: ['Automobile', 'Industrie'],
    createdAt: new Date('2023-07-22'),
    lastContact: new Date('2024-01-09'),
    notes: 'Formation équipes prévue Q1',
  },
  {
    id: '20',
    firstName: 'Sid Ahmed',
    lastName: 'Ferhat',
    email: 'sa.ferhat@usitor.dz',
    phone: '+213 33 678 555',
    company: 'USITOR',
    position: 'Directeur Commercial',
    city: 'Tizi Ouzou',
    wilaya: '15',
    status: 'client',
    tags: ['Tourisme', 'Hôtellerie'],
    createdAt: new Date('2023-04-18'),
    lastContact: new Date('2024-01-17'),
    notes: 'Saison estivale - besoins accrus',
  },
  {
    id: '21',
    firstName: 'Imane',
    lastName: 'Zitouni',
    email: 'i.zitouni@biopharm.dz',
    phone: '+213 31 789 666',
    company: 'Biopharm',
    position: 'Responsable Export',
    city: 'Constantine',
    wilaya: '25',
    status: 'active',
    tags: ['Pharmaceutique', 'Export'],
    createdAt: new Date('2023-09-28'),
    lastContact: new Date('2024-01-16'),
    notes: 'Expansion marché africain',
  },
  {
    id: '22',
    firstName: 'Reda',
    lastName: 'Berrahma',
    email: 'r.berrahma@eteeb.dz',
    phone: '+213 49 890 777',
    company: 'ETEEB',
    position: 'Ingénieur Principal',
    city: 'Biskra',
    wilaya: '07',
    status: 'prospect',
    tags: ['Énergie renouvelable', 'Environnement'],
    createdAt: new Date('2024-01-02'),
    lastContact: null,
    notes: 'Projet solaire ambitieux',
  },
  {
    id: '23',
    firstName: 'Salima',
    lastName: 'Cheriet',
    email: 's.cheriet@celtal.dz',
    phone: '+213 43 901 888',
    company: 'Celtal',
    position: 'Directrice Commerciale',
    city: 'Tlemcen',
    wilaya: '13',
    status: 'inactive',
    tags: ['Ciment', 'BTP'],
    createdAt: new Date('2023-03-25'),
    lastContact: new Date('2023-10-15'),
    notes: 'À relancer - fusion possible avec Lafarge',
  },
  {
    id: '24',
    firstName: 'Mourad',
    lastName: 'Medelmine',
    email: 'm.medelmine@syrte.dz',
    phone: '+213 29 012 999',
    company: 'Syrte Pharmaceuticals',
    position: 'PDG',
    city: 'Constantine',
    wilaya: '25',
    status: 'active',
    tags: ['Pharmaceutique', 'Startup'],
    createdAt: new Date('2023-10-10'),
    lastContact: new Date('2024-01-19'),
    notes: 'Startup innovante - fort potentiel',
  },
  {
    id: '25',
    firstName: 'Leila',
    lastName: 'Benmehidi',
    email: 'l.benmehidi@promeo.dz',
    phone: '+213 33 123 100',
    company: 'Proméo',
    position: 'Marketing Manager',
    city: 'Skikda',
    wilaya: '21',
    status: 'prospect',
    tags: ['Cosmétique', 'Beauté'],
    createdAt: new Date('2024-01-10'),
    lastContact: null,
    notes: 'Nouvelle marque locale en croissance',
  },
]

const cities = [...new Set(mockContacts.map(c => c.city))].sort()
const allTags = [...new Set(mockContacts.flatMap(c => c.tags))].sort()

export default function ContactsPage() {
  const [contacts] = useState<Contact[]>(mockContacts)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [sortField, setSortField] = useState<'createdAt' | 'lastName' | 'company'>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Filter and search
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(query) ||
          contact.email.toLowerCase().includes(query) ||
          contact.company.toLowerCase().includes(query) ||
          contact.phone.includes(query)
        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter !== 'all' && contact.status !== statusFilter) return false

      // City filter
      if (cityFilter !== 'all' && contact.city !== cityFilter) return false

      // Tag filter
      if (tagFilter !== 'all' && !contact.tags.includes(tagFilter)) return false

      return true
    })
  }, [contacts, searchQuery, statusFilter, cityFilter, tagFilter])

  // Sort
  const sortedContacts = useMemo(() => {
    return [...filteredContacts].sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'lastName':
          comparison = a.lastName.localeCompare(b.lastName)
          break
        case 'company':
          comparison = a.company.localeCompare(b.company)
          break
        case 'createdAt':
        default:
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
          break
      }
      
      return sortDirection === 'desc' ? -comparison : comparison
    })
  }, [filteredContacts, sortField, sortDirection])

  // Paginate
  const totalPages = Math.ceil(sortedContacts.length / pageSize)
  const paginatedContacts = sortedContacts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleSelectAll = () => {
    if (selectedContacts.size === paginatedContacts.length) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(paginatedContacts.map(c => c.id)))
    }
  }

  const handleSelectContact = (id: string) => {
    const newSelected = new Set(selectedContacts)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedContacts(newSelected)
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getStatusBadge = (status: Contact['status']) => {
    switch (status) {
      case 'client':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Client</Badge>
      case 'active':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Actif</Badge>
      case 'prospect':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Prospect</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Inactif</Badge>
    }
  }

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      'IT': 'bg-indigo-100 text-indigo-700',
      'Premium': 'bg-purple-100 text-purple-700',
      'Partenaire': 'bg-pink-100 text-pink-700',
      'Électroménager': 'bg-cyan-100 text-cyan-700',
      'Distribution': 'bg-teal-100 text-teal-700',
      'Hot': 'bg-red-100 text-red-700',
      'Pétrole': 'bg-amber-100 text-amber-700',
      'Gaz': 'bg-orange-100 text-orange-700',
      'B2B': 'bg-slate-100 text-slate-700',
      'Agroalimentaire': 'bg-lime-100 text-lime-700',
      'Grande entreprise': 'bg-violet-100 text-violet-700',
      'Boissons': 'bg-sky-100 text-sky-700',
      'Énergie': 'bg-red-50 text-red-600',
      'Gouvernement': 'bg-blue-50 text-blue-600',
      'Aviation': 'bg-gray-100 text-gray-700',
      'Transport': 'bg-stone-100 text-stone-700',
      'Télécom': 'bg-green-100 text-green-700',
      'Innovation': 'bg-fuchsia-100 text-fuchsia-700',
      'Public': 'bg-yellow-50 text-yellow-600',
      'Banque': 'bg-emerald-50 text-emerald-600',
      'Finance': 'bg-teal-50 text-teal-600',
      'Pharmaceutique': 'bg-rose-100 text-rose-700',
      'Qualité': 'bg-orange-50 text-orange-600',
      'Textile': 'bg-pink-50 text-pink-600',
      'Industrie': 'bg-zinc-100 text-zinc-700',
      'Agriculture': 'bg-lime-50 text-lime-600',
      'Coopérative': 'bg-green-50 text-green-600',
      'Santé': 'bg-red-100 text-red-600',
      'Urgent': 'bg-red-500 text-white',
      'Média': 'bg-purple-50 text-purple-600',
      'Communication': 'bg-indigo-50 text-indigo-600',
      'Association': 'bg-cyan-50 text-cyan-600',
      'PME': 'bg-amber-50 text-amber-600',
      'Automobile': 'bg-slate-50 text-slate-600',
      'Tourisme': 'bg-teal-50 text-teal-600',
      'Hôtellerie': 'bg-sky-50 text-sky-600',
      'Export': 'bg-green-50 text-green-600',
      'Énergie renouvelable': 'bg-emerald-50 text-emerald-600',
      'Environnement': 'bg-green-50 text-green-600',
      'Cement': 'bg-stone-100 text-stone-700',
      'BTP': 'bg-yellow-100 text-yellow-600',
      'Startup': 'bg-violet-50 text-violet-600',
      'Cosmétique': 'bg-pink-50 text-pink-600',
      'Beauté': 'bg-fuchsia-50 text-fuchsia-600',
    }
    return colors[tag] || 'bg-gray-100 text-gray-700'
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const handleExport = () => {
    alert(`Export de ${selectedContacts.size || filteredContacts.length} contacts...`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gestion des Contacts</h1>
                <p className="text-sm text-gray-500">{filteredContacts.length} contacts trouvés</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
              <Button 
                size="sm"
                onClick={() => setShowDetailModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Contact
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email, société..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>

              {/* City Filter */}
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Ville" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les villes</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Tag Filter */}
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les tags</SelectItem>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters Display */}
            {(statusFilter !== 'all' || cityFilter !== 'all' || tagFilter !== 'all') && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-xs text-gray-500">Filtres actifs:</span>
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setStatusFilter('all')}>
                    Statut: {statusFilter} <X className="ml-1 h-3 w-3" />
                  </Badge>
                )}
                {cityFilter !== 'all' && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setCityFilter('all')}>
                    Ville: {cityFilter} <X className="ml-1 h-3 w-3" />
                  </Badge>
                )}
                {tagFilter !== 'all' && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setTagFilter('all')}>
                    Tag: {tagFilter} <X className="ml-1 h-3 w-3" />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs ml-auto"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                    setCityFilter('all')
                    setTagFilter('all')
                  }}
                >
                  Réinitialiser tout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedContacts.size > 0 && (
          <Card className="mb-4 border-blue-200 bg-blue-50/30">
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">
                {selectedContacts.size} contact(s) sélectionné(s)
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exporter sélection
                </Button>
                <Button variant="outline" size="sm">
                  <Tag className="mr-2 h-4 w-4" />
                  Ajouter tags
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedContacts(new Set())}>
                  Désélectionner
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contacts Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedContacts.size === paginatedContacts.length && paginatedContacts.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('lastName')}
                    >
                      <div className="flex items-center gap-1">
                        Nom
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-1">
                        Créé le
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedContacts.map((contact) => (
                    <TableRow 
                      key={contact.id}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        selectedContacts.has(contact.id) ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={(e) => {
                        if (!(e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('[role=checkbox]')) {
                          setSelectedContact(contact)
                          setShowDetailModal(true)
                        }
                      }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedContacts.has(contact.id)}
                          onCheckedChange={() => handleSelectContact(contact.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-semibold text-xs">
                            {contact.firstName[0]}{contact.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                            <p className="text-xs text-gray-500">{contact.position}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm">{contact.company}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                          {contact.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        <a href={`tel:${contact.phone}`} className="text-sm text-gray-600" onClick={(e) => e.stopPropagation()}>
                          {contact.phone}
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm">{contact.city}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {contact.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className={`${getTagColor(tag)} text-[10px]`}>
                              {tag}
                            </Badge>
                          ))}
                          {contact.tags.length > 2 && (
                            <Badge variant="secondary" className="text-[10px]">
                              +{contact.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(contact.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">{formatDate(contact.createdAt)}</span>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedContact(contact)
                              setShowDetailModal(true)
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Phone className="mr-2 h-4 w-4" />
                              Appeler
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Envoyer email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                  {paginatedContacts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12">
                        <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">Aucun contact trouvé</p>
                        <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres ou ajoutez un nouveau contact</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Afficher:</span>
                <Select value={pageSize.toString()} onValueChange={(v) => {
                  setPageSize(Number(v))
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-500">
                  {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, sortedContacts.length)} sur {sortedContacts.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Contact Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedContact ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-semibold">
                    {selectedContact.firstName[0]}{selectedContact.lastName[0]}
                  </div>
                  <div>
                    <p>{selectedContact.firstName} {selectedContact.lastName}</p>
                    <p className="text-sm font-normal text-gray-500">{selectedContact.position}</p>
                  </div>
                </>
              ) : (
                <>
                  <UserPlus className="w-6 h-6" />
                  Nouveau Contact
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedContact ? (
            <div className="space-y-6 mt-4">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Entreprise</p>
                          <p className="font-medium">{selectedContact.company}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="font-medium text-blue-600">{selectedContact.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Téléphone</p>
                          <p className="font-medium">{selectedContact.phone}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Localisation</p>
                          <p className="font-medium">{selectedContact.city}, Wilaya {selectedContact.wilaya}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Date création</p>
                          <p className="font-medium">{formatDate(selectedContact.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Dernier contact</p>
                          <p className="font-medium">
                            {selectedContact.lastContact ? formatDate(selectedContact.lastContact) : 'Jamais'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tags & Status */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium">Tags:</span>
                {selectedContact.tags.map(tag => (
                  <Badge key={tag} className={getTagColor(tag)}>{tag}</Badge>
                ))}
                <span className="text-sm font-medium ml-3">Statut:</span>
                {getStatusBadge(selectedContact.status)}
              </div>

              {/* Notes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{selectedContact.notes}</p>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm">
                  <Phone className="mr-2 h-4 w-4" />
                  Appeler
                </Button>
                <Button size="sm" variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer Email
                </Button>
                <Button size="sm" variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <UserPlus className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Formulaire de création de contact</p>
              <p className="text-sm text-gray-400 mt-1">À implémenter</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 bg-white">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>AlgeriaTrade.dz - Gestion des Contacts</span>
            </div>
            
            <div className="flex items-center gap-6">
              <span>Total: {contacts.length} contacts</span>
              <span>Villes: {cities.length}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
