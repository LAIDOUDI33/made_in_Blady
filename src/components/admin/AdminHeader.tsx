'use client';

import React from 'react';
import { 
  Search, 
  Bell, 
  Menu, 
  User, 
  LogOut, 
  Settings,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface AdminHeaderProps {
  title?: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left side - Mobile menu + Search */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button - handled by sidebar */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => {
              // Dispatch custom event for sidebar toggle
              window.dispatchEvent(new CustomEvent('toggle-admin-sidebar'));
            }}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Global search */}
          <div className="hidden sm:flex items-center relative">
            <Search className="absolute left-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher utilisateurs, produits, commandes..."
              className="w-80 pl-10 bg-gray-50 border-gray-200 focus:bg-white"
            />
            <kbd className="absolute right-3 hidden md:inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right side - Notifications + User menu */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  5
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <Button variant="ghost" size="sm" className="text-xs text-green-600 hover:text-green-700">
                  Tout marquer comme lu
                </Button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-medium text-sm">Nouvelle entreprise à vérifier</span>
                    <span className="ml-auto text-xs text-gray-400">Il y a 5 min</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-4">
                    SARL Technologie Algerienne a soumis une demande de vérification
                  </p>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="font-medium text-sm">Produit signalé</span>
                    <span className="ml-auto text-xs text-gray-400">Il y a 30 min</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-4">
                    Le produit &quot;Composants électroniques&quot; a été signalé pour contenu suspect
                  </p>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-medium text-sm">Nouvel utilisateur inscrit</span>
                    <span className="ml-auto text-xs text-gray-400">Il y a 1 heure</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-4">
                    Ahmed Benali a créé un compte acheteur
                  </p>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer opacity-60">
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="font-medium text-sm">Commande #12345 confirmée</span>
                    <span className="ml-auto text-xs text-gray-400">Il y a 3 heures</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-4">
                    Une commande de 250 000 DZD a été confirmée
                  </p>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-green-600 font-medium cursor-pointer">
                Voir toutes les notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="Admin" />
                  <AvatarFallback className="bg-green-600 text-white text-sm">
                    AD
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">Admin</span>
                  <span className="text-xs text-gray-500">Super Admin</span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profil administrateur
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
