'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VerificationModal } from '@/components/admin/VerificationModal';
import {
  Building2,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Star,
  Package,
  AlertTriangle,
  Shield,
  Clock
} from 'lucide-react';

// Types
type VerificationStatusType = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

interface CompanyData {
  id: string;
  name: string;
  slug: string;
  legalForm: string;
  rcNumber: string;
  nif?: string;
  nis?: string;
  wilaya: string;
  commune?: string;
  address?: string;
  contactEmail: string;
  contactPhone: string;
  description?: string;
  logo?: string;
  verificationStatus: VerificationStatusType;
  isVerified: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  responseRate: number;
  productsCount: number;
  createdAt: string;
}

// Sample data
const sampleCompanies: CompanyData[] = [
  {
    id: '1',
    name: 'SARL Technologie Algerienne',
    slug: 'sar-technologie-algerienne',
    legalForm: 'SARL',
    rcNumber: '16B/001234',
    nif: '000016001234567',
    nis: '100012340012345',
    wilaya: 'Alger',
    commune: 'Hussein Dey',
    address: '123 Rue des Entreprises',
    contactEmail: 'contact@technologie-dz.dz',
    contactPhone: '+213 555 123 456',
    description: 'Spécialiste en solutions technologiques',
    verificationStatus: 'PENDING',
    isVerified: false,
    isActive: true,
    rating: 4.8,
    reviewCount: 24,
    responseRate: 95,
    productsCount: 28,
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'EURL Industrie Moderne',
    slug: 'eurl-industrie-moderne',
    legalForm: 'EURL',
    rcNumber: '16B/005678',
    wilaya: 'Blida',
    contactEmail: 'info@industrie-dz.dz',
    contactPhone: '+213 555 987 654',
    verificationStatus: 'VERIFIED',
    isVerified: true,
    isActive: true,
    rating: 4.5,
    reviewCount: 18,
    responseRate: 88,
    productsCount: 42,
    createdAt: '2023-12-20T14:15:00Z',
  },
  {
    id: '3',
    name: 'SPA Distribution Plus',
    slug: 'spa-distribution-plus',
    legalForm: 'SPA',
    rcNumber: '25B/001122',
    wilaya: 'Oran',
    contactEmail: 'contact@distribution-dz.dz',
    contactPhone: '+213 661 234 567',
    verificationStatus: 'PENDING',
    isVerified: false,
    isActive: true,
    rating: 0,
    reviewCount: 0,
    responseRate: 0,
    productsCount: 5,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    name: 'Sarl Agro Solutions',
    slug: 'sarl-agro-solutions',
    legalForm: 'SARL',
    rcNumber: '34B/009988',
    wilaya: 'Setif',
    contactEmail: 'agro@solutions-dz.dz',
    contactPhone: '+213 777 888 999',
    verificationStatus: 'VERIFIED',
    isVerified: true,
    isActive: true,
    rating: 4.2,
    reviewCount: 35,
    responseRate: 92,
    productsCount: 67,
    createdAt: '2023-11-10T09:45:00Z',
  },
  {
    id: '5',
    name: 'EURL Textile Excellence',
    slug: 'eurl-textile-excellence',
    legalForm: 'EURL',
    rcNumber: '13B/007766',
    wilaya: 'Constantine',
    contactEmail: 'textile@excellence-dz.dz',
    contactPhone: '+213 555 444 333',
    verificationStatus: 'REJECTED',
    isVerified: false,
    isActive: false,
    rating: 0,
    reviewCount: 0,
    responseRate: 0,
    productsCount: 0,
    createdAt: '2024-02-05T11:30:00Z',
  },
];

const statusConfig: Record<VerificationStatusType, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string; icon: React.ReactNode }> = {
  PENDING: { 
    label: 'En attente', 
    variant: 'outline', 
    color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    icon: <Clock className="h-3 w-3" />
  },
  VERIFIED: { 
    label: 'Vérifiée', 
    variant: 'default', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  REJECTED: { 
    label: 'Rejetée', 
    variant: 'destructive', 
    color: '',
    icon: <XCircle className="h-3 w-3" />
  },
  SUSPENDED: { 
    label: 'Suspendue', 
    variant: 'secondary', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle className="h-3 w-3" />
  },
};

export default function CompaniesManagementPage() {
  const searchParams = useSearchParams();
  const [companies, setCompanies] = useState<CompanyData[]>(sampleCompanies);
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get('status') || 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [wilayaFilter, setWilayaFilter] = useState('ALL');
  
  // Modal states
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);

  // Apply filters using useMemo
  const filteredCompanies = useMemo(() => {
    let result = [...companies];
    
    // Tab filter (status)
    if (activeTab !== 'all') {
      result = result.filter(c => c.verificationStatus === activeTab.toUpperCase());
    }
    
    // Wilaya filter
    if (wilayaFilter !== 'ALL') {
      result = result.filter(c => c.wilaya === wilayaFilter);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.rcNumber.toLowerCase().includes(query) ||
        c.contactEmail.toLowerCase().includes(query)
      );
    }

    // Sort: pending first
    result.sort((a, b) => {
      if (a.verificationStatus === 'PENDING' && b.verificationStatus !== 'PENDING') return -1;
      if (a.verificationStatus !== 'PENDING' && b.verificationStatus === 'PENDING') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [companies, activeTab, searchQuery, wilayaFilter]);

  // Stats
  const pendingCount = companies.filter(c => c.verificationStatus === 'PENDING').length;
  const verifiedCount = companies.filter(c => c.verificationStatus === 'VERIFIED').length;
  const rejectedCount = companies.filter(c => c.verificationStatus === 'REJECTED').length;

  // Handlers
  const handleVerify = async (companyId: string, notes: string) => {
    console.log('Verifying company:', companyId, notes);
    setCompanies(prev => prev.map(c => 
      c.id === companyId 
        ? { ...c, verificationStatus: 'VERIFIED' as const, isVerified: true }
        : c
    ));
  };

  const handleReject = async (companyId: string, reason: string) => {
    console.log('Rejecting company:', companyId, reason);
    setCompanies(prev => prev.map(c => 
      c.id === companyId 
        ? { ...c, verificationStatus: 'REJECTED' as const, isVerified: false, isActive: false }
        : c
    ));
  };

  const openVerificationModal = (company: CompanyData) => {
    setSelectedCompany(company);
    setVerificationModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const exportToCSV = () => {
    const headers = ['Nom', 'Forme légale', 'RC', 'Wilaya', 'Email', 'Statut', 'Produits', 'Note', 'Date'];
    const csvRows = filteredCompanies.map(c => [
      c.name,
      c.legalForm,
      c.rcNumber,
      c.wilaya,
      c.contactEmail,
      statusConfig[c.verificationStatus].label,
      c.productsCount.toString(),
      c.rating.toString(),
      formatDate(c.createdAt)
    ]);
    
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `entreprises_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Entreprises</h1>
          <p className="text-gray-500 mt-1">Vérifiez et gérez les entreprises inscrites</p>
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" /> Exporter CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{companies.length}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={pendingCount > 0 ? 'border-yellow-300 bg-yellow-50/30' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${pendingCount > 0 ? 'bg-yellow-100 text-yellow-600 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-gray-500">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verifiedCount}</p>
                <p className="text-xs text-gray-500">Vérifiées</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 text-red-600">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectedCount}</p>
                <p className="text-xs text-gray-500">Rejetées</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="all" className="gap-1">
              Toutes ({companies.length})
            </TabsTrigger>
            <TabsTrigger value="PENDING" className="gap-1">
              <AlertTriangle className="h-3.5 w-3.5 hidden sm:inline" /> En attente ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="VERIFIED" className="gap-1">
              <Shield className="h-3.5 w-3.5 hidden sm:inline" /> Vérifiées ({verifiedCount})
            </TabsTrigger>
            <TabsTrigger value="SUSPENDED" className="gap-1">
              Suspendues
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher une entreprise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={wilayaFilter} onValueChange={setWilayaFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-3.5 w-3.5" />
                <SelectValue placeholder="Wilaya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes</SelectItem>
                <SelectItem value="Alger">Alger</SelectItem>
                <SelectItem value="Oran">Oran</SelectItem>
                <SelectItem value="Constantine">Constantine</SelectItem>
                <SelectItem value="Setif">Setif</SelectItem>
                <SelectItem value="Blida">Blida</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Companies Table */}
        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {filteredCompanies.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead>Entreprise</TableHead>
                      <TableHead className="hidden md:table-cell">Forme légale</TableHead>
                      <TableHead className="hidden lg:table-cell">RC Number</TableHead>
                      <TableHead className="hidden xl:table-cell">Wilaya</TableHead>
                      <TableHead className="hidden lg:table-cell">Contact</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden md:table-cell">Produits</TableHead>
                      <TableHead className="hidden lg:table-cell">Note</TableHead>
                      <TableHead>Inscription</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => {
                      const status = statusConfig[company.verificationStatus];
                      
                      return (
                        <TableRow 
                          key={company.id}
                          className={
                            company.verificationStatus === 'PENDING' 
                              ? 'bg-yellow-50/30 hover:bg-yellow-50/50' 
                              : company.verificationStatus === 'REJECTED'
                                ? 'opacity-60'
                                : ''
                          }
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={company.logo} alt={company.name} />
                                <AvatarFallback className="bg-orange-100 text-orange-700 text-sm">
                                  {company.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate max-w-[180px]">
                                  {company.name}
                                </p>
                                {company.verificationStatus === 'PENDING' && (
                                  <Badge variant="outline" className="text-xs mt-0.5 text-yellow-600 border-yellow-300">
                                    Nouvelle
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="text-sm text-gray-600">{company.legalForm}</span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {company.rcNumber}
                            </code>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            <span className="text-sm text-gray-600">{company.wilaya}</span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="space-y-0.5">
                              <p className="text-xs text-gray-900 truncate max-w-[150px]">{company.contactEmail}</p>
                              <p className="text-xs text-gray-500">{company.contactPhone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={status.variant}
                              className={`gap-1 ${status.color}`}
                            >
                              {status.icon}
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1 text-sm">
                              <Package className="h-3.5 w-3.5 text-gray-400" />
                              {company.productsCount}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {company.rating > 0 ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{company.rating}</span>
                                <span className="text-xs text-gray-400">({company.reviewCount})</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {formatDate(company.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem className="cursor-pointer">
                                  <Eye className="mr-2 h-4 w-4" /> Voir le profil
                                </DropdownMenuItem>
                                
                                {company.verificationStatus === 'PENDING' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="cursor-pointer text-green-600 focus:text-green-600"
                                      onClick={() => openVerificationModal(company)}
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" /> Vérifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="cursor-pointer text-red-600 focus:text-red-600"
                                      onClick={() => openVerificationModal(company)}
                                    >
                                      <XCircle className="mr-2 h-4 w-4" /> Rejeter
                                    </DropdownMenuItem>
                                  </>
                                )}
                                
                                {(company.verificationStatus === 'VERIFIED' || company.verificationStatus === 'REJECTED') && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="cursor-pointer text-blue-600 focus:text-blue-600">
                                      <CheckCircle2 className="mr-2 h-4 w-4" /> Re-vérifier
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-900 mb-1">Aucune entreprise trouvée</h3>
                  <p className="text-sm text-gray-500">Essayez de modifier vos filtres</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Verification Modal */}
      <VerificationModal
        open={verificationModalOpen}
        onOpenChange={setVerificationModalOpen}
        company={selectedCompany}
        onVerify={handleVerify}
        onReject={handleReject}
      />
    </div>
  );
}
