'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Ban,
  CheckCircle,
  MessageSquare,
  LogIn,
  Download,
  Shield,
  User,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type UserRoleType = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'BUYER' | 'SUPPLIER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRoleType;
  status: UserStatus;
  avatar?: string;
  companyName?: string;
  wilaya?: string;
  createdAt: string;
  lastLogin?: string;
}

interface UserTableProps {
  users: UserData[];
  onUserView?: (userId: string) => void;
  onUserEdit?: (userId: string, newRole: UserRoleType) => void;
  onUserSuspend?: (userId: string) => void;
  onUserActivate?: (userId: string) => void;
  onUserMessage?: (userId: string) => void;
  onUserLoginAs?: (userId: string) => void;
  selectedUsers?: string[];
  onSelectUsers?: (userIds: string[]) => void;
  isLoading?: boolean;
}

const roleConfig: Record<UserRoleType, { label: string; color: string; icon: React.ReactNode }> = {
  SUPER_ADMIN: { 
    label: 'Super Admin', 
    color: 'bg-purple-100 text-purple-800',
    icon: <Shield className="h-3 w-3" />
  },
  ADMIN: { 
    label: 'Admin', 
    color: 'bg-blue-100 text-blue-800',
    icon: <Shield className="h-3 w-3" />
  },
  MODERATOR: { 
    label: 'Modérateur', 
    color: 'bg-indigo-100 text-indigo-800',
    icon: <Shield className="h-3 w-3" />
  },
  BUYER: { 
    label: 'Acheteur', 
    color: 'bg-green-100 text-green-800',
    icon: <User className="h-3 w-3" />
  },
  SUPPLIER: { 
    label: 'Fournisseur', 
    color: 'bg-orange-100 text-orange-800',
    icon: <Building2 className="h-3 w-3" />
  },
};

const statusConfig: Record<UserStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; dotColor: string }> = {
  ACTIVE: { 
    label: 'Actif', 
    variant: 'default',
    dotColor: 'bg-green-500'
  },
  SUSPENDED: { 
    label: 'Suspendu', 
    variant: 'destructive',
    dotColor: 'bg-red-500'
  },
};

export function UserTable({
  users,
  onUserView,
  onUserEdit,
  onUserSuspend,
  onUserActivate,
  onUserMessage,
  onUserLoginAs,
  selectedUsers = [],
  onSelectUsers,
  isLoading = false,
}: UserTableProps) {
  
  const handleSelectAll = (checked: boolean) => {
    if (onSelectUsers) {
      onSelectUsers(checked ? users.map(u => u.id) : []);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (onSelectUsers) {
      const newSelected = checked
        ? [...selectedUsers, userId]
        : selectedUsers.filter(id => id !== userId);
      onSelectUsers(newSelected);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return formatDate(dateString);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun utilisateur trouvé</h3>
        <p className="text-gray-500">Essayez de modifier vos filtres de recherche</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead className="w-12">
              <Checkbox
                checked={selectedUsers.length === users.length && users.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label="Tout sélectionner"
              />
            </TableHead>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead className="hidden md:table-cell">Entreprise</TableHead>
            <TableHead className="hidden lg:table-cell">Wilaya</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="hidden xl:table-cell">Inscrit le</TableHead>
            <TableHead className="hidden xl:table-cell">Dernière connexion</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const role = roleConfig[user.role];
            const status = statusConfig[user.status];
            
            return (
              <TableRow 
                key={user.id} 
                className={cn(
                  "group",
                  user.status === 'SUSPENDED' && "opacity-60 bg-red-50/30"
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                    aria-label={`Sélectionner ${user.firstName} ${user.lastName}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                        {user.firstName[0]}{user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={cn("gap-1", role.color)}>
                    {role.icon}
                    {role.label}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-gray-600">
                    {user.companyName || '-'}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="text-sm text-gray-600">
                    {user.wilaya || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={status.variant} 
                    className="gap-1.5"
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", status.dotColor)} />
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <span className="text-sm text-gray-600">
                    {formatDate(user.createdAt)}
                  </span>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <span className="text-sm text-gray-600">
                    {formatLastLogin(user.lastLogin)}
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
                      {onUserView && (
                        <DropdownMenuItem onClick={() => onUserView(user.id)} className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          Voir le profil
                        </DropdownMenuItem>
                      )}
                      {onUserEdit && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onUserEdit(user.id, 'BUYER')} className="cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" />
                            Rendre Acheteur
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUserEdit(user.id, 'SUPPLIER')} className="cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" />
                            Rendre Fournisseur
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      {user.status === 'ACTIVE' && onUserSuspend && (
                        <DropdownMenuItem 
                          onClick={() => onUserSuspend(user.id)} 
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Suspendre
                        </DropdownMenuItem>
                      )}
                      {user.status === 'SUSPENDED' && onUserActivate && (
                        <DropdownMenuItem 
                          onClick={() => onUserActivate(user.id)} 
                          className="cursor-pointer text-green-600 focus:text-green-600"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Activer
                        </DropdownMenuItem>
                      )}
                      {onUserMessage && (
                        <DropdownMenuItem onClick={() => onUserMessage(user.id)} className="cursor-pointer">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Envoyer un message
                        </DropdownMenuItem>
                      )}
                      {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && onUserLoginAs && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onUserLoginAs(user.id)} 
                            className="cursor-pointer text-blue-600 focus:text-blue-600"
                          >
                            <LogIn className="mr-2 h-4 w-4" />
                            Connexion en tant que
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
    </div>
  );
}

// Bulk actions component
export function UserBulkActions({
  selectedCount,
  onBulkSuspend,
  onBulkActivate,
  onBulkChangeRole,
  onExportSelected,
  onClearSelection,
}: {
  selectedCount: number;
  onBulkSuspend?: () => void;
  onBulkActivate?: () => void;
  onBulkChangeRole?: (role: UserRoleType) => void;
  onExportSelected?: () => void;
  onClearSelection?: () => void;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
      <span className="text-sm font-medium text-green-800">
        {selectedCount} utilisateur(s) sélectionné(s)
      </span>
      <div className="flex items-center gap-2 ml-auto">
        {onBulkActivate && (
          <Button size="sm" variant="outline" onClick={onBulkActivate}>
            <CheckCircle className="mr-1 h-3 w-3" /> Activer
          </Button>
        )}
        {onBulkSuspend && (
          <Button size="sm" variant="outline" onClick={onBulkSuspend} className="text-red-600 hover:bg-red-50">
            <Ban className="mr-1 h-3 w-3" /> Suspendre
          </Button>
        )}
        {onBulkChangeRole && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                Changer le rôle
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onBulkChangeRole('BUYER')} className="cursor-pointer">
                Rendre Acheteur
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkChangeRole('SUPPLIER')} className="cursor-pointer">
                Rendre Fournisseur
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {onExportSelected && (
          <Button size="sm" variant="outline" onClick={onExportSelected}>
            <Download className="mr-1 h-3 w-3" /> Exporter CSV
          </Button>
        )}
        {onClearSelection && (
          <Button size="sm" variant="ghost" onClick={onClearSelection}>
            Effacer
          </Button>
        )}
      </div>
    </div>
  );
}
