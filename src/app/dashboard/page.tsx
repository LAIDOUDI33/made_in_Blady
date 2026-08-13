"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  FileText,
  MessageSquare,
  Heart,
  TrendingUp,
  Users,
  Eye,
  Star,
  Plus,
  ArrowRight,
  Bell,
  Settings,
  Building2,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const recentOrders = [
  {
    id: "ORD-2024-001",
    product: "Panneaux Solaires 550W",
    supplier: "SolarTech Algeria",
    status: "delivered",
    date: "2024-01-15",
    total: 450000,
  },
  {
    id: "ORD-2024-002",
    product: "Câble Électrique 16mm²",
    supplier: "CableAlger",
    status: "shipped",
    date: "2024-01-18",
    total: 85000,
  },
];

const recentRFQs = [
  {
    id: "RFQ-2024-001",
    title: "Pompes d'irrigation pour projet agricole",
    responses: 5,
    status: "published",
    expiresAt: "2024-02-01",
  },
  {
    id: "RFQ-2024-002",
    title: "Système solaire 10kW pour usine",
    responses: 8,
    status: "matching",
    expiresAt: "2024-01-25",
  },
];

const notifications = [
  {
    id: 1,
    type: "quotation",
    message: "Nouveau devis pour votre RFQ #001",
    time: "Il y a 2h",
    unread: true,
  },
  {
    id: 2,
    type: "message",
    message: "Nouveau message de SolarTech Algeria",
    time: "Il y a 4h",
    unread: true,
  },
  {
    id: 3,
    type: "order",
    message: "Commande ORD-2024-001 livrée",
    time: "Hier",
    unread: false,
  },
];

const stats = [
  {
    title: "Commandes Actives",
    value: "12",
    change: "+3 ce mois",
    icon: Package,
    color: "text-blue-600 bg-blue-100",
  },
  {
    title: "Appels d'Offre",
    value: "8",
    change: "+2 en attente de réponse",
    icon: FileText,
    color: "text-green-600 bg-green-100",
  },
  {
    title: "Messages Non Lus",
    value: "5",
    change: "3 nouveaux aujourd'hui",
    icon: MessageSquare,
    color: "text-purple-600 bg-purple-100",
  },
  {
    title: "Favoris",
    value: "24",
    change: "+3 cette semaine",
    icon: Heart,
    color: "text-red-500 bg-red-100",
  },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Bienvenue, Ahmed
            </h1>
            <p className="text-muted-foreground">
              Voici un aperçu de votre activité sur AlgeriaTrade
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Link>
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" asChild>
              <Link href="/rfqs/new">
                <Plus className="h-4 w-4 mr-2" />
                Nouvel Appel d'Offre
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full lg:w-auto lg:inline-grid grid-cols-4 lg:flex">
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="orders">Mes Commandes</TabsTrigger>
            <TabsTrigger value="rfqs">Mes Appels d'Offre</TabsTrigger>
            <TabsTrigger value="activity">Activité</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-semibold">Commandes Récentes</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/orders">
                      Voir toutes <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{order.product}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.supplier} • {order.date}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge 
                            variant={order.status === "delivered" ? "default" : "secondary"}
                            className={
                              order.status === "delivered" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                            }
                          >
                            {order.status === "delivered" ? "Livrée" : "Expédiée"}
                          </Badge>
                          <p className="font-semibold text-sm">
                            {(order.total / 1000).toFixed(0)}K DZD
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    Notifications
                    <Bell className="h-4 w-4" />
                    {notifications.filter(n => n.unread).length > 0 && (
                      <Badge className="bg-red-500 text-white h-5 w-5 p-0 flex items-center justify-center">
                        {notifications.filter(n => n.unread).length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notifications.slice(0, 4).map((notif) => (
                      <div key={notif.id} className={`p-2 rounded-lg text-sm ${notif.unread ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}>
                        <p className={`${notif.unread ? 'font-medium' : ''}`}>{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="w-full mt-4" asChild>
                    <Link href="/notifications">Voir toutes</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:border-green-500 transition-colors">
                <CardContent className="pt-6 text-center space-y-3">
                  <div className="h-12 w-12 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Poster un Appel d&apos;Offre</h3>
                  <p className="text-sm text-muted-foreground">
                    Recevez des devis de fournisseurs vérifiés
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href="/rfqs/new">Commencer</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-green-500 transition-colors">
                <CardContent className="pt-6 text-center space-y-3">
                  <div className="h-12 w-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Explorer les Produits</h3>
                  <p className="text-sm text-muted-foreground">
                    Découvrez des milliers de produits algériens
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href="/products">Explorer</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-green-500 transition-colors">
                <CardContent className="pt-6 text-center space-y-3">
                  <div className="h-12 w-12 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Trouver des Fournisseurs</h3>
                  <p className="text-sm text-muted-foreground">
                    Connectez-vous avec des entreprises fiables
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href="/suppliers">Rechercher</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Mes Commandes</CardTitle>
                <CardDescription>Historique complet de vos commandes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{order.id}</span>
                        <Badge>{order.status}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Produit</p>
                          <p className="font-medium">{order.product}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Fournisseur</p>
                          <p className="font-medium">{order.supplier}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">{order.date}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-bold text-green-600">{(order.total / 1000).toFixed(0)}K DZD</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RFQs Tab */}
          <TabsContent value="rfqs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Mes Appels d&apos;Offre</CardTitle>
                  <CardDescription>Gérez vos demandes de devis</CardDescription>
                </div>
                <Button className="bg-green-600 hover:bg-green-700" asChild>
                  <Link href="/rfqs/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau RFQ
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentRFQs.map((rfq) => (
                    <div key={rfq.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-xs text-muted-foreground">{rfq.id}</span>
                          <h3 className="font-semibold">{rfq.title}</h3>
                        </div>
                        <Badge variant={rfq.status === "published" ? "default" : "secondary"}>
                          {rfq.status === "published" ? "Publié" : "En cours"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {rfq.responses} réponses
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Expire le {rfq.expiresAt}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activité Récente</CardTitle>
                <CardDescription>Vos dernières actions sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: "Consulté", item: "Panneaux Solaires 550W", time: "Il y a 2h", icon: Eye },
                    { action: "Ajouté aux favoris", item: "CableAlger Industrie", time: "Il y a 4h", icon: Heart },
                    { action: "Envoyé un message à", item: "SolarTech Algeria", time: "Hier", icon: MessageSquare },
                    { action: "Créé un appel d'offre", item: "Pompes d'irrigation", time: "Il y a 2 jours", icon: FileText },
                    { action: "Passé une commande", item: "Onduleur SolarEdge 10kW", time: "Il y a 3 jours", icon: Package },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center shadow-sm">
                        <activity.icon className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.action}</span>{" "}
                          <span className="text-green-600">{activity.item}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
