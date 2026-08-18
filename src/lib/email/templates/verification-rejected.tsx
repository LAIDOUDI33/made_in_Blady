/**
 * Verification Rejected Template
 * 
 * Sent to user when their verification is rejected.
 * Includes reason for rejection and guidance for resubmission.
 * 
 * @module lib/email/templates/verification-rejected
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface VerificationRejectedProps {
  userName: string;
  verificationType: string;
  rejectReason: string;
  canResubmit: boolean;
  resubmitUrl?: string;
  supportUrl?: string;
  unsubscribeUrl?: string;
}

export function verificationRejectedTemplate(props: VerificationRejectedProps): { html: string; text: string } {
  const { 
    userName, 
    verificationType, 
    rejectReason,
    canResubmit,
    resubmitUrl,
    supportUrl,
    unsubscribeUrl 
  } = props;

  const html = baseEmailTemplate({
    previewText: `Information concernant votre demande de vérification - ${verificationType}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge - Warning -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #FEE2E2; color: #991B1B; font-size: 13px; font-weight: 600; border-radius: 20px;">
              ⚠️ Vérification Requiert Attention
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700;">
              Bonjour, ${userName}
            </h2>
            <p style="margin: 0 0 16px 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Après examen attentif de votre demande de vérification pour 
              <strong style="color: #006233;">${verificationType}</strong>, 
              nous ne sommes pas en mesure de l'approuver à ce stade.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Reason Box -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px; background-color: #FEF2F2; border-radius: 8px; border-left: 4px solid #DC2626;">
            <h4 style="margin: 0 0 12px 0; color: #991B1B; font-size: 15px; font-weight: 600;">
              📋 Raison du refus
            </h4>
            <p style="margin: 0; color: #7F1D1D; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
${rejectReason}
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Guidance -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px; background-color: #FFFBEB; border-radius: 8px; border-left: 4px solid #F59E0B;">
            <h4 style="margin: 0 0 12px 0; color: #92400E; font-size: 15px; font-weight: 600;">
              💡 Comment corriger cela ?
            </h4>
            <ul style="margin: 0; padding-left: 20px; color: #78350F; font-size: 14px; line-height: 1.8;">
              <li>Vérifiez que tous les documents sont lisibles et complets</li>
              <li>Assurez-vous que les informations correspondent à votre profil</li>
              <li>Fournissez des documents à jour (moins de 3 mois)</li>
              <li>Contactez notre support si vous avez des questions</li>
            </ul>
          </td>
        </tr>
      </table>

      ${canResubmit && resubmitUrl ? `
      <!-- Resubmit CTA -->
      ${emailButton({ url: resubmitUrl, text: 'Soumettre une nouvelle demande', fullWidth: true })}
      ` : ''}

      ${supportUrl ? `
      <!-- Support Link -->
      ${alertBox({
        type: 'warning',
        children: `
          <strong>Besoin d'aide ?</strong><br><br>
          Si vous pensez qu'il s'agit d'une erreur ou si vous avez des questions, 
          n'hésitez pas à contacter notre équipe de support.<br><br>
          <a href="${supportUrl}" style="color: #006233; font-weight: 600;">Contacter le support →</a>
        `,
      })}
      ` : ''}
    `,
  });

  const text = `
INFORMATION CONCERNANT VOTRE DEMANDE DE VÉRIFICATION

Bonjour, ${userName}

Après examen attentif de votre demande de vérification pour ${verificationType}, 
nous ne sommes pas en mesure de l'approuver à ce stade.

RAISON DU REFUS :
${rejectReason}

COMMENT CORRIGER CELA ?
• Vérifiez que tous les documents sont lisibles et complets
• Assurez-vous que les informations correspondent à votre profil
• Fournissez des documents à jour (moins de 3 mois)
• Contactez notre support si vous avez des questions

${canResubmit ? `Soumettre une nouvelle demande : ${resubmitUrl}` : ''}

${supportUrl ? `Contacter le support : ${supportUrl}` : ''}

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
