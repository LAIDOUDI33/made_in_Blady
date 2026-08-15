'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  ClipboardCheck,
  CalendarDays,
  MapPin,
  FileText,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Info,
  Search,
  Loader2,
  ChevronRight,
  Shield,
  Truck,
  Package,
  Microscope,
  Scale,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export type InspectionType =
  | 'quality'
  | 'quantity'
  | 'packaging'
  | 'loading'
  | 'pre-shipment'
  | 'during-production'
  | 'full-inspection'
  | 'custom';

export type BookingStatus = 'draft' | 'pending' | 'confirmed' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface InspectionService {
  id: string;
  name: string;
  type: InspectionType;
  description: string;
  basePrice: number;
  currency?: string;
  estimatedDuration: string; // e.g., "2-4 hours"
  requirements?: string[];
  includes?: string[];
  icon?: React.ReactNode;
}

export interface InspectionBookingData {
  serviceId: string;
  companyId?: string;
  productId?: string;
  preferredDate: Date | undefined;
  preferredTimeSlot?: string;
  address: string;
  wilayaCode?: string;
  city?: string;
  specialInstructions?: string;
  contactPhone?: string;
  urgent?: boolean;
}

interface InspectionBookingProps {
  services: InspectionService[];
  companyId?: string;
  productId?: string;
  onBook?: (bookingData: InspectionBookingData) => void;
  currency?: string;
  className?: string;
  initialStatus?: BookingStatus;
  isLoading?: boolean;
}

// Inspection type configuration
const inspectionTypeConfig: Record<InspectionType, { label: string; icon: React.ReactNode; color: string }> = {
  quality: { label: 'Contrôle Qualité', icon: <Microscope className="h-5 w-5" />, color: 'bg-blue-100 text-blue-700' },
  quantity: { label: 'Vérification Quantité', icon: <Scale className="h-5 w-5" />, color: 'bg-green-100 text-green-700' },
  packaging: { label: 'Contrôle Emballage', icon: <Package className="h-5 w-5" />, color: 'bg-orange-100 text-orange-700' },
  loading: { label: 'Contrôle Chargement', icon: <Truck className="h-5 w-5" />, color: 'bg-purple-100 text-purple-700' },
  'pre-shipment': { label: 'Pre-Shipment (PSI)', icon: <ClipboardCheck className="h-5 w-5" />, color: 'bg-red-100 text-red-700' },
  'during-production': { label: 'En Cours de Production', icon: <Eye className="h-5 w-5" />, color: 'bg-yellow-100 text-yellow-700' },
  'full-inspection': { label: 'Inspection Complète', icon: <Shield className="h-5 w-5" />, color: 'bg-indigo-100 text-indigo-700' },
  custom: { label: 'Inspection Personnalisée', icon: <FileText className="h-5 w-5" />, color: 'bg-gray-100 text-gray-700' },
};

// Status configuration
const statusConfig: Record<BookingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  draft: { label: 'Brouillon', variant: 'outline', color: 'text-gray-600' },
  pending: { label: 'En attente', variant: 'secondary', color: 'text-yellow-600' },
  confirmed: { label: 'Confirmé', variant: 'default', color: 'text-blue-600' },
  scheduled: { label: 'Programmé', variant: 'default', color: 'text-green-600' },
  'in-progress': { label: 'En cours', variant: 'default', color: 'text-purple-600' },
  completed: { label: 'Terminé', variant: 'default', color: 'text-green-700' },
  cancelled: { label: 'Annulé', variant: 'destructive', color: 'text-red-600' },
};

// Time slots
const timeSlots = [
  { value: '08:00-10:00', label: '08:00 - 10:00' },
  { value: '10:00-12:00', label: '10:00 - 12:00' },
  { value: '13:00-15:00', label: '13:00 - 15:00' },
  { value: '15:00-17:00', label: '15:00 - 17:00' },
];

// Algerian Wilayas (first 10 for demo)
const wilayas = [
  { code: '16', name: 'Alger' },
  { code: '31', name: 'Oran' },
  { code: '13', name: 'Tizi Ouzou' },
  { code: '25', name: 'Constantine' },
  { code: '40', name: 'Sétif' },
  { code: '28', name: 'M\'sila' },
  { code: '43', name: 'Skikda' },
  { code: '19', name: 'Sidi Bel Abbès' },
  { code: '09', name: 'Batna' },
  { code: '29', name: 'Biskra' },
  { code: '34', name: 'Bouira' },
  { code: '15', name: 'Tlemcen' },
  { code: '30', name: 'Wahrane' },
  { code: '44', name: 'Souk Ahras' },
  { code: '12', name: 'Annaba' },
];

// Format currency
function formatCurrency(amount: number, currency: string = 'DZD'): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: currency === 'DZD' ? 'DZD' : currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  })
    .format(amount)
    .replace('DZD', 'DA')
    .trim();
}

export default function InspectionBooking({
  services,
  companyId,
  productId,
  onBook,
  currency = 'DZD',
  className,
  initialStatus = 'draft',
  isLoading = false,
}: InspectionBookingProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [formData, setFormData] = useState<InspectionBookingData>({
    serviceId: '',
    companyId,
    productId,
    preferredDate: undefined,
    address: '',
    specialInstructions: '',
    urgent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCalendar, setShowCalendar] = useState(false);

  // Get selected service
  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId),
    [services, selectedServiceId]
  );

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!selectedService) return 0;
    let price = selectedService.basePrice;
    if (formData.urgent) price *= 1.5; // 50% surcharge for urgent
    return price;
  }, [selectedService, formData.urgent]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedServiceId) {
      newErrors.serviceId = 'Veuillez sélectionner un service d\'inspection';
    }
    if (!formData.preferredDate) {
      newErrors.preferredDate = 'Veuillez sélectionner une date';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'L\'adresse est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle booking submission
  const handleBook = () => {
    if (!validateForm()) return;

    const bookingData: InspectionBookingData = {
      ...formData,
      serviceId: selectedServiceId,
    };

    onBook?.(bookingData);
  };

  // Update form data
  const updateFormData = (field: keyof InspectionBookingData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Check if date is valid (not in the past)
  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  if (services.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Réserver une Inspection
            </CardTitle>
            <Badge
              variant={
                initialStatus === 'completed' || initialStatus === 'confirmed'
                  ? 'default'
                  : initialStatus === 'cancelled'
                  ? 'destructive'
                  : 'secondary'
              }
              className="gap-1"
            >
              {statusConfig[initialStatus].label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Sélectionnez un service d&apos;inspection et complétez les détails pour programmer votre visite.
          </p>
        </CardHeader>

        <CardContent className="pt-0 space-y-6">
          {/* Service Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Service d&apos;Inspection <span className="text-destructive">*</span>
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.map((service) => {
                const config = inspectionTypeConfig[service.type];
                const isSelected = selectedServiceId === service.id;

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      setSelectedServiceId(service.id);
                      updateFormData('serviceId', service.id);
                    }}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/30 bg-card'
                    )}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div
                        className={cn(
                          'p-2 rounded-lg',
                          config.color
                        )}
                      >
                        {service.icon ?? config.icon}
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </div>

                    <h4 className="font-medium text-sm mb-1">{service.name}</h4>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {service.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-primary">
                        {formatCurrency(service.basePrice, currency)}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {service.estimatedDuration}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {errors.serviceId && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.serviceId}
              </p>
            )}
          </div>

          {/* Selected Service Details */}
          {selectedService && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Détails du service: {selectedService.name}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {selectedService.includes && selectedService.includes.length > 0 && (
                  <div>
                    <p className="font-medium text-green-700 mb-1">Ce service inclut:</p>
                    <ul className="space-y-1">
                      {selectedService.includes.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedService.requirements && selectedService.requirements.length > 0 && (
                  <div>
                    <p className="font-medium text-orange-700 mb-1">Requis:</p>
                    <ul className="space-y-1">
                      {selectedService.requirements.map((req, i) => (
                        <li key={i} className="flex items-center gap-2 text-muted-foreground">
                          <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Booking Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date-picker" className="text-base font-semibold">
                Date préférée <span className="text-destructive">*</span>
              </Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    id="date-picker"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.preferredDate && 'text-muted-foreground',
                      errors.preferredDate && 'border-destructive'
                    )}
                    aria-label="Sélectionner la date d'inspection"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {formData.preferredDate ? (
                      formData.preferredDate.toLocaleDateString('fr-DZ', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    ) : (
                      'Sélectionner une date'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.preferredDate}
                    onSelect={(date) => {
                      updateFormData('preferredDate', date);
                      setShowCalendar(false);
                    }}
                    disabled={isDateDisabled}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.preferredDate && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.preferredDate}
                </p>
              )}
            </div>

            {/* Time Slot */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Créneau horaire</Label>
              <Select
                value={formData.preferredTimeSlot}
                onValueChange={(value) => updateFormData('preferredTimeSlot', value)}
              >
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sélectionner un créneau" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location - Wilaya */}
            <div className="space-y-2">
              <Label htmlFor="wilaya" className="text-base font-semibold">
                Wilaya
              </Label>
              <Select
                value={formData.wilayaCode}
                onValueChange={(value) => updateFormData('wilayaCode', value)}
              >
                <SelectTrigger id="wilaya">
                  <MapPin className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sélectionner la wilaya" />
                </SelectTrigger>
                <SelectContent>
                  {wilayas.map((w) => (
                    <SelectItem key={w.code} value={w.code}>
                      {w.code} - {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location - Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-base font-semibold">
                Adresse complète <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                placeholder="Adresse du lieu d'inspection"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                className={cn(errors.address && 'border-destructive')}
                aria-invalid={!!errors.address}
              />
              {errors.address && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.address}
                </p>
              )}
            </div>

            {/* Contact Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base font-semibold">
                Téléphone de contact
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0XXX XX XX XX"
                value={formData.contactPhone || ''}
                onChange={(e) => updateFormData('contactPhone', e.target.value)}
              />
            </div>

            {/* Urgent Request */}
            <div className="space-y-2 flex items-end">
              <Button
                type="button"
                variant={formData.urgent ? 'destructive' : 'outline'}
                className="w-full gap-2"
                onClick={() => updateFormData('urgent', !formData.urgent)}
              >
                <AlertCircle className="h-4 w-4" />
                {formData.urgent ? 'Urgent (+50%)' : 'Marquer comme urgent'}
              </Button>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions" className="text-base font-semibold">
              Instructions spéciales
            </Label>
            <Textarea
              id="instructions"
              placeholder="Précisez toute information supplémentaire pour l'inspecteur..."
              rows={3}
              value={formData.specialInstructions || ''}
              onChange={(e) => updateFormData('specialInstructions', e.target.value)}
            />
          </div>

          <Separator />

          {/* Price Summary & Submit */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total estimé</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(totalPrice, currency)}
                </span>
                {formData.urgent && (
                  <Badge variant="destructive" className="text-xs">
                    Urgence appliquée
                  </Badge>
                )}
              </div>
              {selectedService && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Durée estimée: {selectedService.estimatedDuration}
                </p>
              )}
            </div>

            <Button
              size="lg"
              onClick={handleBook}
              disabled={isLoading}
              className="gap-2 min-w-[160px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Confirmer la réservation
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-muted/50">
            <Shield className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              Tous nos inspecteurs sont certifiés et suivent des protocoles stricts.
              Un rapport détaillé vous sera fourni dans les 24 heures suivant l&apos;inspection.
            </p>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// Export types
export type { InspectionBookingProps, InspectionBookingData };
