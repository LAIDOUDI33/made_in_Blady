'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { requireRole } from '@/lib/auth-utils';
import { UserRole } from '@prisma/client';
import { UserTable, UserBulkActions, UserData, UserRoleType } from '@/components/admin/UserTable';
import { StatsCard } from '@/components/admin/StatsCard';
import { ConfirmDialog, SuspendUserDialog } from '@/components/admin/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  Building2,
  Shield,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

// Sample user data (in production, this comes from API)
const sampleUsers: UserData[] = [
  {
    id: '1',
    firstName: 'Karim',
    lastName: 'Meziani',
    email: 'karim.meziani@example.com',
    phone: '+213 555 123 456',
    role: 'SUPPLIER',
    status: 'ACTIVE',
    companyName: 'SARL Technologie Algerienne',
    wilaya: 'Alger',
    createdAt: '2024-01-15T10:30:00Z',
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    firstName: 'Fatima',
    lastName: 'Zahra',
    email: 'fatima.zahra@example.com',
    role: 'BUYER',
    status: 'ACTIVE',
    wilaya: 'Oran',
    createdAt: '2024-02-20T14:45:00Z',
    lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    firstName: 'Ahmed',
    lastName: 'Benali',
    email: 'ahmed.benali@example.com',
    phone: '+213 661 987 654',
    role: 'BUYER',
    status: 'ACTIVE',
    wilaya: 'Constantine',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    firstName: 'Samira',
    lastName: 'Khelifi',
    email: 'samira.khelifi@example.com',
    role: 'SUPPLIER',
    status: 'ACTIVE',
    companyName: 'EURL Industrie Moderne',
    wilaya: 'Blida',
    createdAt: '2024-03-10T09:15:00Z',
    lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    firstName: 'Omar',
    lastName: 'Boudjema',
    email: 'omar.boudjema@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    wilaya: 'Alger',
    createdAt: '2023-12-01T08:00:00Z',
    lastLogin: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    firstName: 'Leila',
    lastName: 'Haddad',
    email: 'leila.haddad@example.com',
    role: 'BUYER',
    status: 'SUSPENDED',
    wilaya: 'Tlemcen',
    createdAt: '2024-04-05T16:20:00Z',
    lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    firstName: 'Youssef',
    lastName: 'Ammar',
    email: 'youssef.ammar@example.com',
    phone: '+213 777 333 222',
    role: 'SUPPLIER',
    status: 'ACTIVE',
    companyName: 'Sarl Distribution Plus',
    wilaya: 'Setif',
    createdAt: '2024-05-12T11:00:00Z',
    lastLogin: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '8',
    firstName: 'Nadia',
    lastName: 'Bouazza',
    email: 'nadia.bouazza@example.com',
    role: 'MODERATOR',
    status: 'ACTIVE',
    wilaya: 'Annaba',
    createdAt: '2024-06-18T13:30:00Z',
    lastLogin: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

// Wilayas list (sample)
const algerianWilayas = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
  'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger',
  'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma',
  'Constantine', 'Médéa', 'Mostaganem', "M'Sila", 'Mascara', 'Ouargla', 'Oran', 'El Bayadh'
];

export default function UsersManagementPage() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserData[]>(sampleUsers);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter states
  const [roleFilter, setRoleFilter] = useState<string>(searchParams.get('role') || 'ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [wilayaFilter, setWilayaFilter] = useState<string>('ALL');
  
  // Dialog states
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState<UserData | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Apply filters using useMemo
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Role filter
    if (roleFilter !== 'ALL') {
      result = result.filter(u => u.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(u => u.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.firstName.toLowerCase().includes(query) ||
        u.lastName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    // Wilaya filter
    if (wilayaFilter !== 'ALL') {
      result = result.filter(u => u.wilaya === wilayaFilter);
    }

    return result;
  }, [users, roleFilter, statusFilter, searchQuery, wilayaFilter]);

  // Calculate stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
  const supplierCount = users.filter(u => u.role === 'SUPPLIER').length;
  const buyerCount = users.filter(u => u.role === 'BUYER').length;

  // Handlers
  const handleUserView = useCallback((userId: string) => {
    window.location.href = `/admin/users/${userId}`;
  }, []);

  const handleUserEdit = useCallback(async (userId: string, newRole: UserRoleType) => {
    setIsActionLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    ));
    setIsActionLoading(false);
  }, []);

  const handleSuspendClick = useCallback((userId: string) => {
    const user = users.find(u => u.id === userId);
    setSelectedUserForAction(user || null);
    setSuspendDialogOpen(true);
  }, [users]);

  const handleUserSuspend = useCallback(async () => {
    if (!selectedUserForAction) return;
    
    setIsActionLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setUsers(prev => prev.map(u => 
      u.id === selectedUserForAction.id ? { ...u, status: 'SUSPENDED' as const } : u
    ));
    setIsActionLoading(false);
    setSuspendDialogOpen(false);
    setSelectedUserForAction(null);
  }, [selectedUserForAction]);

  const handleUserActivate = useCallback(async (userId: string) => {
    setIsActionLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, status: 'ACTIVE' as const } : u
    ));
    setIsActionLoading(false);
  }, []);

  const handleUserMessage = useCallback((userId: string) => {
    alert(`Fonctionnalité de message pour l'utilisateur ${userId}`);
  }, []);

  const handleUserLoginAs = useCallback((userId: string) => {
    alert(`Connexion en tant que l'utilisateur ${userId} - Fonction Super Admin`);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Prénom', 'Nom', 'Email', 'Rôle', 'Statut', 'Entreprise', 'Wilaya', 'Date inscription'];
    const csvRows = filteredUsers.map(u => [
      u.firstName,
      u.lastName,
      u.email,
      u.role,
      u.status,
      u.companyName || '',
      u.wilaya || '',
      new Date(u.createdAt).toLocaleDateString('fr-FR')
    ]);
    
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <p className="text-gray-500 mt-1">Gérez tous les utilisateurs de la plateforme</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Exporter CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total utilisateurs"
          value={totalUsers}
          icon={Users}
          iconClassName="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Utilisateurs actifs"
          value={activeUsers}
          description={`${totalUsers - activeUsers} suspendus`}
          icon={Shield}
          iconClassName="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Acheteurs"
          value={buyerCount}
          icon={UserPlus}
          iconClassName="bg-purple-100 text-purple-600"
        />
        <StatsCard
          title="Fournisseurs"
          value={supplierCount}
          icon={Building2}
          iconClassName="bg-orange-100 text-orange-600"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Label htmlFor="search" className="sr-only">Rechercher</Label>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Role filter */}
            <div>
              <Label>Rôle</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les rôles</SelectItem>
                  <SelectItem value="BUYER">Acheteurs</SelectItem>
                  <SelectItem value="SUPPLIER">Fournisseurs</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                  <SelectItem value="MODERATOR">Modérateurs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status filter */}
            <div>
              <Label>Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous</SelectItem>
                  <SelectItem value="ACTIVE">Actif</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Wilaya filter */}
            <div>
              <Label>Wilaya</Label>
              <Select value={wilayaFilter} onValueChange={setWilayaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les wilayas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes les wilayas</SelectItem>
                  {algerianWilayas.map(wilaya => (
                    <SelectItem key={wilaya} value={wilaya}>{wilaya}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <UserBulkActions
        selectedCount={selectedUsers.length}
        onBulkSuspend={() => alert('Suspension en masse')}
        onBulkActivate={() => alert('Activation en masse')}
        onBulkChangeRole={(role) => alert(`Changement de rôle en masse: ${role}`)}
        onExportSelected={handleExportCSV}
        onClearSelection={() => setSelectedUsers([])}
      />

      {/* Users Table */}
      <UserTable
        users={filteredUsers}
        selectedUsers={selectedUsers}
        onSelectUsers={setSelectedUsers}
        onUserView={handleUserView}
        onUserEdit={handleUserEdit}
        onUserSuspend={handleSuspendClick}
        onUserActivate={handleUserActivate}
        onUserMessage={handleUserMessage}
        onUserLoginAs={handleUserLoginAs}
        isLoading={isLoading}
      />

      {/* Pagination info */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Affichage de {filteredUsers.length} sur {totalUsers} utilisateurs</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>Précédent</Button>
          <Badge variant="secondary">Page 1 sur 1</Badge>
          <Button variant="outline" size="sm" disabled>Suivant</Button>
        </div>
      </div>

      {/* Suspend Dialog */}
      <SuspendUserDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        userName={selectedUserForAction ? `${selectedUserForAction.firstName} ${selectedUserForAction.lastName}` : ''}
        onConfirm={handleUserSuspend}
        isLoading={isActionLoading}
      />
    </div>
  );
}
