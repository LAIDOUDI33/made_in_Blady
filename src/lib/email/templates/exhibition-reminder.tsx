/**
 * Exhibition Reminder Template
 * 
 * Sent as a reminder before the exhibition starts.
 * Includes countdown and important preparation info.
 * 
 * @module lib/email/templates/exhibition-reminder
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface ExhibitionReminderProps {
  userName: string;
  exhibitionName: string;
  eventDate: Date | string;
  startTime: string;
  venueAddress: string;
  boothNumber?: string;
  daysUntilEvent: number;
  isVirtual: boolean;
  accessUrl?: string;
  exhibitionUrl: string;
  unsubscribeUrl?: string;
}

export function exhibitionReminderTemplate(props: ExhibitionReminderProps): { html: string; text: string } {
  const { 
    userName, 
    exhibitionName, 
    eventDate,
    startTime,
    venueAddress,
    boothNumber,
    daysUntilEvent,
    isVirtual,
    accessUrl,
    exhibitionUrl,
    unsubscribeUrl 
  } = props;

  const dateFormatted = new Date(eventDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Urgency styling based on days left
  const getUrgencyConfig = (days: number) => {
    if (days <= 1) return { bg: '#FEE2E2', color: '#991B1B', label: 'Dernier rappel !', icon: '🚨' };
    if (days <= 3) return { bg: '#FEF3C7', color: '#92400E', label: 'Bientôt !', icon: '⏰' };
    return { bg: '#DBEAFE', color: '#1E40AF', label: 'Rappel', icon: '📅' };
  };

  const urgency = getUrgencyConfig(daysUntilEvent);

  const html = baseEmailTemplate({
    previewText: `Rappel - ${exhibitionName} dans ${daysUntilEvent} jour(s)`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge with urgency -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: ${urgency.bg}; color: ${urgency.color}; font-size: 13px; font-weight: 600; border-radius: 20px;">
              ${urgency.icon} ${urgency.label} - ${daysUntilEvent} jour(s) restant(s)
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700;">
              Ça approche, ${userName} ! 🎊
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              L'événement <strong style="color: #006233;">${exhibitionName}</strong> commence dans 
              <strong style="color: #DC2626; font-size: 18px;">${daysUntilEvent} jour(s)</strong>. 
              Voici un rappel avec toutes les informations importantes.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Countdown Box -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 32px; background: linear-gradient(135deg, #006233 0%, #00A651 100%); border-radius: 12px; text-align: center;">
            <p style="margin: 0 0 12px 0; color: rgba(255,255,255,0.85); font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">
              L'événement commence dans
            </p>
            <p style="margin: 0; color: #ffffff; font-size: 64px; font-weight: 700; line-height: 1;">
              ${daysUntilEvent}
            </p>
            <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 18px;">
              jour(s)
            </p>
          </td>
        </tr>
      </table>

      <!-- Event Details -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px 24px;">
            <h4 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
              📍 Informations de l'événement
            </h4>
            
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Événement</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">${exhibitionName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Date & Heure</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">📅 ${dateFormatted} à ${startTime}</p>
                </td>
              </tr>
              ${boothNumber ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Votre stand</p>
                  <p style="margin: 4px 0 0 0; color: #006233; font-size: 18px; font-weight: 700;">Stand N° ${boothNumber}</p>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">${isVirtual ? 'Lien d\'accès' : 'Adresse'}</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 14px; line-height: 1.5;">
                    ${isVirtual && accessUrl ? `<a href="${accessUrl}" style="color: #006233; font-weight: 500;">${accessUrl}</a>` : `📍 ${venueAddress}`}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Access CTA -->
      ${isVirtual && accessUrl ? `
      ${emailButton({ url: accessUrl, text: '🖥️ Accéder à l\'événement virtuel', fullWidth: true })}
      ` : `
      ${emailButton({ url: exhibitionUrl, text: 'Voir les détails de l\'événement', fullWidth: true })}
      `}

      <!-- Checklist -->
      ${alertBox({
        type: daysUntilEvent <= 3 ? 'warning' : 'info',
        children: `
          <strong>✅ Checklist avant l'événement :</strong><br><br>
          ${isVirtual ? `
          • Testez votre connexion internet et équipements<br>
          • Connectez-vous 15 minutes avant le début<br>
          • Préparez votre profil virtuel<br>
          ` : `
          • Imprimez ou téléchargez votre billet/badge<br>
          • Planifiez votre trajet vers le lieu<br>
          • Arrivez 30 minutes avant pour l'enregistrement<br>
          `}
          ${boothNumber ? `
          • Vérifiez que votre stand est prêt<br>
          • Préparez vos supports marketing et échantillons<br>
          • Chargez vos produits sur la plateforme<br>
          ` : `
          • Consultez la carte des exposants<br>
          • Identifiez les stands à visiter en priorité<br>
          • Préparez vos cartes de visite (virtuelles ou physiques)<br>
          `}
        `,
      })}
    `,
  });

  const text = `
RAPPEL - L'ÉVÉNEMENT APPROCHE !

Ça approche, ${userName} !

L'événement ${exhibitionName} commence dans ${daysUntilEvent} jour(s).
Voici un rappel avec toutes les informations importantes.

COMPT À REBOURS : ${daysUntilEvent} jour(s)

INFORMATIONS DE L'ÉVÉNEMENT :
Événement : ${exhibitionName}
Date & Heure : ${dateFormatted} à ${startTime}
${boothNumber ? `Votre stand : Stand N° ${boothNumber}` : ''}
${isVirtual && accessUrl ? `Lien d'accès : ${accessUrl}` : `Adresse : ${venueAddress}`}

${isVirtual && accessUrl ? `Accéder à l'événement virtuel : ${accessUrl}` : ''}

CHECKLIST AVANT L'ÉVÉNEMENT :
${isVirtual ? `- Testez votre connexion internet et équipements\n- Connectez-vous 15 minutes avant le début` : `- Imprimez ou téléchargez votre billet/badge\n- Planifiez votre trajet vers le lieu`}
${boothNumber ? `- Vérifiez que votre stand est prêt\n- Préparez vos supports marketing` : `- Consultez la carte des exposants\n- Identifiez les stands à visiter en priorité`}

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
