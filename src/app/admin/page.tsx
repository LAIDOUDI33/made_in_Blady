import { requireRole } from '@/lib/auth-utils';
import { UserRole } from '@prisma/client';
import { db } from '@/lib/db';
import { StatsCard } from '@/components/admin/StatsCard';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  UserPlus,
  Building2,
  Package,
  FileText,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

// Sample data for charts (in production, this would come from API)
const monthlyRegistrations = [
  { month: 'Jan', inscriptions: 45 },
  { month: 'Fév', inscriptions: 62 },
  { month: 'Mar', inscriptions: 78 },
  { month: 'Avr', inscriptions: 91 },
  { month: 'Mai', inscriptions: 85 },
  { month: 'Juin', inscriptions: 103 },
  { month: 'Juil', inscriptions: 120 },
  { month: 'Août', inscriptions: 95 },
  { month: 'Sep', inscriptions: 134 },
  { month: 'Oct', inscriptions: 148 },
  { month: 'Nov', inscriptions: 162 },
  { month: 'Déc', inscriptions: 178 },
];

const roleDistribution = [
  { name: 'Acheteurs', value: 1245, color: '#22c55e' },
  { name: 'Fournisseurs', value: 389, color: '#f97316' },
  { name: 'Admins', value: 12, color: '#3b82f6' },
];

const weeklyActivity = [
  { day: 'Lun', utilisateurs: 23, commandes: 8, rfqs: 12 },
  { day: 'Mar', utilisateurs: 31, commandes: 14, rfqs: 18 },
  { day: 'Mer', utilisateurs: 28, commandes: 11, rfqs: 15 },
  { day: 'Jeu', utilisateurs: 42, commandes: 19, rfqs: 22 },
  { day: 'Ven', utilisateurs: 38, commandes: 16, rfqs: 20 },
  { day: 'Sam', utilisateurs: 15, commandes: 5, rfqs: 8 },
  { day: 'Dim', utilisateurs: 12, commandes: 3, rfqs: 6 },
];

export default async function AdminDashboardPage() {
  // Protect route - admin only
  await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR]);

  // Fetch real statistics from database
  const [
    totalUsers,
    newUsersThisMonth,
    totalSuppliers,
    verifiedSuppliers,
    activeProducts,
    activeRfqs,
    ordersThisMonth,
    pendingCompanies,
    reportedProducts
  ] = await Promise.all([
    db.user.count(),
    db.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),
    db.user.count({
      where: { role: 'SUPPLIER' }
    }),
    db.company.count({
      where: { 
        isVerified: true,
        isActive: true 
      }
    }),
    db.product.count({
      where: { 
        status: 'active',
        isActive: true 
      }
    }),
    db.rfq.count({
      where: {
        status: {
          in: ['PUBLISHED', 'QUOTATIONS_RECEIVED', 'NEGOTIATION']
        }
      }
    }),
    db.order.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),
    db.company.count({
      where: { verificationStatus: 'PENDING' }
    }),
    db.product.count({
      where: { status: 'reported' }
    })
  ]);

  // Calculate estimated revenue (sum of orders this month)
  const ordersData = await db.order.aggregate({
    _sum: { totalAmount: true },
    where: {
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    }
  });
  
  const revenueThisMonth = ordersData._sum.totalAmount || 0;
  const conversionRate = totalUsers > 0 ? ((ordersThisMonth / totalUsers) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">Vue d&apos;ensemble de la plateforme AlgeriaTrade</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            Système opérationnel
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard
          title="Total utilisateurs"
          value={totalUsers.toLocaleString('fr-FR')}
          description="+12.5% par rapport au mois dernier"
          icon={Users}
          trend={{ value: 12.5, isPositive: true }}
          iconClassName="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Nouveaux inscrits (ce mois)"
          value={newUsersThisMonth}
          description="Acheteurs et fournisseurs"
          icon={UserPlus}
          trend={{ value: 8.3, isPositive: true }}
          iconClassName="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Fournisseurs vérifiés"
          value={`${verifiedSuppliers}/${totalSuppliers}`}
          description={`${totalSuppliers - verifiedSuppliers} en attente`}
          icon={Building2}
          iconClassName="bg-orange-100 text-orange-600"
        />
        <StatsCard
          title="Produits actifs"
          value={activeProducts}
          description="Produits publiés et visibles"
          icon={Package}
          trend={{ value: 5.2, isPositive: true }}
          iconClassName="bg-purple-100 text-purple-600"
        />
        <StatsCard
          title="RFQs actifs"
          value={activeRfqs}
          description="Appels d'offre en cours"
          icon={FileText}
          iconClassName="bg-indigo-100 text-indigo-600"
        />
        <StatsCard
          title="Commandes (ce mois)"
          value={ordersThisMonth}
          description="Nouvelles commandes créées"
          icon={ShoppingCart}
          trend={{ value: 15.7, isPositive: true }}
          iconClassName="bg-cyan-100 text-cyan-600"
        />
        <StatsCard
          title="Chiffre d'affaires estimé"
          value={`${(revenueThisMonth / 1000).toFixed(1)}K DZD`}
          description="Total des commandes du mois"
          icon={TrendingUp}
          trend={{ value: 22.1, isPositive: true }}
          iconClassName="bg-emerald-100 text-emerald-600"
        />
        <StatsCard
          title="Taux de conversion"
          value={`${conversionRate}%`}
          description="Visiteurs → Commandes"
          icon={TrendingUp}
          trend={{ value: 2.4, isPositive: true }}
          iconClassName="bg-teal-100 text-teal-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Registrations Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inscriptions mensuelles</CardTitle>
            <CardDescription>Évolution des nouveaux inscrits sur les 12 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value} inscriptions`, 'Inscriptions']}
                  />
                  <Bar 
                    dataKey="inscriptions" 
                    fill="#006233" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Role Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par rôle</CardTitle>
            <CardDescription>Distribution des utilisateurs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [value.toLocaleString('fr-FR'), '']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Activité sur les 7 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="utilisateurs" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    name="Nouveaux utilisateurs"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="commandes" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', r: 4 }}
                    name="Commandes"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rfqs" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    dot={{ fill: '#f97316', r: 4 }}
                    name="Appels d'offre"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Tâches prioritaires</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/companies?status=PENDING" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 hover:bg-yellow-50 hover:border-yellow-200 group">
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 rounded-lg bg-yellow-100 group-hover:bg-yellow-200 transition-colors">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">Vérifier entreprises</p>
                    <p className="text-xs text-gray-500">{pendingCompanies} en attente</p>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                    {pendingCompanies}
                  </Badge>
                </div>
              </Button>
            </Link>

            <Link href="/admin/products?status=REPORTED" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 hover:bg-red-50 hover:border-red-200 group">
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">Produits signalés</p>
                    <p className="text-xs text-gray-500">Modération requise</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {reportedProducts}
                  </Badge>
                </div>
              </Button>
            </Link>

            <Link href="/admin/users" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 hover:bg-blue-50 hover:border-blue-200 group">
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">Voir tous les utilisateurs</p>
                    <p className="text-xs text-gray-500">{totalUsers} comptes</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </Button>
            </Link>

            <Link href="/admin/orders" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 hover:bg-green-50 hover:border-green-200 group">
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">Dernières commandes</p>
                    <p className="text-xs text-gray-500">{ordersThisMonth} ce mois</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <ActivityFeed />
    </div>
  );
}
