/**
 * Booth Confirmed Template
 * 
 * Sent to exhibitor when their booth assignment is confirmed.
 * Includes booth number, location details, and setup instructions.
 * 
 * @module lib/email/templates/booth-confirmed
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface BoothConfirmedProps {
  userName: string;
  exhibitionName: string;
  boothNumber: string;
  boothSize: string; // e.g., "3m x 3m"
  boothLocation: string; // e.g., "Hall A, Allée 5"
  eventDate: Date | string;
  venueAddress: string;
  setupDate?: Date | string;
  setupTime?: string;
  includesFurniture: boolean;
  includesElectricity: boolean;
  includesWifi: boolean;
  virtualBoothUrl?: string;
  exhibitionUrl: string;
  unsubscribeUrl?: string;
}

export function boothConfirmedTemplate(props: BoothConfirmedProps): { html: string; text: string } {
  const { 
    userName, 
    exhibitionName, 
    boothNumber,
    boothSize,
    boothLocation,
    eventDate,
    venueAddress,
    setupDate,
    setupTime,
    includesFurniture,
    includesElectricity,
    includesWifi,
    virtualBoothUrl,
    exhibitionUrl,
    unsubscribeUrl 
  } = props;

  const dateFormatted = new Date(eventDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const setupFormatted = setupDate
    ? `${new Date(setupDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}${setupTime ? ` à ${setupTime}` : ''}`
    : null;

  const html = baseEmailTemplate({
    previewText: `Stand confirmé - ${exhibitionName}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #DCFCE7; color: #166534; font-size: 13px; font-weight: 600; border-radius: 20px;">
              🏪 Stand Confirmé
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700;">
              Votre stand est prêt, ${userName} ! 🎪
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Nous avons le plaisir de confirmer l'attribution de votre stand pour 
              <strong style="color: #006233;">${exhibitionName}</strong>. 
              Voici tous les détails de votre espace d'exposition.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Booth Card -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 28px; background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border-radius: 12px; border: 2px solid #10B981;">
            <!-- Booth Number Display -->
            <div style="text-align: center; margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0; color: #059669; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                Votre numéro de stand
              </p>
              <div style="display: inline-block; padding: 16px 40px; background-color: #059669; color: white; font-size: 36px; font-weight: 700; border-radius: 12px; letter-spacing: 2px;">
                ${boothNumber}
              </div>
            </div>
            
            <!-- Booth Details Grid -->
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="width: 50%; padding: 12px; vertical-align: top;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding: 8px; background-color: rgba(255,255,255,0.7); border-radius: 8px; text-align: center;">
                        <p style="margin: 0 0 4px 0; color: #047857; font-size: 12px;">Dimensions</p>
                        <p style="margin: 0; color: #065F46; font-size: 18px; font-weight: 700;">${boothSize}</p>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="width: 50%; padding: 12px; vertical-align: top;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding: 8px; background-color: rgba(255,255,255,0.7); border-radius: 8px; text-align: center;">
                        <p style="margin: 0 0 4px 0; color: #047857; font-size: 12px;">Emplacement</p>
                        <p style="margin: 0; color: #065F46; font-size: 16px; font-weight: 600;">${boothLocation}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Event & Setup Info -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px 24px;">
            <h4 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
              📅 Dates et lieu
            </h4>
            
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Événement</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${exhibitionName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Date de l'événement</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">📅 ${dateFormatted}</p>
                </td>
              </tr>
              ${setupFormatted ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Installation (montage)</p>
                  <p style="margin: 4px 0 0 0; color: #F59E0B; font-size: 15px; font-weight: 500;">⚙️ ${setupFormatted}</p>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Adresse du lieu</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 14px;">📍 ${venueAddress}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Included Amenities -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px; background-color: #F9FAFB; border-radius: 8px;">
            <h4 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">
              ✨ Équipements inclus
            </h4>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <span style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background-color: ${includesFurniture ? '#DCFCE7' : '#FEE2E2'}; color: ${includesFurniture ? '#166534' : '#991B1B'}; font-size: 13px; font-weight: 500; border-radius: 20px;">
                ${includesFurniture ? '✅' : '❌'} Mobilier
              </span>
              <span style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background-color: ${includesElectricity ? '#DCFCE7' : '#FEE2E2'}; color: ${includesElectricity ? '#166534' : '#991B1B'}; font-size: 13px; font-weight: 500; border-radius: 20px;">
                ${includesElectricity ? '✅' : '❌'} Électricité
              </span>
              <span style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background-color: ${includesWifi ? '#DCFCE7' : '#FEE2E2'}; color: ${includesWifi ? '#166534' : '#991B1B'}; font-size: 13px; font-weight: 500; border-radius: 20px;">
                ${includesWifi ? '✅' : '❌'} WiFi
              </span>
            </div>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- CTAs -->
      ${virtualBoothUrl ? `
      ${emailButton({ url: virtualBoothUrl, text: 'Configurer mon stand virtuel', fullWidth: true })}
      ` : `
      ${emailButton({ url: exhibitionUrl, text: 'Voir les détails de mon stand', fullWidth: true })}
      `}

      <!-- Preparation Tips -->
      ${alertBox({
        type: 'success',
        children: `
          <strong>📦 Préparation de votre stand :</strong><br><br>
          • Préparez vos bannières et supports visuels aux dimensions du stand<br>
          ${setupFormatted ? `• Présentez-vous à l'heure pour l'installation (${setupFormatted})<br>` : ''}
          • Organisez vos produits et échantillons à l'avance<br>
          • Préparez vos documents commerciaux (catalogues, cartes de visite)<br>
          • Formez votre staff sur les messages clés et prix<br>
          ${!includesFurniture ? '• Prévoyez votre mobilier (tables, chaises, présentoirs)<br>' : ''}
          • Testez tout équipement technique avant l'ouverture
        `,
      })}
    `,
  });

  const text =`
STAND CONFIRMÉ

Votre stand est prêt, ${userName} !

Nous avons le plaisir de confirmer l'attribution de votre stand pour 
${exhibitionName}. Voici tous les détails de votre espace d'exposition.

VOTRE STAND :
Numéro : ${boothNumber}
Dimensions : ${boothSize}
Emplacement : ${boothLocation}

DATES ET LIEU :
Événement : ${exhibitionName}
Date de l'événement : ${dateFormatted}
${setupFormatted ? `Installation : ${setupFormatted}` : ''}
Adresse : ${venueAddress}

ÉQUIPEMENTS INCLUS :
Mobilier : ${includesFurniture ? 'Oui' : 'Non'}
Électricité : ${includesElectricity ? 'Oui' : 'Non'}
WiFi : ${includesWifi ? 'Oui' : 'Non'}

${virtualBoothUrl ? `Configurer mon stand virtuel : ${virtualBoothUrl}` : `Voir les détails : ${exhibitionUrl}`}

PRÉPARATION DE VOTRE STAND :
• Préparez vos bannières et supports visuels aux dimensions du stand
• Organisez vos produits et échantillons à l'avance
• Préparez vos documents commerciaux
• Formez votre staff sur les messages clés et prix
• Testez tout équipement technique avant l'ouverture

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
