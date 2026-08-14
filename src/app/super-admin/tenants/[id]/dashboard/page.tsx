'use client';

/**
 * Super Admin - Tenant Dashboard Page
 * Overview and statistics for a specific tenant
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Users, 
  Building2, 
  Package, 
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  Settings,
  Edit,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TenantStats {
  userCount: number;
  companyCount: number;
  productCount: number;
  rfqCount: number;
}

interface Tenant {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  primaryColor: string;
  secondaryColor: string;
  countryName: string;
  countryCode: string;
  defaultLanguage: string;
  currency: string;
  currencySymbol: string;
  isActive: boolean;
  isPublic: boolean;
  planType: string;
  createdAt: string;
  subscriptionEnd: string | null;
}

// Mock chart data (in real app, would come from API)
const monthlyData = [
  { month: 'Jan', users: 45, companies: 12, products: 89 },
  { month: 'Fév', users: 62, companies: 18, products: 134 },
  { month: 'Mar', users: 78, companies: 24, products: 178 },
  { month: 'Avr', users: 95, companies: 31, products: 234 },
  { month: 'Mai', users: 112, companies: 38, products: 289 },
  { month: 'Jun', users: 128, companies: 45, products: 345 },
];

export default function TenantDashboardPage() {
  const params = useParams();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stats, setStats] = useState<TenantStats>({
    userCount: 0,
    companyCount: 0,
    productCount: 0,
    rfqCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenantData();
  }, [tenantId]);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/super-admin/tenants/${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setTenant(data);
        
        // In real app, fetch actual stats
        setStats({
          userCount: Math.floor(Math.random() * 500) + 50,
          companyCount: Math.floor(Math.random() * 100) + 10,
          productCount: Math.floor(Math.random() * 2000) + 100,
          rfqCount: Math.floor(Math.random() * 500) + 20,
        });
      }
    } catch (error) {
      console.error('Error fetching tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p>Locataire non trouvé</p>
        <Link href="/super-admin/tenants">
          <Button className="mt-4">Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/tenants">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <span 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: tenant.primaryColor }}
            >
              {tenant.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <h1 className="text-2xl font-bold">{tenant.name}</h1>
              <p className="text-gray-500">{tenant.slug}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={tenant.isActive ? 'default' : 'secondary'}>
            {tenant.isActive ? 'Actif' : 'Inactif'}
          </Badge>
          <Badge variant="outline">{tenant.planType}</Badge>
          <Link href={`/super-admin/tenants/${tenant.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(`/?tenant=${tenant.slug}`, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Voir
          </Button>
        </div>
      </div>

      {/* Quick Info */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Pays</p>
              <p className="font-medium">{tenant.countryName} 🇩🇿</p>
            </div>
            <div>
              <p className="text-gray-500">Langue</p>
              <p className="font-medium uppercase">{tenant.defaultLanguage}</p>
            </div>
            <div>
              <p className="text-gray-500">Devise</p>
              <p className="font-medium">{tenant.currencySymbol}</p>
            </div>
            <div>
              <p className="text-gray-500">Domaine</p>
              <p className="font-medium truncate">{tenant.domain || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500">Créé le</p>
              <p className="font-medium">
                {new Date(tenant.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Abonnement</p>
              <p className="font-medium">
                {tenant.subscriptionEnd 
                  ? new Date(tenant.subscriptionEnd).toLocaleDateString('fr-FR')
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Utilisateurs</p>
                <p className="text-3xl font-bold">{stats.userCount.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% ce mois
                </p>
              </div>
              <Users className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Entreprises</p>
                <p className="text-3xl font-bold">{stats.companyCount.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +8% ce mois
                </p>
              </div>
              <Building2 className="h-10 w-10 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Produits</p>
                <p className="text-3xl font-bold">{stats.productCount.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +24% ce mois
                </p>
              </div>
              <Package className="h-10 w-10 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Appels d'offres</p>
                <p className="text-3xl font-bold">{stats.rfqCount.toLocaleString()}</p>
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3" />
                  -3% ce mois
                </p>
              </div>
              <FileText className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart (Simplified) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Croissance mensuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((data, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-8 text-sm text-gray-500">{data.month}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(data.users / 150) * 100}%`,
                        backgroundColor: tenant.primaryColor 
                      }}
                    ></div>
                  </div>
                  <span className="w-10 text-sm font-medium text-right">{data.users}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Nouvel utilisateur inscrit', time: 'Il y a 5 min', type: 'user' },
                { action: 'Nouvelle entreprise vérifiée', time: 'Il y a 23 min', type: 'company' },
                { action: 'RFQ publié dans Construction', time: 'Il y a 1h', type: 'rfq' },
                { action: 'Devis envoyé pour RFQ #1234', time: 'Il y a 2h', type: 'quote' },
                { action: 'Produit mis à jour', time: 'Il y a 3h', type: 'product' },
                { action: 'Avis laissé par acheteur', time: 'Il y a 4h', type: 'review' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'user' ? 'bg-blue-500' :
                    activity.type === 'company' ? 'bg-purple-500' :
                    activity.type === 'rfq' ? 'bg-orange-500' :
                    activity.type === 'quote' ? 'bg-green-500' :
                    activity.type === 'product' ? 'bg-cyan-500' :
                    'bg-yellow-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Utilisation du plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: 'Utilisateurs', current: stats.userCount, limit: tenant.planType === 'free' ? 100 : tenant.planType === 'professional' ? 1000 : -1 },
              { label: 'Entreprises', current: stats.companyCount, limit: tenant.planType === 'free' ? 50 : tenant.planType === 'professional' ? 500 : -1 },
              { label: 'Produits', current: stats.productCount, limit: tenant.planType === 'free' ? 500 : tenant.planType === 'professional' ? 10000 : -1 },
            ].map((item, i) => {
              const percentage = item.limit === -1 ? 25 : (item.current / item.limit) * 100;
              const isOverLimit = item.limit !== -1 && item.current > item.limit;
              
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className={isOverLimit ? 'text-red-600 font-medium' : ''}>
                      {item.current.toLocaleString()} / {item.limit === -1 ? '∞' : item.limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${isOverLimit ? 'bg-red-500' : ''}`}
                      style={{ 
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: isOverLimit ? undefined : tenant.primaryColor
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
            
            {tenant.planType === 'free' && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 Passez au plan <strong>Professionnel</strong> pour augmenter vos limites et débloquer de nouvelles fonctionnalités.
                </p>
                <Link href={`/super-admin/tenants/${tenant.id}/edit`}>
                  <Button variant="outline" size="sm" className="mt-2">
                    Changer le plan
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
