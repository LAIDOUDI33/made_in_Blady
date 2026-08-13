'use client';

import React from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { StatusBadge, OrderStatusBadge } from '@/components/dashboard/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Inbox,
  ShoppingCart,
  Users,
  PlusCircle,
  Search,
  Eye,
  ArrowRight,
  Clock,
  CheckCircle2,
  Package,
  TrendingUp,
  Star
} from 'lucide-react';
import Link from 'next/link';

// Mock data for dashboard - in production this would come from API
const mockKPIs = {
  activeRFQs: 5,
  unreadQuotations: 12,
  activeOrders: 3,
  followedSuppliers: 18,
};

const mockRecentActivity = [
  {
    id: '1',
    type: 'rfq_posted',
    title: "Appel d'offres publié",
    description: 'Fourniture de ciment Portland CEM I 42.5 - 500 tonnes',
    date: '2024-01-15T10:30:00',
    icon: FileText,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
  },
  {
    id: '2',
    type: 'quotation_received',
    title: 'Nouveau devis reçu',
    description: 'Devis de Cimenterie d\'Algerie pour votre AO #AO-2024-015',
    date: '2024-01-15T09:45:00',
    icon: Inbox,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
  },
  {
    id: '3',
    type: 'order_placed',
    title: 'Commande passée',
    description: 'Commande #ORD-2024-089 chez AcierPro SARL',
    date: '2024-01-14T16:20:00',
    icon: ShoppingCart,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
  },
  {
    id: '4',
    type: 'quotation_accepted',
    title: 'Devis accepté par fournisseur',
    description: 'Votre négociation avec BâtimentPlus a abouti',
    date: '2024-01-14T11:00:00',
    icon: CheckCircle2,
    iconColor: 'text-cyan-600',
    iconBg: 'bg-cyan-100',
  },
  {
    id: '5',
    type: 'order_delivered',
    title: 'Commande livrée',
    description: 'Commande #ORD-2024-085 livrée avec succès',
    date: '2024-01-13T14:30:00',
    icon: Package,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
  },
];

const mockRecommendedProducts = [
  {
    id: '1',
    name: 'Ciment Portland CEM I 42.5',
    supplier: 'Cimenterie d\'Algérie',
    price: 12500,
    unit: 'tonne',
    image: null,
    rating: 4.8,
    category: 'Matériaux Construction',
  },
  {
    id: '2',
    name: 'Acier HA Fe E400 Ø12',
    supplier: 'AcierPro SARL',
    price: 185000,
    unit: 'tonne',
    image: null,
    rating: 4.6,
    category: 'Fer & Acier',
  },
  {
    id: '3',
    name: 'Brique Creuse 12 trous',
    supplier: 'Briqueterie Moderne',
    price: 14,
    unit: 'unité',
    image: null,
    rating: 4.5,
    category: 'Matériaux Construction',
  },
  {
    id: '4',
    name: 'Gravier Concassé 3/8',
    supplier: 'Carrières du Sud',
    price: 4500,
    unit: 'm³',
    image: null,
    rating: 4.7,
    category: 'Agrégats',
  },
];

const mockRecentOrders = [
  {
    id: 'ORD-2024-089',
    supplier: 'AcierPro SARL',
    items: 2,
    total: 370000,
    status: 'CONFIRMED',
    date: '2024-01-14',
  },
  {
    id: 'ORD-2024-088',
    supplier: 'Cimenterie d\'Algérie',
    items: 1,
    total: 625000,
    status: 'PROCESSING',
    date: '2024-01-12',
  },
  {
    id: 'ORD-2024-087',
    supplier: 'BâtimentPlus',
    items: 4,
    total: 245000,
    status: 'SHIPPED',
    date: '2024-01-10',
  },
];

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR');
}

export default function BuyerDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-1">Bienvenue sur votre espace acheteur</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/products">
              <Search className="h-4 w-4 mr-2" />
              Explorer les Produits
            </Link>
          </Button>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/dashboard/buyer/rfqs/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              Publier un AO
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="RFQs Actifs"
          value={mockKPIs.activeRFQs}
          change={12}
          icon={FileText}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <KPICard
          title="Devis Non Lus"
          value={mockKPIs.unreadQuotations}
          change={25}
          icon={Inbox}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <KPICard
          title="Commandes en Cours"
          value={mockKPIs.activeOrders}
          change={0}
          icon={ShoppingCart}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <KPICard
          title="Fournisseurs Suivis"
          value={mockKPIs.followedSuppliers}
          change={8}
          icon={Users}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Activité Récente
              </CardTitle>
              <CardDescription>Vos dernières activités sur la plateforme</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/buyer/activity" className="gap-1">
                Voir tout <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivity.map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${activity.iconBg}`}>
                    <activity.icon className={`h-5 w-5 ${activity.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatRelativeTime(activity.date)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/buyer/rfqs/new">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nouvel Appel d&apos;Offre
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/products">
                  <Search className="h-4 w-4 mr-2" />
                  Explorer les Produits
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/buyer/quotations">
                  <Inbox className="h-4 w-4 mr-2" />
                  Voir mes Devis
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/buyer/orders">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Suivre mes Commandes
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Stats Summary */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-green-800">
                <TrendingUp className="h-5 w-5" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Taux de réponse</span>
                <span className="font-bold text-green-800">87%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">AO attribués ce mois</span>
                <span className="font-bold text-green-800">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Économies réalisées</span>
                <span className="font-bold text-green-800">12.5%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recommended Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Produits Recommandés
            </CardTitle>
            <CardDescription>Basé sur vos catégories préférées et historique</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/products" className="gap-1">
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockRecommendedProducts.map((product) => (
              <Link 
                key={product.id}
                href={`/products/${product.id}`}
                className="group block"
              >
                <Card className="hover:shadow-md transition-all duration-200 h-full overflow-hidden">
                  {/* Product Image Placeholder */}
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                    <Package className="h-16 w-16 text-gray-300 group-hover:text-green-500 transition-colors" />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-white/90 text-xs">
                        {product.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-medium text-gray-900 line-clamp-1 group-hover:text-green-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{product.supplier}</p>
                    
                    <div className="flex items-center mt-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium ml-1">{product.rating}</span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t flex items-end justify-between">
                      <div>
                        <span className="text-lg font-bold text-green-600">
                          {product.price.toLocaleString('fr-DZ')} DZD
                        </span>
                        <span className="text-xs text-gray-500 ml-1">/{product.unit}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
              Commandes Récentes
            </CardTitle>
            <CardDescription>Vos dernières commandes en cours</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/buyer/orders" className="gap-1">
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">N° Commande</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Fournisseur</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Articles</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {mockRecentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-green-700">{order.id}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{order.supplier}</td>
                    <td className="py-3 px-4 text-center">{order.items}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      {order.total.toLocaleString('fr-DZ')} DZD
                    </td>
                    <td className="py-3 px-4 text-center">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-sm">
                      {new Date(order.date).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
