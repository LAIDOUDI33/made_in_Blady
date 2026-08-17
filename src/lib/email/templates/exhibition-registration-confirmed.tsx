/**
 * Exhibition Registration Confirmed Template
 * 
 * Sent when exhibition registration is approved.
 * Includes event details and next steps for exhibitors/visitors.
 * 
 * @module lib/email/templates/exhibition-registration-confirmed
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface ExhibitionRegistrationConfirmedProps {
  userName: string;
  exhibitionName: string;
  registrationType: string; // visitor, exhibitor, speaker, press
  eventDate: Date | string;
  endDate?: Date | string;
  venueAddress: string;
  isVirtual: boolean;
  isPhysical: boolean;
  registrationNumber: string;
  exhibitionUrl: string;
  addToCalendarUrl?: string;
  unsubscribeUrl?: string;
}

export function exhibitionRegistrationConfirmedTemplate(props: ExhibitionRegistrationConfirmedProps): { html: string; text: string } {
  const { 
    userName, 
    exhibitionName, 
    registrationType,
    eventDate,
    endDate,
    venueAddress,
    isVirtual,
    isPhysical,
    registrationNumber,
    exhibitionUrl,
    addToCalendarUrl,
    unsubscribeUrl 
  } = props;

  const startDateFormatted = new Date(eventDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const endDateFormatted = endDate
    ? new Date(endDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  // Registration type labels and icons
  const typeConfig: Record<string, { label: string; icon: string }> = {
    visitor: { label: 'Visiteur', icon: '👤' },
    exhibitor: { label: 'Exposant', icon: '🏪' },
    speaker: { label: 'Conférencier', icon: '🎤' },
    press: { label: 'Presse', icon: '📰' },
  };

  const tc = typeConfig[registrationType] || typeConfig.visitor;

  // Event format badge
  const formatBadge = isVirtual && isPhysical 
    ? '🔄 Hybride' 
    : isVirtual 
    ? '💻 Virtuel' 
    : '🏛️ Présentiel';

  const html = baseEmailTemplate({
    previewText: `Inscription confirmée - ${exhibitionName}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #DCFCE7; color: #166534; font-size: 13px; font-weight: 600; border-radius: 20px;">
              🎫 Inscription Confirmée
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700;">
              Bienvenue, ${userName} ! 🎉
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Votre inscription en tant que <strong>${tc.label}</strong> pour l'événement 
              <strong style="color: #006233;">${exhibitionName}</strong> a été confirmée avec succès !
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Event Card -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 24px; background: linear-gradient(135deg, #FDF4FF 0%, #FAE8FF 50%, #F3E8FF 100%); border-radius: 12px; border: 1px solid #E9D5FF;">
            <!-- Format Badge -->
            <div style="text-align: center; margin-bottom: 16px;">
              <span style="display: inline-block; padding: 6px 16px; background-color: rgba(139, 92, 246, 0.15); color: #7C3AED; font-size: 13px; font-weight: 600; border-radius: 20px;">
                ${formatBadge}
              </span>
            </div>
            
            <h3 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 22px; font-weight: 700; text-align: center;">
              ${exhibitionName}
            </h3>
            
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid rgba(139, 92, 246, 0.1);">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="width: 30px;"><span style="font-size: 18px;">📅</span></td>
                      <td>
                        <p style="margin: 0; color: #6B7280; font-size: 12px;">Date de début</p>
                        <p style="margin: 2px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${startDateFormatted}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${endDateFormatted ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid rgba(139, 92, 246, 0.1);">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="width: 30px;"><span style="font-size: 18px;">📆</span></td>
                      <td>
                        <p style="margin: 0; color: #6B7280; font-size: 12px;">Date de fin</p>
                        <p style="margin: 2px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${endDateFormatted}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid rgba(139, 92, 246, 0.1);">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="width: 30px;"><span style="font-size: 18px;">📍</span></td>
                      <td>
                        <p style="margin: 0; color: #6B7280; font-size: 12px;">Lieu</p>
                        <p style="margin: 2px 0 0 0; color: #1a1a1a; font-size: 14px;">${venueAddress}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="width: 30px;"><span style="font-size: 18px;">${tc.icon}</span></td>
                      <td>
                        <p style="margin: 0; color: #6B7280; font-size: 12px;">Type d'inscription</p>
                        <p style="margin: 2px 0 0 0; color: #7C3AED; font-size: 15px; font-weight: 600;">${tc.label}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Registration Number -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 16px 20px; background-color: #F0F9FF; border-radius: 8px; text-align: center;">
            <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
              Numéro d'inscription
            </p>
            <p style="margin: 0; color: #0369A1; font-size: 20px; font-weight: 700; letter-spacing: 1px;">
              ${registrationNumber}
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- CTAs -->
      ${emailButton({ url: exhibitionUrl, text: "Accéder à la page de l'événement", fullWidth: true })}
      
      ${addToCalendarUrl ? `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 12px;">
        <tr>
          <td style="text-align: center;">
            <a href="${addToCalendarUrl}" style="display: inline-block; padding: 10px 24px; background-color: transparent; color: #7C3AED; text-decoration: none; border: 2px solid #7C3AED; border-radius: 6px; font-size: 14px; font-weight: 600;">
              + Ajouter à mon calendrier
            </a>
          </td>
        </tr>
      </table>
      ` : ''}

      <!-- Next Steps -->
      ${alertBox({
        type: 'success',
        children: `
          <strong>📋 Prochaines étapes :</strong><br><br>
          ${registrationType === 'exhibitor' ? `
          • Vous recevrez les informations de votre stand sous peu<br>
          • Préparez vos produits et supports de présentation<br>
          • Configurez votre stand virtuel si applicable<br>
          ` : ''}
          ${registrationType === 'visitor' ? `
          • Explorez la liste des exposants avant l'événement<br>
          • Planifiez vos visites et rendez-vous<br>
          • Préparez vos questions pour les exposants<br>
          ` : ''}
          ${registrationType === 'speaker' ? `
          • Notre équipe vous contactera pour les détails techniques<br>
          • Préparez votre présentation et supports<br>
          • Rejoignez le brief des conférenciers avant l'événement<br>
          ` : ''}
          • Recevez des rappels avant le début de l'événement<br>
          • Présentez votre numéro d'inscription à l'entrée (événement physique)
        `,
      })}
    `,
  });

  const text = `
INSCRIPTION CONFIRMÉE

Bienvenue, ${userName} !

Votre inscription en tant que ${tc.label} pour l'événement ${exhibitionName} 
a été confirmée avec succès !

FORMAT : ${formatBadge}

ÉVÉNEMENT : ${exhibitionName}
Date de début : ${startDateFormatted}
${endDateFormatted ? `Date de fin : ${endDateFormatted}` : ''}
Lieu : ${venueAddress}
Type d'inscription : ${tc.label}

NUMÉRO D'INSCRIPTION : ${registrationNumber}

Accéder à la page de l'événement : ${exhibitionUrl}

PROCHAINES ÉTAPES :
${registrationType === 'exhibitor' ? '- Vous recevrez les informations de votre stand sous peu\n- Préparez vos produits et supports de présentation' : ''}
${registrationType === 'visitor' ? '- Explorez la liste des exposants avant l\'événement\n- Planifiez vos visites et rendez-vous' : ''}
- Recevez des rappels avant le début de l'événement
- Présentez votre numéro d'inscription à l'entrée

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
