'use client';

import React from 'react';
import { Bell, Globe, User, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface DashboardHeaderProps {
  title?: string;
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  // Mock user data - in real app, this would come from auth context
  const user = {
    name: 'Ahmed Benali',
    email: 'ahmed@company.dz',
    avatar: null,
    role: 'Fournisseur',
    notifications: 3,
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 sm:px-6">
      {/* Spacer for mobile menu button */}
      <div className="w-10 lg:hidden" />
      
      {/* Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      {/* Page Title (Mobile) */}
      {title && (
        <h1 className="text-lg font-semibold text-gray-900 md:hidden">{title}</h1>
      )}

      <div className="flex items-center gap-3 ml-auto">
        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-gray-900">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">FR</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem className="cursor-pointer">
              🇫🇷 Français
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              🇬🇧 English
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              🇩🇿 العربية
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-gray-900">
              <Bell className="h-5 w-5" />
              {user.notifications > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-red-500"
                >
                  {user.notifications}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              <Badge variant="secondary">{user.notifications} nouvelles</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Notification Items */}
            <div className="max-h-[300px] overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <div className="flex items-center gap-2 w-full">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">📋</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Nouvel appel d'offres</p>
                    <p className="text-xs text-gray-500">Demande de 500 unités de ciment</p>
                    <p className="text-xs text-gray-400 mt-1">Il y a 5 min</p>
                  </div>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <div className="flex items-center gap-2 w-full">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">✓</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Devis accepté</p>
                    <p className="text-xs text-gray-500">Votre devis #QT-2024-001 a été accepté</p>
                    <p className="text-xs text-gray-400 mt-1">Il y a 1 heure</p>
                  </div>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                <div className="flex items-center gap-2 w-full">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">📦</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Nouvelle commande</p>
                    <p className="text-xs text-gray-500">Commande #ORD-2024-045 reçue</p>
                    <p className="text-xs text-gray-400 mt-1">Il y a 3 heures</p>
                  </div>
                </div>
              </DropdownMenuItem>
            </div>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center cursor-pointer text-green-600 font-medium">
              Voir toutes les notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
                <span className="text-xs text-gray-500">{user.role}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              Entreprise
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
