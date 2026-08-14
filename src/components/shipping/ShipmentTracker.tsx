'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Navigation,
  ExternalLink,
  Phone,
  Mail,
  FileText,
  Download,
  Copy,
  RefreshCw,
  Bell,
  BellOff,
  ChevronRight,
  Warehouse,
  Route,
  Home,
  ClipboardCheck,
  Box,
  Ship,
  Plane,
  Train,
  ArrowRight,
  Calendar,
  User,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export type ShipmentStatus =
  | 'created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed_delivery'
  | 'returned'
  | 'exception'
  | 'cancelled';

export type TransportMode = 'road' | 'air' | 'sea' | 'rail' | 'multimodal';

export interface TrackingEvent {
  id: string;
  status: ShipmentStatus;
  timestamp: string;
  location?: string;
  description: string;
  details?: string;
  coordinates?: { lat: number; lng: number };
}

export interface CarrierInfo {
  name: string;
  logo?: string;
  phone?: string;
  email?: string;
  website?: string;
  trackingUrl?: string;
}

export interface ShipmentData {
  id: string;
  trackingNumber: string;
  orderNumber?: string;
  status: ShipmentStatus;
  carrier: CarrierInfo;
  origin: {
    address: string;
    city: string;
    wilayaCode: string;
    country?: string;
  };
  destination: {
    address: string;
    city: string;
    wilayaCode: string;
    country?: string;
    contactName?: string;
    contactPhone?: string;
  };
  transportMode: TransportMode;
  estimatedDelivery?: string;
  actualDelivery?: string;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  packageCount?: number;
  signatureRequired?: boolean;
  insuranceValue?: number;
  currency?: string;
  trackingEvents: TrackingEvent[];
  createdAt: string;
  updatedAt: string;
}

interface ShipmentTrackerProps {
  shipment: ShipmentData;
  className?: string;
  onRefresh?: () => void;
  onNotifyToggle?: (enabled: boolean) => void;
  onDownloadReceipt?: (shipmentId: string) => void;
  isRefreshing?: boolean;
}

// Status configuration
const statusConfig: Record<ShipmentStatus, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  isTerminal: boolean;
}> = {
  created: {
    label: 'Créé',
    description: 'La commande a été créée',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: <Package className="h-5 w-5" />,
    isTerminal: false,
  },
  picked_up: {
    label: 'Ramassé',
    description: 'Le colis a été ramassé par le transporteur',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: <Box className="h-5 w-5" />,
    isTerminal: false,
  },
  in_transit: {
    label: 'En transit',
    description: 'Le colis est en route vers sa destination',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    icon: <Truck className="h-5 w-5" />,
    isTerminal: false,
  },
  out_for_delivery: {
    label: 'En cours de livraison',
    description: 'Le colis est chez le livreur pour livraison',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: <Route className="h-5 w-5" />,
    isTerminal: false,
  },
  delivered: {
    label: 'Livré',
    description: 'Le colis a été livré avec succès',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: <CheckCircle2 className="h-5 w-5" />,
    isTerminal: true,
  },
  failed_delivery: {
    label: 'Échec de livraison',
    description: 'La livraison a échoué, nouvelle tentative prévue',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: <AlertCircle className="h-5 w-5" />,
    isTerminal: false,
  },
  returned: {
    label: 'Retourné',
    description: 'Le colis a été retourné à l\'expéditeur',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: <Package className="h-5 w-5" />,
    isTerminal: true,
  },
  exception: {
    label: 'Exception',
    description: 'Un problème est survenu avec cette expédition',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: <AlertCircle className="h-5 w-5" />,
    isTerminal: false,
  },
  cancelled: {
    label: 'Annulé',
    description: 'Cette expédition a été annulée',
    color: 'text-gray-500',
    bgColor: 'bg-gray-200',
    icon: <Circle className="h-5 w-5" />,
    isTerminal: true,
  },
};

// Transport mode configuration
const transportConfig: Record<TransportMode, { label: string; icon: React.ReactNode }> = {
  road: { label: 'Routier', icon: <Truck className="h-4 w-4" /> },
  air: { label: 'Aérien', icon: <Plane className="h-4 w-4" /> },
  sea: { label: 'Maritime', icon: <Ship className="h-4 w-4" /> },
  rail: { label: 'Ferroviaire', icon: <Train className="h-4 w-4" /> },
  multimodal: { label: 'Multimodal', icon: <Route className="h-4 w-4" /> },
};

// Status flow for timeline
const statusFlow: ShipmentStatus[] = [
  'created',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
];

// Get current step index
function getCurrentStepIndex(status: ShipmentStatus): number {
  if (status === 'delivered') return 4;
  if (status === 'out_for_delivery') return 3;
  if (status === 'in_transit') return 2;
  if (status === 'picked_up') return 1;
  if (status === 'created') return 0;
  
  // Exceptional statuses
  if (status === 'failed_delivery') return 3;
  if (status === 'returned' || status === 'exception' || status === 'cancelled') return -1;
  
  return 0;
}

// Format date
function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    // Show relative time for recent events
    if (diffHours < 1) return "À l'instant";
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('fr-DZ', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

// Format full date
function formatDateFull(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('fr-DZ', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

// Timeline node component
function TimelineNode({
  event,
  index,
  isFirst,
  isLast,
  isActive,
}: {
  event: TrackingEvent;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isActive: boolean;
}) {
  const config = statusConfig[event.status];
  const IconComponent = config.icon;

  return (
    <div className={cn('flex gap-4', !isLast && 'pb-8')}>
      {/* Timeline line and dot */}
      <div className="flex flex-col items-center">
        {/* Dot */}
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0 border-2 transition-all duration-300',
            isActive
              ? cn(config.bgColor, config.color.replace('text-', 'border-'))
              : 'bg-white border-gray-300 text-gray-400'
          )}
        >
          {isActive ? (
            <span className={config.color}>{IconComponent}</span>
          ) : (
            <Circle className="h-3 w-3 fill-current" />
          )}
        </div>

        {/* Line */}
        {!isLast && (
          <div
            className={cn(
              'w-0.5 flex-1 min-h-[40px]',
              isActive ? 'bg-primary/30' : 'bg-gray-200'
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1 pb-1', isFirst && '-mt-1')}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className={cn('font-medium', isActive ? 'text-gray-900' : 'text-gray-600')}>
              {config.label}
            </p>
            
            {event.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </p>
            )}

            <p className="text-sm text-gray-600 mt-1">{event.description}</p>

            {event.details && (
              <p className="text-xs text-muted-foreground mt-1 bg-gray-50 rounded px-2 py-1.5 inline-block">
                {event.details}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-muted-foreground whitespace-nowrap cursor-help">
                  <Clock className="h-3.5 w-3.5 inline mr-1" />
                  {formatDateTime(event.timestamp)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{formatDateFull(event.timestamp)}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShipmentTracker({
  shipment,
  className,
  onRefresh,
  onNotifyToggle,
  onDownloadReceipt,
  isRefreshing = false,
}: ShipmentTrackerProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [copiedTrackingNumber, setCopiedTrackingNumber] = useState(false);

  const currentStatus = statusConfig[shipment.status];
  const currentStepIndex = getCurrentStepIndex(shipment.status);
  const transportMode = transportConfig[shipment.transportMode];
  const isDelivered = shipment.status === 'delivered';
  const hasException = ['exception', 'failed_delivery', 'returned', 'cancelled'].includes(shipment.status);

  // Sort events by timestamp (newest first)
  const sortedEvents = useMemo(() => {
    return [...shipment.trackingEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [shipment.trackingEvents]);

  // Latest event
  const latestEvent = sortedEvents[0];

  // Handle copy tracking number
  const handleCopyTrackingNumber = async () => {
    try {
      await navigator.clipboard.writeText(shipment.trackingNumber);
      setCopiedTrackingNumber(true);
      setTimeout(() => setCopiedTrackingNumber(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle notification toggle
  const handleNotificationToggle = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    onNotifyToggle?.(newValue);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn('space-y-6', className)}>
        {/* Header Card */}
        <Card className="overflow-hidden">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              {/* Left side - Status */}
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center shrink-0',
                    currentStatus.bgColor
                  )}
                >
                  <span className={currentStatus.color}>{currentStatus.icon}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold">{currentStatus.label}</h2>
                    <Badge
                      variant={
                        isDelivered
                          ? 'default'
                          : hasException
                          ? 'destructive'
                          : 'secondary'
                      }
                      className={cn(currentStatus.bgColor, 'border-none')}
                    >
                      {currentStatus.description}
                    </Badge>
                  </div>
                  
                  {latestEvent && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Dernière mise à jour: {formatDateTime(latestEvent.timestamp)}
                      {latestEvent.location && ` • ${latestEvent.location}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Right side - Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRefresh?.()}
                  disabled={isRefreshing}
                  className="gap-1.5"
                >
                  <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                  Actualiser
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNotificationToggle}
                  aria-label={
                    notificationsEnabled
                      ? 'Désactiver les notifications'
                      : 'Activer les notifications'
                  }
                >
                  {notificationsEnabled ? (
                    <Bell className="h-4 w-4" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                </Button>

                {onDownloadReceipt && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownloadReceipt(shipment.id)}
                    className="gap-1.5"
                  >
                    <Download className="h-4 w-4" />
                    Reçu
                  </Button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {currentStepIndex >= 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {statusFlow.slice(0, currentStepIndex + 1).map((status, idx) => {
                      const stepConfig = statusConfig[status];
                      return (
                        <React.Fragment key={status}>
                          {idx > 0 && (
                            <ArrowRight className="h-4 w-4 text-primary mx-1" />
                          )}
                          <Badge
                            key={status}
                            variant="secondary"
                            className={cn(stepConfig.bgColor, 'border-none')}
                          >
                            {stepConfig.icon}
                            <span className="ml-1 hidden sm:inline">{stepConfig.label}</span>
                          </Badge>
                        </React.Fragment>
                      );
                    })}
                  </div>
                  
                  {shipment.estimatedDelivery && !isDelivered && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Est.: {new Date(shipment.estimatedDelivery).toLocaleDateString('fr-DZ')}
                    </span>
                  )}
                </div>

                {/* Visual progress bar */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      isDelivered
                        ? 'bg-green-500'
                        : hasException
                        ? 'bg-orange-500'
                        : 'bg-primary'
                    )}
                    style={{
                      width: `${((currentStepIndex + 1) / statusFlow.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Tracking Number */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <span className="text-sm font-medium text-muted-foreground">N° de suivi:</span>
              
              <code className="flex-1 font-mono text-sm bg-white px-3 py-1.5 rounded border">
                {shipment.trackingNumber}
              </code>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyTrackingNumber}
                className="gap-1.5 shrink-0"
                aria-label="Copier le numéro de suivi"
              >
                {copiedTrackingNumber ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Copié!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copier
                  </>
                )}
              </Button>

              {shipment.carrier.trackingUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="gap-1.5 shrink-0"
                >
                  <a
                    href={shipment.carrier.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Suivre
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-5 w-5" />
                  Historique du suivi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sortedEvents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Aucun événement de suivi disponible</p>
                  </div>
                ) : (
                  <div className="-ml-2">
                    {sortedEvents.map((event, index) => (
                      <TimelineNode
                        key={event.id}
                        event={event}
                        index={index}
                        isFirst={index === sortedEvents.length - 1}
                        isLast={index === 0}
                        isActive={index <= 2 || index === sortedEvents.length - 1}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar info */}
          <div className="space-y-6">
            {/* Shipping Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-5 w-5" />
                  Détails de l&apos;expédition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Origin */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                    <Warehouse className="h-4 w-4" />
                    Expéditeur
                  </div>
                  <div className="pl-6 text-sm space-y-0.5">
                    <p className="font-medium">{shipment.origin.address}</p>
                    <p className="text-muted-foreground">
                      {shipment.origin.city}, {shipment.origin.wilayaCode}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Destination */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                    <Home className="h-4 w-4" />
                    Destinataire
                  </div>
                  <div className="pl-6 text-sm space-y-0.5">
                    <p className="font-medium">{shipment.destination.address}</p>
                    <p className="text-muted-foreground">
                      {shipment.destination.city}, {shipment.destination.wilayaCode}
                    </p>
                    {shipment.destination.contactName && (
                      <p className="text-muted-foreground flex items-center gap-1 mt-1">
                        <User className="h-3.5 w-3.5" />
                        {shipment.destination.contactName}
                      </p>
                    )}
                    {shipment.destination.contactPhone && (
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {shipment.destination.contactPhone}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Transport mode */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Mode de transport</span>
                  <Badge variant="outline" className="gap-1">
                    {transportMode.icon}
                    {transportMode.label}
                  </Badge>
                </div>

                {/* Weight */}
                {shipment.weight && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Poids</span>
                    <span className="text-sm font-medium">{shipment.weight} kg</span>
                  </div>
                )}

                {/* Package count */}
                {shipment.packageCount && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Nombre de colis</span>
                    <span className="text-sm font-medium">{shipment.packageCount}</span>
                  </div>
                )}

                {/* Signature required */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Signature requise</span>
                  <Badge variant={shipment.signatureRequired ? 'default' : 'secondary'}>
                    {shipment.signatureRequired ? 'Oui' : 'Non'}
                  </Badge>
                </div>

                {/* Insurance */}
                {shipment.insuranceValue !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Valeur assurée</span>
                    <span className="text-sm font-medium text-green-600">
                      {new Intl.NumberFormat('fr-DZ').format(shipment.insuranceValue)} DA
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Carrier Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-5 w-5" />
                  Transporteur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  {shipment.carrier.logo ? (
                    <img
                      src={shipment.carrier.logo}
                      alt={shipment.carrier.name}
                      className="h-10 w-10 object-contain rounded-lg bg-gray-50 p-1"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{shipment.carrier.name}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {shipment.carrier.phone && (
                    <a
                      href={`tel:${shipment.carrier.phone}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      {shipment.carrier.phone}
                    </a>
                  )}

                  {shipment.carrier.email && (
                    <a
                      href={`mailto:${shipment.carrier.email}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      {shipment.carrier.email}
                    </a>
                  )}

                  {shipment.carrier.website && (
                    <a
                      href={shipment.carrier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Site web
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Confirmation (if delivered) */}
            {isDelivered && (
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-full bg-green-100">
                      <ClipboardCheck className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">Livraison confirmée!</p>
                      {shipment.actualDelivery && (
                        <p className="text-sm text-green-600">
                          Le {formatDateFull(shipment.actualDelivery)}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 border-green-200 hover:bg-green-50"
                    onClick={() => onDownloadReceipt?.(shipment.id)}
                  >
                    <FileText className="h-4 w-4" />
                    Télécharger le bon de livraison
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Exception Warning */}
            {hasException && !isDelivered && (
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-orange-100 shrink-0">
                      <AlertCircle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-orange-800">
                        Attention: Problème avec votre expédition
                      </p>
                      <p className="text-sm text-orange-600 mt-1">
                        {currentStatus.description}
                      </p>
                      
                      {latestEvent?.details && (
                        <p className="text-sm text-orange-700 mt-2 bg-white/50 rounded p-2">
                          {latestEvent.details}
                        </p>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 gap-1.5 border-orange-200 hover:bg-orange-50"
                      >
                        <Phone className="h-4 w-4" />
                        Contacter le support
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Export types
export type { ShipmentTrackerProps };
