"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTranslation, useLanguage } from "@/lib/i18n";
import { CompactLanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Menu,
  Search,
  User,
  Building2,
  FileText,
  MessageSquare,
  Heart,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  Package,
  Factory,
  Handshake,
} from "lucide-react";

const categories = [
  { name: "Agriculture & Food", href: "/categories/agriculture-food", icon: "🌾", key: "categories.agriculture" },
  { name: "Construction", href: "/categories/construction", icon: "🏗️", key: "categories.construction" },
  { name: "Industrial Equipment", href: "/categories/industrial-equipment", icon: "⚙️", key: "categories.industrial" },
  { name: "Energy & Solar", href: "/categories/energy-solar", icon: "☀️", key: "categories.energy" },
  { name: "ICT & Telecom", href: "/categories/ict-telecom", icon: "💻", key: "categories.ict" },
  { name: "Automotive", href: "/categories/automotive", icon: "🚗", key: "categories.automobile" },
  { name: "Textiles", href: "/categories/textiles", icon: "👕", key: "categories.textiles" },
  { name: "Chemicals", href: "/categories/chemicals", icon: "🧪", key: "categories.chemicals" },
  { name: "Health & Medical", href: "/categories/health-medical", icon: "🏥", key: "categories.health" },
  { name: "Furniture", href: "/categories/furniture", icon: "🪑", key: "categories.furniture" },
  { name: "Packaging", href: "/categories/packaging", icon: "📦", key: "categories.packaging" },
  { name: "Logistics", href: "/categories/logistics", icon: "🚚", key: "categories.logistics" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { t, isRTL } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Bar */}
      <div className="border-b bg-primary text-primary-foreground">
        <div className={`container mx-auto flex h-10 items-center justify-between px-4 text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center gap-4">
            <span className="hidden md:flex items-center gap-1">
              <Package className="h-4 w-4" />
              {t('common.platform') || 'La plateforme B2B de l\'Algérie'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <CompactLanguageSwitcher />
            <span className="hidden sm:inline">|</span>
            <Link href="/suppliers" className="hidden sm:inline hover:underline">
              {t('footer.becomeSupplier') || 'Devenir Fournisseur'}
            </Link>
            <Link href="/help" className="hidden md:inline hover:underline">
              {t('nav.help') || 'Aide'}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className={`flex h-16 items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-600 to-green-700 text-white font-bold text-xl">
              AT
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-foreground">
                Algeria<span className="text-green-600">Trade</span>
              </h1>
              <p className="text-[10px] text-muted-foreground -mt-1">B2B Marketplace</p>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-4">
            <div className="relative w-full">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
              <input
                type="text"
                placeholder={t('nav.searchProducts') || 'Rechercher produits, fournisseurs, services...'}
                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-green-500`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <Button size="sm" className={`absolute ${isRTL ? 'left-1' : 'right-1'} top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700`}>
                {t('common.search') || 'Rechercher'}
              </Button>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge className={`absolute ${isRTL ? '-left-1' : '-right-1'} h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-[10px]`}>
                    3
                  </Badge>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                          JD
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline text-sm">John Doe</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="gap-2">
                        <User className="h-4 w-4" />
                        {t('nav.dashboard') || 'Mon Tableau de Bord'}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="gap-2">
                        <Building2 className="h-4 w-4" />
                        {t('nav.profile') || 'Mon Entreprise'}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/rfqs" className="gap-2">
                        <FileText className="h-4 w-4" />
                        {t('nav.rfq') || 'Mes Appels d\'Offre'}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/messages" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        {t('nav.messages') || 'Messages'}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/favorites" className="gap-2">
                        <Heart className="h-4 w-4" />
                        {t('nav.favorites') || 'Favoris'}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="gap-2">
                        <Settings className="h-4 w-4" />
                        {t('nav.settings') || 'Paramètres'}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsLoggedIn(false)} className="gap-2 text-red-600">
                      <LogOut className="h-4 w-4" />
                      {t('common.logout') || 'Déconnexion'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">{t('auth.loginBtn') || 'Connexion'}</Link>
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" asChild>
                  <Link href="/register">{t('auth.registerBtn') || 'Inscription Gratuite'}</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Categories Navigation */}
        <nav className={`hidden lg:flex items-center gap-6 py-2 border-t overflow-x-auto ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Link
            href="/products"
            className="flex items-center gap-1 text-sm font-medium whitespace-nowrap hover:text-green-600 transition-colors"
          >
            <Package className="h-4 w-4" />
            {t('nav.products') || 'Produits'}
          </Link>
          <Link
            href="/suppliers"
            className="flex items-center gap-1 text-sm font-medium whitespace-nowrap hover:text-green-600 transition-colors"
          >
            <Factory className="h-4 w-4" />
            {t('nav.suppliers') || 'Fournisseurs'}
          </Link>
          <Link
            href="/rfqs"
            className="flex items-center gap-1 text-sm font-medium whitespace-nowrap hover:text-green-600 transition-colors"
          >
            <Handshake className="h-4 w-4" />
            {t('nav.rfq') || 'Appels d\'Offre'}
          </Link>
          <div className="h-4 w-px bg-border" />
          {categories.slice(0, 7).map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="text-sm text-muted-foreground whitespace-nowrap hover:text-green-600 transition-colors"
            >
              {cat.icon} {cat.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t bg-background p-4 space-y-4">
          {/* Mobile Search */}
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
            <input
              type="text"
              placeholder={t('common.search') || 'Rechercher...'}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border rounded-lg bg-background`}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Mobile Nav Links */}
          <nav className="space-y-2">
            <Link href="/products" className="block py-2 px-3 rounded hover:bg-accent">
              📦 {t('products.allProducts') || 'Tous les Produits'}
            </Link>
            <Link href="/suppliers" className="block py-2 px-3 rounded hover:bg-accent">
              🏭 {t('suppliers.verifiedSuppliers') || 'Fournisseurs Vérifiés'}
            </Link>
            <Link href="/rfqs" className="block py-2 px-3 rounded hover:bg-accent">
              🤝 {t('nav.rfq') || 'Appels d\'Offre'}
            </Link>
            <div className="border-t pt-2 mt-2">
              <p className={`px-3 text-xs text-muted-foreground uppercase tracking-wider mb-2 ${isRTL ? 'text-right' : ''}`}>
                {t('nav.categories') || 'Catégories'}
              </p>
              <div className="grid grid-cols-2 gap-1">
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    className="py-2 px-3 rounded hover:bg-accent text-sm"
                  >
                    {cat.icon} {cat.name.split(" ")[0]}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
