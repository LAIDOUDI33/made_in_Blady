/**
 * Verification Request Received Template
 * 
 * Sent to user when they submit a verification request.
 * Confirms receipt and explains the review process.
 * 
 * @module lib/email/templates/verification-request-received
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface VerificationRequestReceivedProps {
  userName: string;
  verificationType: string;
  submittedDate: Date | string;
  verificationUrl: string;
  unsubscribeUrl?: string;
}

export function verificationRequestReceivedTemplate(props: VerificationRequestReceivedProps): { html: string; text: string } {
  const { 
    userName, 
    verificationType, 
    submittedDate,
    verificationUrl,
    unsubscribeUrl 
  } = props;

  const submittedFormatted = new Date(submittedDate).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = baseEmailTemplate({
    previewText: `Demande de vérification reçue - ${verificationType}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #DBEAFE; color: #1E40AF; font-size: 13px; font-weight: 600; border-radius: 20px;">
              📋 Demande Reçue
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700;">
              Votre demande a été soumise, ${userName} ! 🎉
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Nous avons bien reçu votre demande de vérification pour <strong style="color: #006233;">${verificationType}</strong>. 
              Notre équipe va examiner votre dossier dans les plus brefs délais.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Verification Details -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px 24px;">
            <h4 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
              📝 Détails de la demande
            </h4>
            
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Type de vérification</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${verificationType}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Date de soumission</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${submittedFormatted}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- CTA -->
      ${emailButton({ url: verificationUrl, text: 'Suivre ma demande', fullWidth: true })}

      <!-- Timeline Info -->
      ${alertBox({
        type: 'info',
        children: `
          <strong>⏱️ Délais de traitement :</strong><br><br>
          • Vérification de base : 1-2 jours ouvrables<br>
          • Vérification entreprise : 3-5 jours ouvrables<br>
          • Certification tierce partie : 7-10 jours ouvrables<br><br>
          Vous recevrez un email dès qu'une décision sera prise.
        `,
      })}
    `,
  });

  const text = `
DEMANDE DE VÉRIFICATION REÇUE

Votre demande a été soumise, ${userName} !

Nous avons bien reçu votre demande de vérification pour : ${verificationType}
Notre équipe va examiner votre dossier dans les plus brefs délais.

DÉTAILS DE LA DEMANDE :
Type de vérification : ${verificationType}
Date de soumission : ${submittedFormatted}

Suivre ma demande : ${verificationUrl}

DÉLAIS DE TRAITEMENT :
• Vérification de base : 1-2 jours ouvrables
• Vérification entreprise : 3-5 jours ouvrables
• Certification tierce partie : 7-10 jours ouvrables

Vous recevrez un email dès qu'une décision sera prise.

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
