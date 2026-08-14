/**
 * Email Settings / Notification Preferences Page
 * 
 * Allows users to configure:
 * - Toggle each notification type on/off
 * - Email frequency (immediate, daily digest, weekly, off)
 * - Unsubscribe all option
 * - Preview templates
 * 
 * @module app/dashboard/[role]/settings/notifications
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Bell,
  BellOff,
  Save,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
  Eye,
  RefreshCw,
  Shield,
  MessageSquare,
  FileText,
  Package,
  Megaphone,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

interface EmailPreferences {
  emailEnabled: boolean;
  marketingEmails: boolean;
  authEmails: boolean;
  rfqEmails: boolean;
  orderEmails: boolean;
  messageEmails: boolean;
  systemEmails: boolean;
  digestFrequency: string;
}

interface CategoryConfig {
  key: keyof EmailPreferences;
  icon: React.ReactNode;
  title: string;
  description: string;
  examples: string[];
  color: string;
}

// ============================================
// Category Configurations
// ============================================

const categories: CategoryConfig[] = [
  {
    key: 'authEmails',
    icon: <Shield className="h-5 w-5" />,
    title: 'Authentification & Sécurité',
    description: 'Notifications importantes pour la sécurité de votre compte',
    examples: ['Vérification d\'email', 'Réinitialisation du mot de passe', 'Alertes de connexion'],
    color: 'text-purple-600 bg-purple-100',
  },
  {
    key: 'rfqEmails',
    icon: <FileText className="h-5 w-5" />,
    title: 'Demandes de Devis (RFQ)',
    description: 'Notifications liées aux demandes de devis et propositions',
    examples: ['Nouvelles RFQ correspondantes', 'Devis reçus', 'RFQ attribuées'],
    color: 'text-blue-600 bg-blue-100',
  },
  {
    key: 'orderEmails',
    icon: <Package className="h-5 w-5" />,
    title: 'Commandes',
    description: 'Mises à jour sur vos commandes en cours',
    examples: ['Confirmation d\'expédition', 'Livraison effectuée', 'Paiement reçu'],
    color: 'text-green-600 bg-green-100',
  },
  {
    key: 'messageEmails',
    icon: <MessageSquare className="h-5 w-5" />,
    title: 'Messages',
    description: 'Alertes pour les nouveaux messages reçus',
    examples: ['Nouveaux messages', 'Mentions'],
    color: 'text-orange-600 bg-orange-100',
  },
  {
    key: 'systemEmails',
    icon: <Settings className="h-5 w-5" />,
    title: 'Système',
    description: 'Notifications système et mises à jour de plateforme',
    examples: ['Vérification entreprise', 'Annonces plateforme', 'Rappels inactivité'],
    color: 'text-gray-600 bg-gray-100',
  },
];

const frequencyOptions = [
  { value: 'immediate', label: 'Immédiate', description: 'Recevez chaque notification dès qu\'elle survient' },
  { value: 'daily', label: 'Quotidien (Digest)', description: 'Récapitulatif quotidien à 9h' },
  { value: 'weekly', label: 'Hebdomadaire (Digest)', description: 'Récapitulatif hebdomadaire le lundi' },
  { value: 'off', label: 'Désactivé', description: 'Ne recevoir aucun email de cette catégorie' },
];

// ============================================
// Main Page Component
// ============================================

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // State
  const [preferences, setPreferences] = useState<EmailPreferences>({
    emailEnabled: true,
    marketingEmails: true,
    authEmails: true,
    rfqEmails: true,
    orderEmails: true,
    messageEmails: false,
    systemEmails: true,
    digestFrequency: 'immediate',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  // Fetch preferences
  useEffect(() => {
    if (status === 'authenticated') {
      fetchPreferences();
    }
  }, [status]);

  async function fetchPreferences() {
    try {
      const response = await fetch('/api/email/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  }

  // Update handler
  const handleToggle = (key: keyof EmailPreferences) => {
    if (key === 'emailEnabled') {
      setPreferences(prev => ({ ...prev, emailEnabled: !prev.emailEnabled }));
    } else if (key === 'marketingEmails') {
      setPreferences(prev => ({ ...prev, marketingEmails: !prev.marketingEmails }));
    } else {
      setPreferences(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    }
    setSaved(false);
  };

  // Save handler
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/email/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  // Preview template
  const handlePreview = async (templateType: string) => {
    setPreviewTemplate(templateType);
    
    try {
      const response = await fetch(`/api/email/preview?type=${templateType}`);
      if (response.ok) {
        const data = await response.json();
        setPreviewHtml(data.html);
      }
    } catch (err) {
      console.error('Error loading preview:', err);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Bell className="h-7 w-7 text-primary" />
          Paramètres de Notifications
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez comment et quand vous recevez les notifications par email.
        </p>
      </div>

      {/* Success/Error Messages */}
      {saved && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-3 p-4">
            <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span className="text-green-800">Préférences sauvegardées avec succès !</span>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span className="text-red-800">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Global Email Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {preferences.emailEnabled ? (
                  <Mail className="h-5 w-5 text-primary" />
                ) : (
                  <Mail className="h-5 w-5 text-muted-foreground" />
                )}
                Notifications par Email
              </CardTitle>
              <CardDescription>
                Activez ou désactivez toutes les notifications par email
              </CardDescription>
            </div>
            <Switch
              checked={preferences.emailEnabled}
              onCheckedChange={() => handleToggle('emailEnabled')}
            />
          </div>
        </CardHeader>
        
        {preferences.emailEnabled && (
          <CardContent className="pt-0 space-y-6">
            <Separator />
            
            {/* Digest Frequency */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Fréquence des emails non critiques</Label>
              <Select
                value={preferences.digestFrequency}
                onValueChange={(value) => {
                  setPreferences(prev => ({ ...prev, digestFrequency: value }));
                  setSaved(false);
                }}
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="py-1">
                        <span className="font-medium">{option.label}</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <p className="text-sm text-muted-foreground">
                Les emails de sécurité (authentification) sont toujours envoyés immédiatement.
              </p>
            </div>

            <Separator />

            {/* Marketing Emails */}
            <div className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-pink-500" />
                  <Label className="font-medium">Emails marketing et promotions</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Recevez des offres spéciales, nouveautés produits et actualités
                </p>
              </div>
              <Switch
                checked={preferences.marketingEmails}
                onCheckedChange={() => handleToggle('marketingEmails')}
              />
            </div>
          </CardContent>
        )}
        
        {!preferences.emailEnabled && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
              <BellOff className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Toutes les notifications email sont désactivées</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Vous continuerez à recevoir les notifications dans l'application. 
                  Les emails de sécurité critique peuvent toujours être envoyés.
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Category-specific Toggles */}
      {preferences.emailEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notifications par Catégorie</CardTitle>
            <CardDescription>
              Choisissez quelles catégories de notifications vous souhaitez recevoir par email
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {categories.map((category, index) => (
              <div key={category.key}>
                {index > 0 && <Separator />}
                
                <div className="flex items-start justify-between py-4 gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                      category.color.split(' ')[1]
                    )}>
                      <div className={category.color.split(' ')[0]}>
                        {category.icon}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="font-medium cursor-pointer" onClick={() => handleToggle(category.key)}>
                        {category.title}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {category.examples.map(example => (
                          <Badge key={example} variant="secondary" className="text-xs">
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <Switch
                    checked={preferences[category.key] as boolean}
                    onCheckedChange={() => handleToggle(category.key)}
                    className="mt-1"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Template Previews */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Prévisualiser les Templates d'Email
              </CardTitle>
              <CardDescription>
                Voyez à quoi ressemblent nos emails avant de les activer
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { type: 'welcome_buyer', label: 'Bienvenue Acheteur' },
              { type: 'welcome_supplier', label: 'Bienvenue Fournisseur' },
              { type: 'email_verification', label: 'Vérification Email' },
              { type: 'password_reset', label: 'Réinitialisation MDP' },
              { type: 'new_rfq', label: 'Nouvelle RFQ' },
              { type: 'quotation_received', label: 'Devis Reçu' },
              { type: 'order_confirmed', label: 'Commande Confirmée' },
              { type: 'order_shipped', label: 'Commande Expédiée' },
              { type: 'company_verification_approved', label: 'Vérification Approuvée' },
              { type: 'company_verification_rejected', label: 'Vérification Refusée' },
            ].map(template => (
              <Dialog key={template.type}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-3 px-4"
                    onClick={() => handlePreview(template.type)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate text-left">{template.label}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{template.label}</DialogTitle>
                    <DialogDescription>
                      Prévisualisation du template d'email
                    </DialogDescription>
                  </DialogHeader>
                  
                  {previewTemplate === template.type ? (
                    <div className="border rounded-lg overflow-hidden bg-white">
                      <iframe
                        srcDoc={previewHtml}
                        className="w-full h-[600px]"
                        title={`${template.label} Preview`}
                        sandbox="allow-same-origin"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] bg-muted rounded-lg">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end sticky bottom-4 z-10">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={saving}
          className="min-w-[160px]"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sauvegarde...
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Sauvegardé !
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder les préférences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
