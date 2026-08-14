'use client';

/**
 * TenantShowcase Component
 * Displays a tenant card for the marketplace
 */

import React from 'react';
import Link from 'next/link';
import { 
  Globe, 
  Users, 
  Building2, 
  ExternalLink,
  MapPin,
  Languages,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface PublicTenant {
  id: string;
  slug: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  countryName: string;
  countryCode: string;
  defaultLanguage: string;
  currency: string;
  currencySymbol: string;
  createdAt: string;
  _count?: {
    users: number;
    companies: number;
  };
}

interface TenantShowcaseProps {
  tenant: PublicTenant;
}

// Country flag emojis mapping
const countryFlags: Record<string, string> = {
  DZ: '🇩🇿',
  TN: '🇹🇳',
  MA: '🇲🇦',
  EG: '🇪🇬',
};

// Language names mapping
const languageNames: Record<string, string> = {
  fr: 'Français',
  ar: 'العربية',
  en: 'English',
};

export function TenantShowcase({ tenant }: TenantShowcaseProps) {
  const flag = countryFlags[tenant.countryCode] || '🌐';
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Color accent bar at top */}
      <div 
        className="h-1.5 w-full"
        style={{ backgroundColor: tenant.primaryColor }}
      />
      
      <CardContent className="pt-6">
        {/* Header with logo and name */}
        <div className="flex items-start gap-4 mb-4">
          {/* Logo or initial */}
          <div 
            className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-md flex-shrink-0"
            style={{ backgroundColor: tenant.primaryColor }}
          >
            {tenant.logoUrl ? (
              <img 
                src={tenant.logoUrl} 
                alt={tenant.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              tenant.name.charAt(0).toUpperCase()
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary transition-colors truncate">
              {tenant.name}
            </h3>
            
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <span className="text-lg">{flag}</span>
              <span>{tenant.countryName}</span>
              <span>•</span>
              <Languages className="h-4 w-4" />
              <span>{languageNames[tenant.defaultLanguage] || tenant.defaultLanguage}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 py-3 border-y border-gray-100">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              <strong>{tenant._count?.companies || 0}</strong> entreprises
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              <strong>{tenant._count?.users || 0}</strong> utilisateurs
            </span>
          </div>
        </div>

        {/* Features badges (simplified) */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <Badge variant="secondary" className="text-xs">
            {tenant.currencySymbol}
          </Badge>
          <Badge variant="outline" className="text-xs">
            B2B
          </Badge>
          <Badge variant="outline" className="text-xs">
            Vérifié ✓
          </Badge>
        </div>

        {/* CTA */}
        <Link href={`/?tenant=${tenant.slug}`} className="block">
          <Button 
            className="w-full group-hover:brightness-110 transition-all"
            style={{ 
              backgroundColor: tenant.primaryColor,
            }}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Visiter la plateforme
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

/**
 * Featured Tenant Showcase - Larger card for featured tenants
 */
interface FeaturedTenantShowcaseProps {
  tenant: PublicTenant;
}

export function FeaturedTenantShowcase({ tenant }: FeaturedTenantShowcaseProps) {
  const flag = countryFlags[tenant.countryCode] || '🌐';
  
  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300">
      {/* Gradient header */}
      <div 
        className="px-6 py-8 text-white relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.secondaryColor})` 
        }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {tenant.logoUrl ? (
              <img 
                src={tenant.logoUrl} 
                alt={tenant.name}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              tenant.name.charAt(0).toUpperCase()
            )}
          </div>
          
          <div>
            <h2 className="text-2xl font-bold">{tenant.name}</h2>
            <div className="flex items-center gap-3 mt-2 text-white/80">
              <span className="text-2xl">{flag}</span>
              <span>{tenant.countryName}</span>
              <MapPin className="h-4 w-4" />
              <span>{tenant.currencySymbol}</span>
            </div>
          </div>
          
          <CheckCircle2 className="ml-auto h-8 w-8 text-white/60" />
        </div>
      </div>

      <CardContent className="p-6">
        <p className="text-gray-600 mb-4">
          Plateforme B2B dédiée au marché {tenant.countryName}. Connectez-vous avec des fournisseurs 
          vérifiés et découvrez des opportunités commerciales uniques.
        </p>

        <div className="flex items-center gap-6 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span><strong>{tenant._count?.companies || 0}</strong> entreprises</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span><strong>{tenant._count?.users || 0}</strong> membres</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <span>{languageNames[tenant.defaultLanguage] || tenant.defaultLanguage}</span>
          </div>
        </div>

        <Link href={`/?tenant=${tenant.slug}`} className="block">
          <Button 
            size="lg" 
            className="w-full shadow-lg hover:shadow-xl transition-shadow"
            style={{ backgroundColor: tenant.primaryColor }}
          >
            Explorer {tenant.name}
            <ExternalLink className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default TenantShowcase;
