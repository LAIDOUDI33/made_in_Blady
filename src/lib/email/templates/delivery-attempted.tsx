/**
 * Delivery Attempted Template
 * 
 * Sent when delivery attempt fails.
 * Includes reason and next steps for redelivery.
 * 
 * @module lib/email/templates/delivery-attempted
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface DeliveryAttemptedProps {
  userName: string;
  orderNumber: string;
  trackingNumber: string;
  attemptDate: Date | string;
  attemptTime?: string;
  failureReason: string;
  nextAttemptDate?: Date | string;
  pickupLocation?: string;
  pickupDeadline?: Date | string;
  carrierName: string;
  rescheduleUrl?: string;
  trackingUrl: string;
  orderUrl: string;
  supportUrl?: string;
  unsubscribeUrl?: string;
}

export function deliveryAttemptedTemplate(props: DeliveryAttemptedProps): { html: string; text: string } {
  const { 
    userName, 
    orderNumber, 
    trackingNumber,
    attemptDate,
    attemptTime,
    failureReason,
    nextAttemptDate,
    pickupLocation,
    pickupDeadline,
    carrierName,
    rescheduleUrl,
    trackingUrl,
    orderUrl,
    supportUrl,
    unsubscribeUrl 
  } = props;

  const attemptFormatted = new Date(attemptDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const nextAttemptFormatted = nextAttemptDate
    ? new Date(nextAttemptDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const deadlineFormatted = pickupDeadline
    ? new Date(pickupDeadline).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const html = baseEmailTemplate({
    previewText: `Tentative de livraison - ${orderNumber}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge - Warning -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #FEE2E2; color: #991B1B; font-size: 13px; font-weight: 600; border-radius: 20px;">
              ⚠️ Tentative de Livraison
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700;">
              Nous avons essayé de vous livrer, ${userName}
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Le transporteur <strong>${carrierName}</strong> a tenté de livrer votre commande 
              <strong style="color: #006233;">${orderNumber}</strong>, mais la livraison n'a pas pu être complétée.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Failure Reason Card -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px; background-color: #FEF2F2; border-radius: 8px; border-left: 4px solid #DC2626;">
            <h4 style="margin: 0 0 8px 0; color: #991B1B; font-size: 14px; font-weight: 600;">
              ❌ Raison de l'échec
            </h4>
            <p style="margin: 0; color: #7F1D1D; font-size: 15px; line-height: 1.5;">${failureReason}</p>
          </td>
        </tr>
      </table>

      <!-- Attempt Details -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px 24px;">
            <h4 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
              📋 Détails de la tentative
            </h4>
            
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">N° de commande</p>
                  <p style="margin: 4px 0 0 0; color: #006233; font-size: 16px; font-weight: 600;">${orderNumber}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Date de tentative</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">📅 ${attemptFormatted}${attemptTime ? ` à ${attemptTime}` : ''}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Transporteur</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 14px;">🚛 ${carrierName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">N° de suivi</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 14px; font-family: monospace;">${trackingNumber}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Next Steps Options -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 24px; background-color: #FFFBEB; border-radius: 12px; border: 1px solid #FDE68A;">
            <h4 style="margin: 0 0 16px 0; color: #92400E; font-size: 15px; font-weight: 600;">
              🔧 Que faire maintenant ?
            </h4>
            
            ${nextAttemptFormatted ? `
            <div style="padding: 12px; background-color: white; border-radius: 8px; margin-bottom: 12px;">
              <p style="margin: 0 0 4px 0; color: #059669; font-size: 13px; font-weight: 600;">🔄 Nouvelle tentative automatique</p>
              <p style="margin: 0; color: #78350F; font-size: 14px;">Le ${nextAttemptFormatted}</p>
            </div>
            ` : ''}
            
            ${pickupLocation ? `
            <div style="padding: 12px; background-color: white; border-radius: 8px; margin-bottom: 12px;">
              <p style="margin: 0 0 4px 0; color: #0369A1; font-size: 13px; font-weight: 600;">🏪 Retrait en point relais</p>
              <p style="margin: 0; color: #78350F; font-size: 14px;">${pickupLocation}</p>
              ${deadlineFormatted ? `<p style="margin: 4px 0 0 0; color: #DC2626; font-size: 12px;">⏰ Avant le ${deadlineFormatted}</p>` : ''}
            </div>
            ` : ''}

            ${rescheduleUrl ? `
            <div style="padding: 12px; background-color: white; border-radius: 8px;">
              <p style="margin: 0 0 4px 0; color: #7C3AED; font-size: 13px; font-weight: 600;">📅 Reprogrammer la livraison</p>
              <p style="margin: 0; color: #78350F; font-size: 14px;">Choisissez une date qui vous convient</p>
            </div>
            ` : ''}
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- CTAs -->
      ${rescheduleUrl ? `
      ${emailButton({ url: rescheduleUrl, text: '📅 Reprogrammer la livraison', fullWidth: true })}
      ` : `
      ${emailButton({ url: trackingUrl, text: '📍 Suivre mon colis', fullWidth: true })}
      `}
      
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 12px;">
        <tr>
          <td style="text-align: center;">
            <a href="${orderUrl}" style="display: inline-block; padding: 10px 24px; background-color: transparent; color: #6B7280; text-decoration: none; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 13px; font-weight: 500;">
              Voir les détails de la commande
            </a>
          </td>
        </tr>
      </table>

      <!-- Support -->
      ${alertBox({
        type: 'warning',
        children: `
          <strong>Besoin d'aide ?</strong><br><br>
          • Contactez directement le transporteur (${carrierName})<br>
          • Vérifiez que votre adresse de livraison est correcte<br>
          • Assurez-vous que quelqu'un sera présent lors de la prochaine tentative<br>
          ${supportUrl ? `• <a href="${supportUrl}" style="color: #006233; font-weight: 600;">Contacter notre support</a>` : ''}
        `,
      })}
    `,
  });

  const text = `
TENTATIVE DE LIVRAISON

Nous avons essayé de vous livrer, ${userName}

Le transporteur ${carrierName} a tenté de livrer votre commande ${orderNumber},
mais la livraison n'a pas pu être complétée.

RAISON DE L'ÉCHEC :
${failureReason}

DÉTAILS DE LA TENTATIVE :
N° de commande : ${orderNumber}
Date de tentative : ${attemptFormatted}${attemptTime ? ` à ${attemptTime}` : ''}
Transporteur : ${carrierName}
N° de suivi : ${trackingNumber}

QUE FAIRE MAINTENANT ?
${nextAttemptFormatted ? `- Nouvelle tentative automatique : Le ${nextAttemptFormatted}` : ''}
${pickupLocation ? `- Retrait en point relais : ${pickupLocation}${deadlineFormatted ? `\n  Avant le ${deadlineFormatted}` : ''}` : ''}
${rescheduleUrl ? '- Reprogrammer la livraison' : ''}

${rescheduleUrl ? `Reprogrammer : ${rescheduleUrl}` : `Suivre mon colis : ${trackingUrl}`}

BESOIN D'AIDE ?
• Contactez directement le transporteur (${carrierName})
• Vérifiez que votre adresse de livraison est correcte
• Assurez-vous que quelqu'un sera présent lors de la prochaine tentative

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
