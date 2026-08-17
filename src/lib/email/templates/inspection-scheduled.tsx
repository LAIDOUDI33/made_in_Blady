/**
 * Inspection Scheduled Template
 * 
 * Sent when inspector is assigned and inspection is scheduled.
 * Includes inspector info and scheduled date/time.
 * 
 * @module lib/email/templates/inspection-scheduled
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface InspectionScheduledProps {
  userName: string;
  bookingNumber: string;
  inspectionType: string;
  inspectorName: string;
  scheduledDate: Date | string;
  scheduledTime: string;
  locationAddress: string;
  contactPhone?: string;
  specialInstructions?: string;
  calendarUrl?: string;
  bookingUrl: string;
  unsubscribeUrl?: string;
}

export function inspectionScheduledTemplate(props: InspectionScheduledProps): { html: string; text: string } {
  const { 
    userName, 
    bookingNumber, 
    inspectionType,
    inspectorName,
    scheduledDate,
    scheduledTime,
    locationAddress,
    contactPhone,
    specialInstructions,
    calendarUrl,
    bookingUrl,
    unsubscribeUrl 
  } = props;

  const dateFormatted = new Date(scheduledDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = baseEmailTemplate({
    previewText: `Inspecteur assigné - ${bookingNumber}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #DBEAFE; color: #1E40AF; font-size: 13px; font-weight: 600; border-radius: 20px;">
              👨‍💼 Inspecteur Assigné
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700;">
              Votre inspection est programmée, ${userName} ! 📅
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Nous avons plaisir de vous informer qu'un inspecteur a été assigné pour votre 
              <strong style="color: #006233;">${inspectionType}</strong>.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Inspector Card -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px; background-color: #F0F9FF; border-radius: 12px; border: 1px solid #BAE6FD;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="width: 60px;">
                  <div style="width: 60px; height: 60px; background-color: #0EA5E9; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 28px;">👨‍💼</span>
                  </div>
                </td>
                <td style="padding-left: 16px;">
                  <h3 style="margin: 0 0 4px 0; color: #0369A1; font-size: 18px; font-weight: 700;">
                    ${inspectorName}
                  </h3>
                  <p style="margin: 0; color: #0EA5E9; font-size: 14px;">Inspecteur certifié AlgeriaTrade</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Schedule Details -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px 24px;">
            <h4 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
              📅 Détails du rendez-vous
            </h4>
            
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">N° de réservation</p>
                  <p style="margin: 4px 0 0 0; color: #006233; font-size: 16px; font-weight: 600;">${bookingNumber}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Date</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 16px; font-weight: 500;">📆 ${dateFormatted}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Heure</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 16px; font-weight: 500;">🕐 ${scheduledTime}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Lieu</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 14px; line-height: 1.5;">📍 ${locationAddress}</p>
                </td>
              </tr>
              ${contactPhone ? `
              <tr>
                <td style="padding: 10px 0;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Contact inspecteur</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">📞 ${contactPhone}</p>
                </td>
              </tr>
              ` : ''}
            </table>
          </td>
        </tr>
      </table>

      ${specialInstructions ? `
      <!-- Special Instructions -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 16px 20px; background-color: #FFFBEB; border-radius: 8px; border-left: 4px solid #F59E0B;">
            <h4 style="margin: 0 0 8px 0; color: #92400E; font-size: 14px; font-weight: 600;">
              📌 Instructions spéciales
            </h4>
            <p style="margin: 0; color: #78350F; font-size: 14px; line-height: 1.5;">${specialInstructions}</p>
          </td>
        </tr>
      </table>
      ` : ''}

      ${divider()}

      <!-- CTAs -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td>
            ${emailButton({ url: bookingUrl, text: 'Voir les détails complets', fullWidth: true })}
            ${calendarUrl ? `<div style="text-align: center; margin-top: 12px;"><a href="${calendarUrl}" style="color: #0EA5E9; font-size: 14px; font-weight: 500; text-decoration: none;">+ Ajouter à mon calendrier</a></div>` : ''}
          </td>
        </tr>
      </table>

      <!-- Preparation Tips -->
      ${alertBox({
        type: 'success',
        children: `
          <strong>✅ Préparez-vous pour l'inspection :</strong><br><br>
          • Assurez-vous que quelqu'un est présent sur site<br>
          • Préparez tous les documents nécessaires<br>
          • Assurez l'accès aux zones à inspecter<br>
          • Prévoyez un espace de travail pour l'inspecteur<br>
          • Contactez l'inspecteur si vous avez des questions
        `,
      })}
    `,
  });

  const text = `
INSPECTION PROGRAMMÉE

Votre inspection est programmée, ${userName} !

Nous avons plaisir de vous informer qu'un inspecteur a été assigné 
pour votre ${inspectionType}.

INSPECTEUR :
Nom : ${inspectorName}
Statut : Inspecteur certifié AlgeriaTrade
${contactPhone ? `Contact : ${contactPhone}` : ''}

DÉTAILS DU RENDEZ-VOUS :
N° de réservation : ${bookingNumber}
Date : ${dateFormatted}
Heure : ${scheduledTime}
Lieu : ${locationAddress}

${specialInstructions ? `INSTRUCTIONS SPÉCIALES :
${specialInstructions}` : ''}

Voir les détails complets : ${bookingUrl}
${calendarUrl ? `Ajouter au calendrier : ${calendarUrl}` : ''}

PRÉPAREZ-VOUS POUR L'INSPECTION :
• Assurez-vous que quelqu'un est présent sur site
• Préparez tous les documents nécessaires
• Assurez l'accès aux zones à inspecter

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
