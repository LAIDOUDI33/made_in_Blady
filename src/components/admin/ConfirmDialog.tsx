'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning';
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'default',
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  const getButtonClass = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      default:
        return '';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isLoading}
            className={getButtonClass()}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Pre-configured dialog variants for common admin actions

interface SuspendUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function SuspendUserDialog({
  open,
  onOpenChange,
  userName,
  onConfirm,
  isLoading,
}: SuspendUserDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Suspendre l'utilisateur"
      description={`Êtes-vous sûr de vouloir suspendre ${userName} ? L'utilisateur ne pourra plus se connecter à la plateforme et ses produits seront masqués.`}
      confirmText="Suspendre"
      variant="destructive"
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  hasCompany?: boolean;
  hasOrders?: boolean;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  userName,
  hasCompany = false,
  hasOrders = false,
  onConfirm,
  isLoading,
}: DeleteUserDialogProps) {
  let description = `Êtes-vous sûr de vouloir supprimer définitivement le compte de ${userName} ? `;
  
  const consequences = [];
  if (hasCompany) consequences.push("l'entreprise associée sera supprimée");
  if (hasOrders) consequences.push("les historiques de commandes seront affectés");
  
  if (consequences.length > 0) {
    description += `Cette action entraînera également ${consequences.join(' et ')}. `;
  }
  
  description += "Cette action est irréversible.";

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Supprimer l'utilisateur"
      description={description}
      confirmText="Supprimer définitivement"
      variant="destructive"
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}

interface VerifyCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  onConfirm: (notes?: string) => void | Promise<void>;
  isLoading?: boolean;
  action: 'verify' | 'reject';
}

export function VerifyCompanyDialog({
  open,
  onOpenChange,
  companyName,
  onConfirm,
  isLoading,
  action,
}: VerifyCompanyDialogProps) {
  const isVerify = action === 'verify';
  
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isVerify ? "Vérifier l'entreprise" : "Rejeter l'entreprise"}
      description={
        isVerify 
          ? `Confirmez-vous la vérification de "${companyName}" ? L'entreprise pourra alors publier des produits et recevoir des commandes.`
          : `Êtes-vous sûr de rejeter la demande de vérification pour "${companyName}" ? L'entreprise sera notifiée du rejet.`
      }
      confirmText={isVerify ? "Confirmer la vérification" : "Rejeter"}
      variant={isVerify ? 'default' : 'destructive'}
      onConfirm={() => onConfirm()}
      isLoading={isLoading}
    />
  );
}
