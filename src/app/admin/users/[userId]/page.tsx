'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ConfirmDialog, DeleteUserDialog, SuspendUserDialog } from '@/components/admin/ConfirmDialog';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Package,
  ShoppingCart,
  FileText,
  MessageSquare,
  Star,
  Clock,
  Shield,
  AlertTriangle,
  Edit,
  Ban,
  Trash2,
  CheckCircle
} from 'lucide-react';

// Sample user data (in production, this comes from API)
const sampleUser = {
  id: '1',
  firstName: 'Karim',
  lastName: 'Meziani',
  email: 'karim.meziani@example.com',
  phone: '+213 555 123 456',
  role: 'SUPPLIER' as const,
  status: 'ACTIVE' as const,
  avatar: undefined,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-08-12T14:20:00Z',
  lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  emailVerified: true,
  company: {
    id: 'c1',
    name: 'SARL Technologie Algerienne',
    slug: 'sar-technologie-algerienne',
    legalForm: 'SARL',
    rcNumber: '16B/001234',
    nif: '000016001234567',
    nis: '100012340012345',
    wilaya: 'Alger',
    commune: 'Hussein Dey',
    address: '123 Rue des Entreprises, Zone Industrielle',
    contactEmail: 'contact@technologie-dz.dz',
    contactPhone: '+213 555 987 654',
    description: 'Spécialiste dans les solutions technologiques pour les entreprises algériennes.',
    verificationStatus: 'VERIFIED' as const,
    isVerified: true,
    rating: 4.8,
    reviewCount: 24,
    responseRate: 95,
    employeeCount: 25,
    yearEstablished: 2018,
  },
};

// Activity timeline data
const activityTimeline = [
  {
    id: '1',
    type: 'login',
    description: 'Connexion à la plateforme',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    type: 'product_update',
    description: 'Modification du produit "Serveur Dell PowerEdge R740"',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    type: 'order_received',
    description: 'Réception de la commande #ORD-1245 (245 000 DZD)',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    type: 'quotation_sent',
    description: "Envoi d'un devis pour RFQ #RFQ-890",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    type: 'message_sent',
    description: 'Message envoyé à Fatima Zahra',
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
  {
    id: '6',
    type: 'registration',
    description: 'Inscription sur la plateforme',
    timestamp: new Date('2024-01-15T10:30:00Z'),
  },
];

export default function UserDetailPage() {
  const [user] = useState(sampleUser);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSuspend = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    setSuspendDialogOpen(false);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    setDeleteDialogOpen(false);
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 30) return `Il y a ${diffDays}j`;
    return formatDate(date);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'product_update': return <Package className="h-4 w-4 text-purple-500" />;
      case 'order_received': return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'quotation_sent': return <FileText className="h-4 w-4 text-orange-500" />;
      case 'message_sent': return <MessageSquare className="h-4 w-4 text-cyan-500" />;
      case 'registration': return <User className="h-4 w-4 text-indigo-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profil Utilisateur</h1>
          <p className="text-gray-500 mt-1">Détails et historique d&apos;activité</p>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - User info */}
        <div className="space-y-6">
          {/* User card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                  <AvatarFallback className="bg-green-600 text-white text-2xl">
                    {user.firstName[0]}{user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={user.status === 'ACTIVE' ? 'default' : 'destructive'}
                    className="gap-1"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-white' : 'bg-red-200'}`} />
                    {user.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
                  </Badge>
                  <Badge variant="secondary">{user.role}</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-2">{user.email}</p>
                
                <Separator className="w-full my-4" />
                
                <div className="w-full space-y-3 text-sm">
                  <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
                  {user.phone && (
                    <InfoRow icon={<Phone className="h-4 w-4" />} label="Téléphone" value={user.phone} />
                  )}
                  <InfoRow 
                    icon={<Calendar className="h-4 w-4" />} 
                    label="Inscrit le" 
                    value={formatDate(user.createdAt)} 
                  />
                  <InfoRow 
                    icon={<Clock className="h-4 w-4" />} 
                    label="Dernière connexion" 
                    value={formatRelativeTime(new Date(user.lastLogin))} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Edit className="h-4 w-4" /> Modifier le profil
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 text-yellow-700 hover:bg-yellow-50"
                onClick={() => setSuspendDialogOpen(true)}
              >
                <Ban className="h-4 w-4" /> Suspendre l&apos;utilisateur
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 text-red-600 hover:bg-red-50"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" /> Supprimer le compte
              </Button>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-red-200 bg-red-50/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" /> Zone de danger
              </CardTitle>
              <CardDescription>Actions irréversibles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-sm">Suspendre l&apos;utilisateur</p>
                  <p className="text-xs text-gray-500">Empêcher la connexion</p>
                </div>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => setSuspendDialogOpen(true)}
                >
                  Suspendre
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-sm">Supprimer définitivement</p>
                  <p className="text-xs text-gray-500">Supprime aussi les données associées</p>
                </div>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Details tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="company" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="company" className="gap-1">
                <Building2 className="h-4 w-4 hidden sm:inline" /> Entreprise
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-1">
                <Clock className="h-4 w-4 hidden sm:inline" /> Activité
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-1">
                <Star className="h-4 w-4 hidden sm:inline" /> Statistiques
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-1">
                <Shield className="h-4 w-4 hidden sm:inline" /> Sécurité
              </TabsTrigger>
            </TabsList>

            {/* Company tab */}
            <TabsContent value="company" className="mt-4">
              {user.company ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{user.company.name}</CardTitle>
                        <CardDescription>{user.company.legalForm} • {user.company.wilaya}</CardDescription>
                      </div>
                      <Badge 
                        variant={user.company.isVerified ? 'default' : 'secondary'}
                        className={user.company.isVerified ? 'bg-green-100 text-green-800' : ''}
                      >
                        {user.company.isVerified ? 'Vérifiée' : 'Non vérifiée'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
                          Informations légales
                        </h4>
                        <InfoRow icon={<FileTextIcon className="h-4 w-4" />} label="RC Number" value={user.company.rcNumber} />
                        <InfoRow icon={<FileTextIcon className="h-4 w-4" />} label="NIF" value={user.company.nif || '-'} />
                        <InfoRow icon={<FileTextIcon className="h-4 w-4" />} label="NIS" value={user.company.nis || '-'} />
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
                          Contact & Localisation
                        </h4>
                        <InfoRow icon={<MapPin className="h-4 w-4" />} label="Adresse" value={user.company.address || '-'} />
                        <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.company.contactEmail} />
                        <InfoRow icon={<Phone className="h-4 w-4" />} label="Téléphone" value={user.company.contactPhone} />
                      </div>
                    </div>
                    
                    {user.company.description && (
                      <>
                        <Separator className="my-4" />
                        <div>
                          <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-2">
                            Description
                          </h4>
                          <p className="text-sm text-gray-700">{user.company.description}</p>
                        </div>
                      </>
                    )}

                    <Separator className="my-4" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatBox label="Note" value={`${user.company.rating}/5`} icon={<Star className="h-4 w-4" />} />
                      <StatBox label="Avis" value={user.company.reviewCount.toString()} icon={<Star className="h-4 w-4" />} />
                      <StatBox label="Taux réponse" value={`${user.company.responseRate}%`} icon={<CheckCircle className="h-4 w-4" />} />
                      <StatBox label="Employés" value={user.company.employeeCount?.toString() || '-'} icon={<UserIcon className="h-4 w-4" />} />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-1">Aucune entreprise</h3>
                    <p className="text-sm text-gray-500">Cet utilisateur n&apos;a pas encore créé d&apos;entreprise.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Activity tab */}
            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historique d&apos;activité</CardTitle>
                  <CardDescription>Dernières actions de l&apos;utilisateur</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                    <div className="space-y-6">
                      {activityTimeline.map((activity) => (
                        <div key={activity.id} className="relative flex gap-4 pl-10">
                          <div className="absolute left-2 w-5 h-5 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 pb-2">
                            <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatRelativeTime(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stats tab */}
            <TabsContent value="stats" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques utilisateur</CardTitle>
                  <CardDescription>Performance et engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatBox label="Connexions totales" value="156" icon={<Clock className="h-4 w-4" />} />
                    <StatBox label="Valeur commandes" value="1.2M DZD" icon={<ShoppingCart className="h-4 w-4" />} />
                    <StatBox label="Avis donnés" value="12" icon={<Star className="h-4 w-4" />} />
                    <StatBox label="Produits créés" value="28" icon={<Package className="h-4 w-4" />} />
                    <StatBox label="Devis envoyés" value="45" icon={<FileText className="h-4 w-4" />} />
                    <StatBox label="Messages envoyés" value="89" icon={<MessageSquare className="h-4 w-4" />} />
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-4">
                      Performance (si fournisseur)
                    </h4>
                    <div className="space-y-4">
                      <ProgressBar label="Taux de réponse" value={95} color="green" />
                      <ProgressBar label="Temps de réponse moyen" value={85} suffix="< 2h" color="blue" />
                      <ProgressBar label="Taux de conversion" value={72} color="purple" />
                      <ProgressBar label="Satisfaction client" value={96} color="green" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security tab */}
            <TabsContent value="security" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informations de sécurité</CardTitle>
                  <CardDescription>État du compte et paramètres de sécurité</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SecurityItem 
                    label="Email vérifié" 
                    status={user.emailVerified}
                    verifiedAt="2024-01-15T11:00:00Z"
                  />
                  <SecurityItem 
                    label="Authentification 2FA" 
                    status={false}
                  />
                  <SecurityItem 
                    label="Mot de passe fort" 
                    status={true}
                  />
                  <SecurityItem 
                    label="Sessions actives" 
                    status={true}
                    extraInfo="2 sessions (Alger, Chrome)"
                  />

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-sm">Forcer la déconnexion</p>
                        <p className="text-xs text-gray-500">Déconnecte l&apos;utilisateur de toutes les sessions</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Déconnecter</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <SuspendUserDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        userName={`${user.firstName} ${user.lastName}`}
        onConfirm={handleSuspend}
        isLoading={isLoading}
      />

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userName={`${user.firstName} ${user.lastName}`}
        hasCompany={!!user.company}
        hasOrders={true}
        onConfirm={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}

// Helper components
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div>
        <span className="text-xs text-gray-500 block">{label}</span>
        <span className="text-sm text-gray-900">{value}</span>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg text-center">
      <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
        {icon}
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function ProgressBar({ label, value, color, suffix }: { label: string; value: number; color?: string; suffix?: string }) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };
  
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{suffix || `${value}%`}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${colorClasses[color || 'green']}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function SecurityItem({ label, status, verifiedAt, extraInfo }: { label: string; status: boolean; verifiedAt?: string; extraInfo?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {status ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        )}
        <div>
          <p className="text-sm font-medium">{label}</p>
          {verifiedAt && status && (
            <p className="text-xs text-gray-500">Vérifié le {new Date(verifiedAt).toLocaleDateString('fr-FR')}</p>
          )}
          {!status && (
            <p className="text-xs text-yellow-600">Non configuré</p>
          )}
          {extraInfo && (
            <p className="text-xs text-gray-500">{extraInfo}</p>
          )}
        </div>
      </div>
      {!status && (
        <Button size="sm" variant="outline" className="text-xs h-7">
          Configurer
        </Button>
      )}
    </div>
  );
}

// Icon components to avoid naming conflicts
function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
