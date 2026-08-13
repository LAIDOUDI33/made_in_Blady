'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Building2, FileText, Phone, Mail, MapPin } from 'lucide-react';

interface CompanyData {
  id: string;
  name: string;
  legalForm: string;
  rcNumber: string;
  nif?: string;
  nis?: string;
  wilaya: string;
  address?: string;
  contactEmail: string;
  contactPhone: string;
  description?: string;
  logo?: string;
  createdAt: string;
}

interface VerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyData | null;
  onVerify: (companyId: string, notes: string) => void | Promise<void>;
  onReject: (companyId: string, reason: string) => void | Promise<void>;
  isLoading?: boolean;
}

export function VerificationModal({
  open,
  onOpenChange,
  company,
  onVerify,
  onReject,
  isLoading = false,
}: VerificationModalProps) {
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [action, setAction] = useState<'verify' | 'reject' | null>(null);

  if (!company) return null;

  const handleAction = async () => {
    if (action === 'verify') {
      await onVerify(company.id, notes);
    } else if (action === 'reject') {
      await onReject(company.id, rejectionReason);
    }
    setNotes('');
    setRejectionReason('');
    setAction(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Vérification d&apos;entreprise
          </DialogTitle>
          <DialogDescription>
            Vérifiez les informations de l&apos;entreprise avant de prendre une décision
          </DialogDescription>
        </DialogHeader>

        {/* Company Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left column - Basic info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 rounded-lg bg-green-100 flex items-center justify-center">
                {company.logo ? (
                  <img 
                    src={company.logo} 
                    alt={company.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-green-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{company.name}</h3>
                <Badge variant="secondary" className="mt-1">{company.legalForm}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <InfoRow 
                icon={<FileText className="h-4 w-4" />} 
                label="RC Number" 
                value={company.rcNumber} 
              />
              <InfoRow 
                icon={<FileText className="h-4 w-4" />} 
                label="NIF" 
                value={company.nif || 'Non renseigné'} 
              />
              <InfoRow 
                icon={<FileText className="h-4 w-4" />} 
                label="NIS" 
                value={company.nis || 'Non renseigné'} 
              />
              <InfoRow 
                icon={<MapPin className="h-4 w-4" />} 
                label="Wilaya" 
                value={company.wilaya} 
              />
              {company.address && (
                <InfoRow 
                  icon={<MapPin className="h-4 w-4" />} 
                  label="Adresse" 
                  value={company.address} 
                />
              )}
            </div>
          </div>

          {/* Right column - Contact & Description */}
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wide">
                Contact
              </h4>
              <InfoRow 
                icon={<Mail className="h-4 w-4" />} 
                label="Email" 
                value={company.contactEmail} 
              />
              <InfoRow 
                icon={<Phone className="h-4 w-4" />} 
                label="Téléphone" 
                value={company.contactPhone} 
              />
            </div>

            {company.description && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wide mb-2">
                  Description
                </h4>
                <p className="text-sm text-gray-700">{company.description}</p>
              </div>
            )}

            <div className="text-xs text-gray-400">
              Inscrite le {new Date(company.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="border-t pt-4 space-y-4">
          {!action ? (
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                variant="destructive"
                onClick={() => setAction('reject')}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Rejeter
              </Button>
              <Button
                onClick={() => setAction('verify')}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Vérifier l&apos;entreprise
              </Button>
            </div>
          ) : (
            <>
              {action === 'verify' ? (
                <div className="space-y-3">
                  <Label htmlFor="verify-notes">Notes de vérification (optionnel)</Label>
                  <Textarea
                    id="verify-notes"
                    placeholder="Ajoutez des notes sur cette vérification..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <Label htmlFor="reject-reason">Motif du rejet *</Label>
                  <Textarea
                    id="reject-reason"
                    placeholder="Expliquez pourquoi cette entreprise est rejetée..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
              )}

              <DialogFooter className="flex gap-2 sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => setAction(null)}
                  disabled={isLoading}
                >
                  Retour
                </Button>
                <Button
                  variant={action === 'reject' ? 'destructive' : 'default'}
                  onClick={handleAction}
                  disabled={isLoading || (action === 'reject' && !rejectionReason.trim())}
                  className={action === 'verify' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {isLoading ? 'Traitement en cours...' : action === 'verify' ? 'Confirmer la vérification' : 'Confirmer le rejet'}
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
