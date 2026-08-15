'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Calendar,
  Building2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Award,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export type CertificationStatus = 'valid' | 'expired' | 'pending';

export interface ProductCertification {
  id: string;
  name: string; // CE, ISO 9001, SGS, TUV, etc.
  issuingBody: string;
  issueDate: string;
  expiryDate?: string;
  status: CertificationStatus;
  certificateNumber?: string;
  documentUrl?: string;
  description?: string;
  icon?: string;
}

interface ProductCertificationsProps {
  certifications: ProductCertification[];
  compact?: boolean;
  className?: string;
  onViewCertificate?: (certification: ProductCertification) => void;
}

// Certification icon mapping
const certificationIcons: Record<string, React.ReactNode> = {
  CE: <Award className="h-5 w-5" />,
  ISO: <ShieldCheck className="h-5 w-5" />,
  SGS: <FileCheck className="h-5 w-5" />,
  TUV: <Building2 className="h-5 w-5" />,
  FDA: <Shield className="h-5 w-5" />,
  RoHS: <CheckCircle2 className="h-5 w-5" />,
  REACH: <FileCheck className="h-5 w-5" />,
  GMP: <ShieldAlert className="h-5 w-5" />,
  HACCP: <Award className="h-5 w-5" />,
};

// Status configuration
const statusConfig = {
  valid: {
    label: 'Valide',
    variant: 'default' as const,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    icon: CheckCircle2,
    iconColor: 'text-green-500',
  },
  expired: {
    label: 'Expiré',
    variant: 'destructive' as const,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    icon: XCircle,
    iconColor: 'text-red-500',
  },
  pending: {
    label: 'En attente',
    variant: 'secondary' as const,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
  },
};

// Format date for display
function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('fr-DZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

// Calculate days until expiry
function getDaysUntilExpiry(expiryDate?: string): number | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function ProductCertifications({
  certifications,
  compact = false,
  className,
  onViewCertificate,
}: ProductCertificationsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sort certifications: valid first, then pending, then expired
  const sortedCerts = useMemo(() => {
    return [...certifications].sort((a, b) => {
      const order = { valid: 0, pending: 1, expired: 2 };
      return order[a.status] - order[b.status];
    });
  }, [certifications]);

  // Count by status
  const statusCounts = useMemo(() => {
    return {
      valid: certifications.filter((c) => c.status === 'valid').length,
      pending: certifications.filter((c) => c.status === 'pending').length,
      expired: certifications.filter((c) => c.status === 'expired').length,
    };
  }, [certifications]);

  if (certifications.length === 0) {
    return null;
  }

  // Compact mode - show as inline badges
  if (compact) {
    return (
      <TooltipProvider delayDuration={300}>
        <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
          {sortedCerts.map((cert) => {
            const config = statusConfig[cert.status];
            const StatusIcon = config.icon;
            const daysUntil = getDaysUntilExpiry(cert.expiryDate);

            return (
              <Tooltip key={cert.id}>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={cn(
                      'cursor-pointer hover:opacity-80 transition-opacity',
                      config.bgColor,
                      config.borderColor,
                      config.textColor,
                      'gap-1 py-1 px-2'
                    )}
                    onClick={() =>
                      onViewCertificate?.(cert)
                    }
                    aria-label={`Certification ${cert.name}: ${config.label}`}
                  >
                    {certificationIcons[cert.name] || <Shield className="h-3.5 w-3.5" />}
                    <span className="font-medium">{cert.name}</span>
                    {cert.status === 'valid' && daysUntil !== null && daysUntil <= 90 && (
                      <Clock className="h-3 w-3 text-yellow-600" />
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1.5">
                    <p className="font-semibold">{cert.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Délivré par: {cert.issuingBody}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Le: {formatDate(cert.issueDate)}
                    </p>
                    {cert.expiryDate && (
                      <p className="text-xs text-muted-foreground">
                        Expire: {formatDate(cert.expiryDate)}
                        {daysUntil !== null && (
                          <span className={cn(
                            'ml-1 font-medium',
                            daysUntil <= 30 ? 'text-red-600' : daysUntil <= 90 ? 'text-yellow-600' : 'text-green-600'
                          )}>
                            ({daysUntil > 0 ? `dans ${daysUntil}j` : 'expiré'})
                          </span>
                        )}
                      </p>
                    )}
                    <Badge
                      variant={config.variant}
                      className="text-xs mt-1"
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  // Full mode - show detailed card
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Certifications & Normes
            <Badge variant="secondary" className="ml-2">
              {certifications.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {statusCounts.valid > 0 && (
              <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {statusCounts.valid}
              </Badge>
            )}
            {statusCounts.pending > 0 && (
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
                <Clock className="h-3 w-3 mr-1" />
                {statusCounts.pending}
              </Badge>
            )}
            {statusCounts.expired > 0 && (
              <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                <XCircle className="h-3 w-3 mr-1" />
                {statusCounts.expired}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {sortedCerts.map((cert) => {
            const config = statusConfig[cert.status];
            const StatusIcon = config.icon;
            const isExpanded = expandedId === cert.id;
            const daysUntil = getDaysUntilExpiry(cert.expiryDate);

            return (
              <div
                key={cert.id}
                className={cn(
                  'rounded-lg border p-4 transition-all duration-200',
                  config.bgColor,
                  config.borderColor,
                  isExpanded && 'shadow-sm'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left side - Icon and info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Certification icon */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                        config.bgColor,
                        'border',
                        config.borderColor
                      )}
                    >
                      {certificationIcons[cert.name] || (
                        <Shield className={cn('h-5 w-5', config.iconColor)} />
                      )}
                    </div>

                    {/* Certification details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                        <Badge
                          variant={config.variant}
                          className="text-xs"
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mt-0.5">
                        {cert.issuingBody}
                      </p>

                      {/* Date info (always visible in non-compact) */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Délivré: {formatDate(cert.issueDate)}
                        </span>
                        {cert.expiryDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Expire: {formatDate(cert.expiryDate)}
                            {daysUntil !== null && cert.status === 'valid' && (
                              <span
                                className={cn(
                                  'font-medium ml-1',
                                  daysUntil <= 30
                                    ? 'text-red-600'
                                    : daysUntil <= 90
                                    ? 'text-yellow-600'
                                    : 'text-green-600'
                                )}
                              >
                                ({daysUntil > 0 ? `dans ${daysUntil}j` : 'expiré'})
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-200/50 space-y-2">
                          {cert.certificateNumber && (
                            <p className="text-sm">
                              <span className="text-gray-500">N° certificat:</span>{' '}
                              <span className="font-mono text-gray-800">
                                {cert.certificateNumber}
                              </span>
                            </p>
                          )}
                          {cert.description && (
                            <p className="text-sm text-gray-600">
                              {cert.description}
                            </p>
                          )}
                          {cert.documentUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => window.open(cert.documentUrl, '_blank')}
                              aria-label={`Voir le certificat ${cert.name}`}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Voir le certificat
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side - Actions */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {(cert.description || cert.documentUrl || cert.certificateNumber) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : cert.id)
                        }
                        aria-label={
                          isExpanded
                            ? 'Réduire les détails'
                            : 'Voir les détails'
                        }
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {cert.documentUrl && !isExpanded && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onViewCertificate?.(cert)}
                        aria-label={`Voir le certificat ${cert.name}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-400 mt-4 text-center">
          <Shield className="h-3.5 w-3.5 inline mr-1" />
          Les certifications sont vérifiées par AlgeriaTrade.dz
        </p>
      </CardContent>
    </Card>
  );
}

// Export types for reuse
export type { ProductCertificationsProps };
