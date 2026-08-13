'use client';

import React from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { StatusBadge, OrderStatusBadge } from '@/components/dashboard/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Eye,
  Send,
  ShoppingCart,
  TrendingUp,
  PlusCircle,
  FileText,
  ArrowRight,
  AlertTriangle,
  Clock
} from 'lucide-react';
import Link from 'next/link';

// Mock data for dashboard - in production this would come from API
const mockKPIs = {
  totalProducts: 24,
  monthlyViews: 12543,
  pendingQuotations: 8,
  monthlyOrders: 15,
  responseRate: 94.5,
};

const mockRecentOrders = [
  {
    id: 'ORD-2024-045',
    buyer: 'Sarl Bâtiment Plus',
    items: 3,
    total: 285000,
    status: 'PENDING',
    date: '2024-01-15',
  },
  {
    id: 'ORD-2024-044',
    buyer: 'Ets. Nouara Import',
    items: 1,
    total: 45000,
    status: 'CONFIRMED',
    date: '2024-01-14',
  },
  {
    id: 'ORD-2024-043',
    buyer: 'Groupe Industriel Algérie',
    items: 5,
    total: 892000,
    status: 'PROCESSING',
    date: '2024-01-13',
  },
  {
    id: 'ORD-2024-042',
    buyer: 'Matières Premières SARL',
    items: 2,
    total: 156000,
    status: 'SHIPPED',
    date: '2024-01-12',
  },
  {
    id: 'ORD-2024-041',
    buyer: 'Construction Moderne',
    items: 4,
    total: 523000,
    status: 'DELIVERED',
    date: '2024-01-10',
  },
];

const mockLowStockProducts = [
  { id: '1', name: 'Ciment Portland CEM I 42.5', stock: 15, minStock: 50 },
  { id: '2', name: 'Acier HA Fe E400 Ø12', stock: 8, minStock: 25 },
];

const mockInquiriesChart = [
  { month: 'Sep', count: 12 },
  { month: 'Oct', count: 19 },
  { month: 'Nov', count: 15 },
  { month: 'Déc', count: 25 },
  { month: 'Jan', count: 32 },
];

export default function SellerDashboardPage() {
  const maxInquiryCount = Math.max(...mockInquiriesChart.map(d => d.count));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-1">Bienvenue sur votre espace fournisseur</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/seller/products/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              Ajouter Produit
            </Link>
          </Button>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/dashboard/seller/rfqs">
              <FileText className="h-4 w-4 mr-2" />
              Voir les Appels d&apos;Offres
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPICard
          title="Produits Actifs"
          value={mockKPIs.totalProducts}
          change={8.3}
          icon={Package}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <KPICard
          title="Vues ce Mois"
          value={mockKPIs.monthlyViews}
          change={15.2}
          icon={Eye}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <KPICard
          title="Devis en Attente"
          value={mockKPIs.pendingQuotations}
          change={-5}
          icon={Send}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
        <KPICard
          title="Commandes ce Mois"
          value={mockKPIs.monthlyOrders}
          change={22.5}
          icon={ShoppingCart}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <KPICard
          title="Taux de Réponse"
          value={mockKPIs.responseRate}
          format="percentage"
          change={2.1}
          icon={TrendingUp}
          iconColor="text-cyan-600"
          iconBgColor="bg-cyan-100"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inquiries Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Demandes de Devis Récents
            </CardTitle>
            <CardDescription>Nombre d&apos;appels d&apos;offres reçus ces derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-end justify-between gap-2 px-2">
              {mockInquiriesChart.map((item) => (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{item.count}</span>
                  <div 
                    className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-md transition-all duration-500 hover:from-green-700 hover:to-green-500"
                    style={{ 
                      height: `${(item.count / maxInquiryCount) * 180}px`,
                      minHeight: '20px'
                    }}
                  />
                  <span className="text-xs text-gray-500 font-medium">{item.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          {mockLowStockProducts.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  Stock Faible
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockLowStockProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-yellow-200"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-yellow-700">
                        Stock: {product.stock} (Min: {product.minStock})
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 whitespace-nowrap">
                      Critique
                    </Badge>
                  </div>
                ))}
                <Button asChild variant="link" className="w-full text-yellow-700 hover:text-yellow-800 p-0 h-auto">
                  <Link href="/dashboard/seller/products" className="gap-1">
                    Gérer le stock <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/seller/products/new">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nouveau Produit
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/seller/rfqs">
                  <FileText className="h-4 w-4 mr-2" />
                  Consulter les RFQs
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/seller/quotations/new">
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer un Devis
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/seller/company">
                  <Package className="h-4 w-4 mr-2" />
                  Mon Profil Entreprise
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              Commandes Récentes
            </CardTitle>
            <CardDescription>Vos 5 dernières commandes</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/seller/orders" className="gap-1">
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Acheteur</th>
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
                    <td className="py-3 px-4 text-gray-900">{order.buyer}</td>
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
