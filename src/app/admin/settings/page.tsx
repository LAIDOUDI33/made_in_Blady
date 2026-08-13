'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Globe,
  UserPlus,
  CreditCard,
  Bell,
  Shield,
  Wrench,
  Save,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

// Types for settings
interface PlatformSettings {
  // General
  platformName: string;
  supportEmail: string;
  defaultCurrency: string;
  enabledLanguages: string[];
  
  // Registration
  requireEmailVerification: boolean;
  autoApproveBuyers: boolean;
  requireSupplierVerification: boolean;
  allowedDomains: string;
  
  // Commissions
  commissionPercentage: number;
  paymentMethods: string[];
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  orderNotifications: boolean;
  rfqNotifications: boolean;
  marketingEmails: boolean;
  
  // Security
  passwordMinLength: number;
  sessionTimeout: number;
  require2FAForAdmins: boolean;
  
  // Maintenance
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
    // General
    platformName: 'AlgeriaTrade.dz',
    supportEmail: 'contact@algeriatrade.dz',
    defaultCurrency: 'DZD',
    enabledLanguages: ['fr', 'ar'],
    
    // Registration
    requireEmailVerification: true,
    autoApproveBuyers: true,
    requireSupplierVerification: true,
    allowedDomains: '',
    
    // Commissions
    commissionPercentage: 5,
    paymentMethods: ['bank_transfer', 'ccp'],
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    orderNotifications: true,
    rfqNotifications: true,
    marketingEmails: false,
    
    // Security
    passwordMinLength: 8,
    sessionTimeout: 30,
    require2FAForAdmins: false,
    
    // Maintenance
    maintenanceMode: false,
    maintenanceMessage: 'Nous effectuons une mise à jour. Revenez bientôt !',
  });

  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    setSaveSuccess(true);
    
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    // Reset to defaults would go here
    console.log('Reset settings to defaults');
  };

  const updateSetting = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: 'enabledLanguages' | 'paymentMethods', item: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: prev[key].includes(item)
        ? prev[key].filter(i => i !== item)
        : [...prev[key], item]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres de la Plateforme</h1>
          <p className="text-gray-500 mt-1">Configurez les paramètres globaux d&apos;AlgeriaTrade</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className={`mr-2 h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Success message */}
      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <span className="text-lg">✓</span>
          <span>Paramètres sauvegardés avec succès</span>
        </div>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="general" className="gap-1 hidden sm:flex">
            <Globe className="h-4 w-4" /> Général
          </TabsTrigger>
          <TabsTrigger value="general" className="sm:hidden">Général</TabsTrigger>
          
          <TabsTrigger value="registration" className="gap-1 hidden sm:flex">
            <UserPlus className="h-4 w-4" /> Inscription
          </TabsTrigger>
          <TabsTrigger value="registration" className="sm:hidden">Inscription</TabsTrigger>
          
          <TabsTrigger value="commissions" className="gap-1 hidden sm:flex">
            <CreditCard className="h-4 w-4" /> Commissions
          </TabsTrigger>
          <TabsTrigger value="commissions" className="sm:hidden">Commissions</TabsTrigger>
          
          <TabsTrigger value="notifications" className="gap-1 hidden sm:flex">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="notifications" className="sm:hidden">Notifs</TabsTrigger>
          
          <TabsTrigger value="security" className="gap-1 hidden sm:flex">
            <Shield className="h-4 w-4" /> Sécurité
          </TabsTrigger>
          <TabsTrigger value="security" className="sm:hidden">Sécurité</TabsTrigger>
          
          <TabsTrigger value="maintenance" className="gap-1 hidden sm:flex">
            <Wrench className="h-4 w-4" /> Maintenance
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="sm:hidden">Maint.</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" /> Paramètres généraux
              </CardTitle>
              <CardDescription>
                Informations de base de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Nom de la plateforme</Label>
                  <Input
                    id="platform-name"
                    value={settings.platformName}
                    onChange={(e) => updateSetting('platformName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Email de support</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => updateSetting('supportEmail', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise par défaut</Label>
                  <Select 
                    value={settings.defaultCurrency} 
                    onValueChange={(value) => updateSetting('defaultCurrency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DZD">Dinar Algérien (DZD)</SelectItem>
                      <SelectItem value="USD">US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Langues activées</Label>
                  <div className="flex items-center gap-3 pt-2">
                    <Badge 
                      variant={settings.enabledLanguages.includes('fr') ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem('enabledLanguages', 'fr')}
                    >
                      🇫🇷 Français
                    </Badge>
                    <Badge 
                      variant={settings.enabledLanguages.includes('ar') ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem('enabledLanguages', 'ar')}
                    >
                      🇩🇿 العربية
                    </Badge>
                    <Badge 
                      variant={settings.enabledLanguages.includes('en') ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem('enabledLanguages', 'en')}
                    >
                      🇬🇧 English
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registration Settings */}
        <TabsContent value="registration" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" /> Paramètres d&apos;inscription
              </CardTitle>
              <CardDescription>
                Configurez le processus d&apos;inscription des utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Vérification email requise</p>
                    <p className="text-sm text-gray-500">Les nouveaux utilisateurs doivent vérifier leur email</p>
                  </div>
                  <Switch
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(checked) => updateSetting('requireEmailVerification', checked)}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Auto-approuver les acheteurs</p>
                    <p className="text-sm text-gray-500">Les comptes acheteurs sont activés automatiquement</p>
                  </div>
                  <Switch
                    checked={settings.autoApproveBuyers}
                    onCheckedChange={(checked) => updateSetting('autoApproveBuyers', checked)}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Vérification fournisseur obligatoire</p>
                    <p className="text-sm text-gray-500">Les fournisseurs doivent être vérifiés avant de vendre</p>
                  </div>
                  <Switch
                    checked={settings.requireSupplierVerification}
                    onCheckedChange={(checked) => updateSetting('requireSupplierVerification', checked)}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="allowed-domains">Domaines autorisés (optionnel)</Label>
                  <Input
                    id="allowed-domains"
                    placeholder="ex: entreprise.dz, .gov.dz (laisser vide pour tous)"
                    value={settings.allowedDomains}
                    onChange={(e) => updateSetting('allowedDomains', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Restreindre l&apos;inscription à certains domaines email. Un domaine par ligne.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission Settings */}
        <TabsContent value="commissions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Commissions & Paiements
              </CardTitle>
              <CardDescription>
                Configurez les commissions et méthodes de paiement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="commission">Commission plateforme (%)</Label>
                  <Input
                    id="commission"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={settings.commissionPercentage}
                    onChange={(e) => updateSetting('commissionPercentage', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-gray-500">
                    Pourcentage prélevé sur chaque transaction
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Méthodes de paiement acceptées</Label>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {[
                      { key: 'bank_transfer', label: 'Virement bancaire' },
                      { key: 'ccp', label: 'CCP (Compte Chèque Postal)' },
                      { key: 'baridi_mob', label: 'Baridimob' },
                      { key: 'cib', label: 'CIB (Carte)' },
                    ].map(method => (
                      <Badge
                        key={method.key}
                        variant={settings.paymentMethods.includes(method.key) ? 'default' : 'outline'}
                        className="cursor-pointer py-1.5 px-3"
                        onClick={() => toggleArrayItem('paymentMethods', method.key)}
                      >
                        {method.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">💡 Information</h4>
                <p className="text-sm text-blue-700">
                  Les commissions sont calculées sur le montant total de la commande hors frais de livraison.
                  Les paiements sont actuellement gérés manuellement entre acheteur et fournisseur.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" /> Paramètres des notifications
              </CardTitle>
              <CardDescription>
                Gérez comment et quand les notifications sont envoyées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Notifications par email</p>
                    <p className="text-sm text-gray-500">Envoyer les notifications par email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Notifications push</p>
                    <p className="text-sm text-gray-500">Notifications push dans le navigateur</p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Notifications de commandes</p>
                    <p className="text-sm text-gray-500">Alertes pour nouvelles commandes</p>
                  </div>
                  <Switch
                    checked={settings.orderNotifications}
                    onCheckedChange={(checked) => updateSetting('orderNotifications', checked)}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Notifications RFQ</p>
                    <p className="text-sm text-gray-500">Alertes pour nouveaux appels d&apos;offre</p>
                  </div>
                  <Switch
                    checked={settings.rfqNotifications}
                    onCheckedChange={(checked) => updateSetting('rfqNotifications', checked)}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Emails marketing</p>
                    <p className="text-sm text-gray-500">Promotions et newsletters</p>
                  </div>
                  <Switch
                    checked={settings.marketingEmails}
                    onCheckedChange={(checked) => updateSetting('marketingEmails', checked)}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> SMS Gateway
                </h4>
                <p className="text-sm text-yellow-700">
                  L&apos;envoi de SMS sera disponible dans une future version. 
                  Configuration du gateway SMS à venir.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Paramètres de sécurité
              </CardTitle>
              <CardDescription>
                Configurez les politiques de sécurité de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password-length">Longueur minimale du mot de passe</Label>
                  <Input
                    id="password-length"
                    type="number"
                    min="6"
                    max="32"
                    value={settings.passwordMinLength}
                    onChange={(e) => updateSetting('passwordMinLength', parseInt(e.target.value) || 8)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Délai d&apos;expiration de session (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    min="15"
                    max="1440"
                    value={settings.sessionTimeout}
                    onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value) || 30)}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-red-800">2FA obligatoire pour les admins</p>
                  <p className="text-sm text-red-600">
                    Les administrateurs doivent activer l&apos;authentification à deux facteurs
                  </p>
                </div>
                <Switch
                  checked={settings.require2FAForAdmins}
                  onCheckedChange={(checked) => updateSetting('require2FAForAdmins', checked)}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <h4 className="font-medium">Politique de mot de passe recommandée</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Au moins {settings.passwordMinLength} caractères</li>
                  <li>Au moins une majuscule et une minuscule</li>
                  <li>Au moins un chiffre</li>
                  <li>Au moins un caractère spécial (!@#$%^&*)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Mode */}
        <TabsContent value="maintenance" className="mt-6">
          <Card className={settings.maintenanceMode ? 'border-yellow-300 bg-yellow-50/20' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" /> Mode maintenance
              </CardTitle>
              <CardDescription>
                Mettez la plateforme en mode maintenance pour les mises à jour
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="font-medium text-yellow-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Activer le mode maintenance
                  </p>
                  <p className="text-sm text-yellow-600">
                    La plateforme sera inaccessible aux utilisateurs non-administrateurs
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                  className="data-[state=checked]:bg-yellow-500"
                />
              </div>

              {settings.maintenanceMode && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="maintenance-message">Message de maintenance</Label>
                    <Textarea
                      id="maintenance-message"
                      placeholder="Message affiché aux visiteurs pendant la maintenance..."
                      value={settings.maintenanceMessage}
                      onChange={(e) => updateSetting('maintenanceMessage', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-700">
                      ⚠️ Le mode maintenance est actuellement <strong>ACTIF</strong>. 
                      Seuls les administrateurs peuvent accéder à la plateforme.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
