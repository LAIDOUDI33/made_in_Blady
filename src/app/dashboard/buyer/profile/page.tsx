'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Plus,
  Edit3,
  Save,
  Shield,
  Bell,
  Lock,
  Camera,
  CheckCircle2
} from 'lucide-react';
import { AddressForm, AddressCard, AddressData } from '@/components/buyer/AddressForm';

// Mock user data - in production this would come from API/auth
const mockUser = {
  id: 'user-001',
  firstName: 'Ahmed',
  lastName: 'Benali',
  email: 'ahmed.benali@entreprise.dz',
  phone: '+213 555 123 456',
  avatar: null,
  role: 'BUYER' as const,
  company: {
    name: 'BTP Solutions SARL',
    role: 'Directeur des Achats',
    activity: 'Construction & BTP',
    rcNumber: '16B-0123456789',
    nif: '000016001234567',
    nis: '10001600123456',
  },
  createdAt: '2023-03-15',
};

// Mock addresses data
const mockAddresses: AddressData[] = [
  {
    id: 'addr-001',
    label: 'Domicile',
    type: 'home',
    fullName: 'Ahmed Benali',
    phone: '+213 555 123 456',
    street: '123 Rue Didouche Mourad, Appt 45, Étage 3',
    commune: 'El Biar',
    wilaya: 'Alger (16)',
    instructions: 'Sonner à l\'interphone B12',
    isDefault: true,
  },
  {
    id: 'addr-002',
    label: 'Bureau',
    type: 'work',
    fullName: 'Ahmed Benali (BTP Solutions)',
    phone: '+213 555 987 654',
    street: 'Zone Industrielle Oued Smar, Lot 23',
    commune: 'Oued Smar',
    wilaya: 'Alger (16)',
    instructions: 'Réception du lundi au vendredi, 8h-17h',
    isDefault: false,
  },
  {
    id: 'addr-003',
    label: 'Chantier Constantine',
    type: 'other',
    fullName: 'M. Karim Mansouri (Chef de Chantier)',
    phone: '+213 661 234 567',
    street: 'Route de Batna, KM 5, Chantier Résidence Cirta',
    commune: 'Ain Smara',
    wilaya: 'Constantine (25)',
    instructions: 'Accès par la route secondaire, livrer avant 11h',
    isDefault: false,
  },
];

export default function BuyerProfilePage() {
  // Notification preferences mock
  const [mockNotifications, setMockNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    newQuotation: true,
    quotationAccepted: true,
    orderUpdate: true,
    newMessage: true,
    newProductAlert: false,
    promotionalEmails: false,
  });

  const [activeSection, setActiveSection] = useState('personal');
  const [addresses, setAddresses] = useState<AddressData[]>(mockAddresses);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form states for personal info
  const [personalInfo, setPersonalInfo] = useState({
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    email: mockUser.email,
    phone: mockUser.phone,
  });
  
  // Company info state
  const [companyInfo, setCompanyInfo] = useState(mockUser.company);

  // Password change dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Handle address operations
  const handleAddAddress = async (addressData: Omit<AddressData, 'id'>) => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newAddress: AddressData = {
      ...addressData,
      id: `addr-${Date.now()}`,
    };
    
    // If this is default, remove default from others
    if (addressData.isDefault) {
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: false })));
    }
    
    setAddresses(prev => [...prev, newAddress]);
    setIsAddingAddress(false);
    setIsSaving(false);
  };

  const handleEditAddress = async (addressData: Omit<AddressData, 'id'>) => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (addressData.isDefault) {
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === editingAddressId ? true : false })));
    }
    
    setAddresses(prev => 
      prev.map(a => a.id === editingAddressId ? { ...a, ...addressData } : a)
    );
    setEditingAddressId(null);
    setIsSaving(false);
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses(prev => 
      prev.map(a => ({ ...a, isDefault: a.id === id }))
    );
  };

  // Handle personal info save
  const handleSavePersonalInfo = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Saving personal info:', personalInfo);
    setIsSaving(false);
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Changing password');
    setPasswordDialogOpen(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-600 mt-1">Gérez vos informations personnelles et préférences</p>
      </div>

      {/* Profile Summary Card */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="py-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                {mockUser.firstName[0]}{mockUser.lastName[0]}
              </div>
              <Button
                size="icon"
                variant="outline"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white shadow-md"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {mockUser.firstName} {mockUser.lastName}
              </h2>
              <p className="text-gray-600">{mockUser.company.name}</p>
              <p className="text-sm text-gray-500">{mockUser.company.role}</p>
              
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline" className="bg-white/80">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                  Email vérifié
                </Badge>
                <span className="text-sm text-gray-500">
                  Membre depuis {new Date(mockUser.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8 overflow-x-auto">
          {[
            { id: 'personal', label: 'Informations Personnelles', icon: User },
            { id: 'company', label: 'Entreprise', icon: Building2 },
            { id: 'addresses', label: 'Adresses de Livraison', icon: MapPin },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Sécurité', icon: Lock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeSection === tab.id
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 inline mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Personal Information Section */}
      {activeSection === 'personal' && (
        <Card>
          <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
            <CardDescription>Mettez à jour vos coordonnées</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={personalInfo.firstName}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={personalInfo.lastName}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleSavePersonalInfo}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Section */}
      {activeSection === 'company' && (
        <Card>
          <CardHeader>
            <CardTitle>Informations Entreprise</CardTitle>
            <CardDescription>Détails de votre société (optionnel)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Raison Sociale</Label>
                <Input
                  id="companyName"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Votre Poste</Label>
                <Input
                  id="role"
                  value={companyInfo.role}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, role: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="activity">Secteur d&apos;activité</Label>
                <Select value={companyInfo.activity} onValueChange={(value) => setCompanyInfo(prev => ({ ...prev, activity: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Construction & BTP">Construction & BTP</SelectItem>
                    <SelectItem value="Industrie">Industrie</SelectItem>
                    <SelectItem value="Commerce">Commerce</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Agriculture">Agriculture</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rcNumber">Registre de Commerce</Label>
                <Input
                  id="rcNumber"
                  placeholder="Ex: 16B-0123456789"
                  value={companyInfo.rcNumber}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, rcNumber: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nif">NIF</Label>
                <Input
                  id="nif"
                  placeholder="Numéro d'Identification Fiscale"
                  value={companyInfo.nif}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, nif: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nis">NIS</Label>
                <Input
                  id="nis"
                  placeholder="Numéro d'Identification Statistique"
                  value={companyInfo.nis}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, nis: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Addresses Section */}
      {activeSection === 'addresses' && (
        <div className="space-y-4">
          {/* Add Address Button */}
          {!isAddingAddress && !editingAddressId && (
            <Button 
              variant="outline" 
              className="w-full border-dashed py-6"
              onClick={() => setIsAddingAddress(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une Nouvelle Adresse
            </Button>
          )}

          {/* Add/Edit Address Form */}
          {(isAddingAddress || editingAddressId) && (
            <AddressForm
              address={editingAddressId ? addresses.find(a => a.id === editingAddressId) || null : null}
              onSave={editingAddressId ? handleEditAddress : handleAddAddress}
              onCancel={() => {
                setIsAddingAddress(false);
                setEditingAddressId(null);
              }}
              isLoading={isSaving}
            />
          )}

          {/* Addresses List */}
          <div className="space-y-3">
            {addresses.map((address) => (
              editingAddressId === address.id ? null : (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={(id) => setEditingAddressId(id)}
                  onDelete={handleDeleteAddress}
                  onSetDefault={handleSetDefaultAddress}
                />
              )
            ))}
          </div>
        </div>
      )}

      {/* Notifications Section */}
      {activeSection === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Préférences de Notifications</CardTitle>
            <CardDescription>Choisissez comment et quand vous souhaitez être notifié</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Channel Preferences */}
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-gray-500" />
                Canaux de notification
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Notifications par Email</p>
                      <p className="text-sm text-gray-500">Recevez les mises à jour importantes par email</p>
                    </div>
                  </div>
                  <Switch 
                    checked={mockNotifications.emailNotifications}
                    onCheckedChange={(checked) => setMockNotifications(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Notifications Push</p>
                      <p className="text-sm text-gray-500">Notifications en temps réel sur votre navigateur</p>
                    </div>
                  </div>
                  <Switch 
                    checked={mockNotifications.pushNotifications}
                    onCheckedChange={(checked) => setMockNotifications(prev => ({ ...prev, pushNotifications: checked }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Event Notifications */}
            <div>
              <h4 className="font-medium mb-4">Événements à notifier</h4>
              
              <div className="space-y-3">
                {[
                  { key: 'newQuotation', label: 'Nouveau devis reçu', desc: 'Un fournisseur vous envoie un devis' },
                  { key: 'quotationAccepted', label: 'Devis accepté/rejeté', desc: 'Statut changé pour un de vos devis' },
                  { key: 'orderUpdate', label: 'Mise à jour de commande', desc: 'Changement de statut d\'une commande' },
                  { key: 'newMessage', label: 'Nouveau message', desc: 'Un fournisseur vous contacte' },
                  { key: 'newProductAlert', label: 'Nouveaux produits', desc: 'Un fournisseur suivi publie de nouveaux produits' },
                  { key: 'promotionalEmails', label: 'Offres promotionnelles', desc: 'Promotions et offres spéciales' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <Switch 
                      checked={mockNotifications[item.key as keyof typeof mockNotifications]}
                      onCheckedChange={(checked) => setMockNotifications(prev => ({ ...prev, [item.key]: checked }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les Préférences
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Section */}
      {activeSection === 'security' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Changer le Mot de Passe</CardTitle>
              <CardDescription>Mettez à jour votre mot de passe régulièrement pour sécuriser votre compte</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline"
                onClick={() => setPasswordDialogOpen(true)}
              >
                <Lock className="h-4 w-4 mr-2" />
                Changer le Mot de Passe
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/30">
            <CardHeader>
              <CardTitle className="text-red-800">Zone Dangereuse</CardTitle>
              <CardDescription className="text-red-600">Actions irréversibles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                <div>
                  <p className="font-medium">Désactiver le Compte</p>
                  <p className="text-sm text-gray-500">Votre compte sera temporairement désactivé</p>
                </div>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                  Désactiver
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-red-600">Supprimer le Compte</p>
                  <p className="text-sm text-gray-500">Cette action est définitive et irréversible</p>
                </div>
                <Button variant="destructive">
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Changer le Mot de Passe</DialogTitle>
            <DialogDescription>
              Entrez votre mot de passe actuel et le nouveau
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Minimum 8 caractères"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="••••••••"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleChangePassword}
                disabled={isSaving}
              >
                {isSaving ? 'Changement...' : 'Changer le Mot de Passe'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
