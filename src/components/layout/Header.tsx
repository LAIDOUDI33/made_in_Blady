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
import {
  Menu,
  Search,
  Globe,
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
  { name: "Agriculture & Food", href: "/categories/agriculture-food", icon: "🌾" },
  { name: "Construction", href: "/categories/construction", icon: "🏗️" },
  { name: "Industrial Equipment", href: "/categories/industrial-equipment", icon: "⚙️" },
  { name: "Energy & Solar", href: "/categories/energy-solar", icon: "☀️" },
  { name: "ICT & Telecom", href: "/categories/ict-telecom", icon: "💻" },
  { name: "Automotive", href: "/categories/automotive", icon: "🚗" },
  { name: "Textiles", href: "/categories/textiles", icon: "👕" },
  { name: "Chemicals", href: "/categories/chemicals", icon: "🧪" },
  { name: "Health & Medical", href: "/categories/health-medical", icon: "🏥" },
  { name: "Furniture", href: "/categories/furniture", icon: "🪑" },
  { name: "Packaging", href: "/categories/packaging", icon: "📦" },
  { name: "Logistics", href: "/categories/logistics", icon: "🚚" },
];

const languages = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇩🇿" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("fr");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Bar */}
      <div className="border-b bg-primary text-primary-foreground">
        <div className="container mx-auto flex h-10 items-center justify-between px-4 text-sm">
          <div className="flex items-center gap-4">
            <span className="hidden md:flex items-center gap-1">
              <Package className="h-4 w-4" />
              La plateforme B2B de l&apos;Algérie
            </span>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/20 gap-1">
                  <Globe className="h-4 w-4" />
                  {languages.find(l => l.code === currentLang)?.flag}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setCurrentLang(lang.code)}
                    className="gap-2"
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="hidden sm:inline">|</span>
            <Link href="/suppliers" className="hidden sm:inline hover:underline">
              Devenir Fournisseur
            </Link>
            <Link href="/help" className="hidden md:inline hover:underline">
              Aide
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher produits, fournisseurs, services..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Button size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700">
                Rechercher
              </Button>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-[10px]">
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
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="gap-2">
                        <User className="h-4 w-4" />
                        Mon Tableau de Bord
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="gap-2">
                        <Building2 className="h-4 w-4" />
                        Mon Entreprise
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/rfqs" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Mes Appels d&apos;Offre
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/messages" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Messages
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/favorites" className="gap-2">
                        <Heart className="h-4 w-4" />
                        Favoris
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Paramètres
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsLoggedIn(false)} className="gap-2 text-red-600">
                      <LogOut className="h-4 w-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" asChild>
                  <Link href="/register">Inscription Gratuite</Link>
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
        <nav className="hidden lg:flex items-center gap-6 py-2 border-t overflow-x-auto">
          <Link
            href="/products"
            className="flex items-center gap-1 text-sm font-medium whitespace-nowrap hover:text-green-600 transition-colors"
          >
            <Package className="h-4 w-4" />
            Produits
          </Link>
          <Link
            href="/suppliers"
            className="flex items-center gap-1 text-sm font-medium whitespace-nowrap hover:text-green-600 transition-colors"
          >
            <Factory className="h-4 w-4" />
            Fournisseurs
          </Link>
          <Link
            href="/rfqs"
            className="flex items-center gap-1 text-sm font-medium whitespace-nowrap hover:text-green-600 transition-colors"
          >
            <Handshake className="h-4 w-4" />
            Appels d&apos;Offre
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
            />
          </div>

          {/* Mobile Nav Links */}
          <nav className="space-y-2">
            <Link href="/products" className="block py-2 px-3 rounded hover:bg-accent">
              📦 Tous les Produits
            </Link>
            <Link href="/suppliers" className="block py-2 px-3 rounded hover:bg-accent">
              🏭 Fournisseurs Vérifiés
            </Link>
            <Link href="/rfqs" className="block py-2 px-3 rounded hover:bg-accent">
              🤝 Appels d&apos;Offre
            </Link>
            <div className="border-t pt-2 mt-2">
              <p className="px-3 text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Catégories
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
