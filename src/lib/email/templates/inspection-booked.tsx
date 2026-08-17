/**
 * Inspection Booked Template
 * 
 * Sent to user when an inspection booking is confirmed.
 * Includes booking details and next steps.
 * 
 * @module lib/email/templates/inspection-booked
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface InspectionBookedProps {
  userName: string;
  bookingNumber: string;
  inspectionType: string;
  preferredDate?: Date | string;
  totalCost: number;
  currency: string;
  isUrgent: boolean;
  bookingUrl: string;
  unsubscribeUrl?: string;
}

export function inspectionBookedTemplate(props: InspectionBookedProps): { html: string; text: string } {
  const { 
    userName, 
    bookingNumber, 
    inspectionType,
    preferredDate,
    totalCost,
    currency,
    isUrgent,
    bookingUrl,
    unsubscribeUrl 
  } = props;

  const formatPrice = (value: number) => new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value);

  const dateFormatted = preferredDate
    ? new Date(preferredDate).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const html = baseEmailTemplate({
    previewText: `Réservation confirmée - Inspection ${inspectionType}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #DCFCE7; color: #166534; font-size: 13px; font-weight: 600; border-radius: 20px;">
              🔍 Réservation Confirmée
            </span>
          </td>
        </tr>
      </table>

      ${isUrgent ? `
      <!-- Urgent Badge -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td>
            <span style="display: inline-block; padding: 4px 12px; background-color: #FEE2E2; color: #991B1B; font-size: 12px; font-weight: 600; border-radius: 16px;">
              ⚡ Demande urgente (+50% surcharge)
            </span>
          </td>
        </tr>
      </table>
      ` : ''}

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700;">
              Votre inspection a été réservée, ${userName} ! ✅
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Votre demande d'inspection <strong style="color: #006233;">${inspectionType}</strong> a été 
              enregistrée avec succès. Un inspecteur sera assigné prochainement.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Booking Details -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px 24px;">
            <h4 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
              📋 Détails de la réservation
            </h4>
            
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">N° de réservation</p>
                  <p style="margin: 4px 0 0 0; color: #006233; font-size: 18px; font-weight: 700;">${bookingNumber}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Type d'inspection</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${inspectionType}</p>
                </td>
              </tr>
              ${dateFormatted ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Date préférée</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">📅 ${dateFormatted}</p>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Coût total</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 20px; font-weight: 700;">${formatPrice(totalCost)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- CTA -->
      ${emailButton({ url: bookingUrl, text: 'Voir ma réservation', fullWidth: true })}

      <!-- Next Steps -->
      ${alertBox({
        type: 'info',
        children: `
          <strong>📝 Prochaines étapes :</strong><br><br>
          1. Notre équipe va assigner un inspecteur qualifié<br>
          2. Vous recevrez un email avec les détails de l'inspection (date, heure, lieu)<br>
          3. L'inspecteur effectuera l'inspection selon les normes établies<br>
          4. Vous recevrez le rapport détaillé avec photos et recommandations
        `,
      })}
    `,
  });

  const text = `
RÉSERVATION CONFIRMÉE - INSPECTION

Votre inspection a été réservée, ${userName} !

Votre demande d'inspection ${inspectionType} a été enregistrée avec succès.
Un inspecteur sera assigné prochainement.

${isUrgent ? '⚡ DEMANDE URGENTE (+50% surcharge)' : ''}

DÉTAILS DE LA RÉSERVATION :
N° de réservation : ${bookingNumber}
Type d'inspection : ${inspectionType}
${dateFormatted ? `Date préférée : ${dateFormatted}` : ''}
Coût total : ${formatPrice(totalCost)}

Voir ma réservation : ${bookingUrl}

PROCHAINES ÉTAPES :
1. Notre équipe va assigner un inspecteur qualifié
2. Vous recevrez un email avec les détails de l'inspection
3. L'inspecteur effectuera l'inspection selon les normes établies
4. Vous recevrez le rapport détaillé avec photos et recommandations

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
