'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Home,
  Building2,
  Briefcase
} from 'lucide-react';

// Algerian Wilayas
const wilayas = [
  'Adrar (01)', 'Chlef (02)', 'Laghouat (03)', 'Oum El Bouaghi (04)',
  'Batna (05)', 'Béjaïa (06)', 'Biskra (07)', 'Béchar (08)',
  'Blida (09)', 'Bouira (10)', 'Tamanrasset (11),', 'Tébessa (12)',
  'Tlemcen (13)', 'Tiaret (14)', 'Tizi Ouzou (15)', 'Alger (16)',
  'Djelfa (17)', 'Jijel (18)', 'Sétif (19)', 'Saïda (20)',
  'Skikda (21)', 'Sidi Bel Abbès (22)', 'Annaba (23)', 'Guelma (24)',
  'Constantine (25)', 'Médéa (26)', 'Mostaganem (27)', 'M\'sila (28)',
  'Mascara (29),', 'Ouargla (30)', 'Oran (31)', 'El Bayadh (32)',
  'Illizi (33)', 'Bordj Bou Arréridj (34)', 'Boumerdès (35)', 'El Tarf (36)',
  'Tindouf (37)', 'Tissemsilt (38)', 'El Oued (39)', 'Khenchela (40)',
  'Souk Ahras (41)', 'Tipaza (42)', 'Mila (43),', 'Aïn Defla (44)',
  'Naâma (45)', 'Aïn Témouchent (46)', 'Ghardaïa (47)', 'Relizane (48)'
];

export interface AddressData {
  id: string;
  label: string; // Domicile, Bureau, Chantier, etc.
  type: 'home' | 'work' | 'other';
  fullName: string;
  phone: string;
  street: string;
  commune?: string;
  wilaya: string;
  instructions?: string;
  isDefault: boolean;
}

interface AddressFormProps {
  address?: AddressData | null;
  onSave: (address: Omit<AddressData, 'id'>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

// Get icon for address type
const getAddressIcon = (type: string) => {
  switch (type) {
    case 'home': return <Home className="h-5 w-5" />;
    case 'work': return <Briefcase className="h-5 w-5" />;
    default: return <Building2 className="h-5 w-5" />;
  }
};

export function AddressForm({ address, onSave, onCancel, isLoading }: AddressFormProps) {
  const isEditing = !!address;
  
  const [formData, setFormData] = useState({
    label: address?.label || '',
    type: (address?.type || 'home') as 'home' | 'work' | 'other',
    fullName: address?.fullName || '',
    phone: address?.phone || '',
    street: address?.street || '',
    commune: address?.commune || '',
    wilaya: address?.wilaya || '',
    instructions: address?.instructions || '',
    isDefault: address?.isDefault || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleLabelSelect = (label: string, type: 'home' | 'work' | 'other') => {
    setFormData(prev => ({ ...prev, label, type }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-5 w-5 text-green-600" />
          {isEditing ? 'Modifier l\'Adresse' : 'Nouvelle Adresse'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Address Type Quick Select */}
          <div className="space-y-2">
            <Label>Type d&apos;adresse</Label>
            <div className="flex gap-2">
              {[
                { label: 'Domicile', type: 'home' as const },
                { label: 'Bureau', type: 'work' as const },
                { label: 'Autre', type: 'other' as const }
              ].map((option) => (
                <Button
                  key={option.type}
                  type="button"
                  variant={formData.type === option.type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleLabelSelect(option.label, option.type)}
                  className={cn(
                    formData.type === option.type && 'bg-green-600 hover:bg-green-700'
                  )}
                >
                  {getAddressIcon(option.type)}
                  <span className="ml-1">{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Full Name & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet *</Label>
              <Input
                id="fullName"
                placeholder="Ex: Ahmed Benali"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+213 XXX XXX XXX"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Street Address */}
          <div className="space-y-2">
            <Label htmlFor="street">Adresse *</Label>
            <Input
              id="street"
              placeholder="Ex: 123 Rue de la Liberté, Niveau 2, Appt 5"
              value={formData.street}
              onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
              required
            />
          </div>

          {/* Commune & Wilaya */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commune">Commune</Label>
              <Input
                id="commune"
                placeholder="Ex: Bab El Oued"
                value={formData.commune}
                onChange={(e) => setFormData(prev => ({ ...prev, commune: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Wilaya *</Label>
              <Select value={formData.wilaya} onValueChange={(value) => setFormData(prev => ({ ...prev, wilaya: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez la wilaya" />
                </SelectTrigger>
                <SelectContent>
                  {wilayas.map((wilaya) => (
                    <SelectItem key={wilaya} value={wilaya}>{wilaya}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Delivery Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions de livraison</Label>
            <Textarea
              id="instructions"
              placeholder="Ex: Sonner à l'interphone B12, livrer après 14h..."
              rows={2}
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
            />
          </div>

          {/* Default Address Toggle */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
              className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <Label htmlFor="isDefault" className="cursor-pointer">
              Définir comme adresse par défaut pour les livraisons
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            )}
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Address Card Component for displaying saved addresses
export function AddressCard({ 
  address, 
  onEdit, 
  onDelete, 
  onSetDefault 
}: { 
  address: AddressData;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSetDefault?: (id: string) => void;
}) {
  return (
    <Card className={cn(
      'transition-all duration-200',
      address.isDefault && 'border-green-200 bg-green-50/30'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn(
              'p-2 rounded-lg flex-shrink-0',
              address.isDefault ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
            )}>
              {getAddressIcon(address.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900">{address.label}</h4>
                {address.isDefault && (
                  <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                    Par défaut
                  </Badge>
                )}
              </div>
              
              <p className="text-sm font-medium text-gray-800">{address.fullName}</p>
              
              <p className="text-sm text-gray-600 mt-1">{address.street}</p>
              
              {(address.commune || address.wilaya) && (
                <p className="text-sm text-gray-500">
                  {[address.commune, address.wilaya].filter(Boolean).join(', ')}
                </p>
              )}
              
              <p className="text-sm text-gray-500 mt-1">📞 {address.phone}</p>
              
              {address.instructions && (
                <p className="text-xs text-gray-400 mt-2 italic bg-gray-50 p-2 rounded">
                  💡 {address.instructions}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-start gap-1 flex-shrink-0">
            {!address.isDefault && onSetDefault && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => onSetDefault(address.id)}
                title="Définir par défaut"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            
            {onEdit && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                onClick={() => onEdit(address.id)}
                title="Modifier"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
            
            {onDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => onDelete(address.id)}
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
