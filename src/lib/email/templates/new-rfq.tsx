/**
 * New RFQ Notification Template
 * 
 * Sent to matching suppliers when a new RFQ is posted.
 * Includes RFQ details and link to respond.
 * 
 * @module lib/email/templates/new-rfq
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface NewRFQProps {
  supplierName: string;
  rfqTitle: string;
  rfqDescription: string;
  category: string;
  quantity: number;
  unit: string;
  buyerLocation?: string; // Wilaya
  requiredDate?: Date;
  rfqUrl: string;
  respondUrl: string;
  unsubscribeUrl?: string;
}

export function newRFQTemplate(props: NewRFQProps): { html: string; text: string } {
  const { 
    supplierName, 
    rfqTitle, 
    rfqDescription,
    category,
    quantity,
    unit,
    buyerLocation,
    requiredDate,
    rfqUrl,
    respondUrl,
    unsubscribeUrl 
  } = props;

  // Format date if provided
  const requiredDateFormatted = requiredDate
    ? new Date(requiredDate).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const html = baseEmailTemplate({
    previewText: `Nouvelle demande de devis : ${rfqTitle}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #FEF3C7; color: #92400E; font-size: 13px; font-weight: 600; border-radius: 20px;">
              📋 Nouvelle Demande de Devis
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: ${'#1a1a1a'}; font-size: 26px; font-weight: 700;">
              Bonjour, ${supplierName} ! 👋
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Une nouvelle demande de devis correspond à votre domaine d'activité. 
              Répondez rapidement pour augmenter vos chances !
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- RFQ Details Card -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden;">
        <!-- Card Header -->
        <tr>
          <td style="padding: 20px 24px; background-color: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
            <h3 style="margin: 0; color: ${'#1a1a1a'}; font-size: 18px; font-weight: 700; line-height: 1.3;">
              ${rfqTitle}
            </h3>
          </td>
        </tr>
        
        <!-- Card Body -->
        <tr>
          <td style="padding: 24px;">
            <!-- Description -->
            <p style="margin: 0 0 20px 0; color: #4B5563; font-size: 15px; line-height: 1.6;">
              ${rfqDescription.length > 300 ? rfqDescription.substring(0, 300) + '...' : rfqDescription}
            </p>
            
            <!-- Details Grid -->
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td valign="top" width="50%" style="padding-right: 12px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6;">
                        <p style="margin: 0 0 4px 0; color: #9CA3AF; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Catégorie</p>
                        <p style="margin: 0; color: ${'#1a1a1a'}; font-size: 14px; font-weight: 600;">${category}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <p style="margin: 0 0 4px 0; color: #9CA3AF; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Quantité</p>
                        <p style="margin: 0; color: ${'#1a1a1a'}; font-size: 14px; font-weight: 600;">${quantity.toLocaleString('fr-FR')} ${unit}</p>
                      </td>
                    </tr>
                  </table>
                </td>
                <td valign="top" width="50%" style="padding-left: 12px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6;">
                        <p style="margin: 0 0 4px 0; color: #9CA3AF; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Localisation acheteur</p>
                        <p style="margin: 0; color: ${'#1a1a1a'}; font-size: 14px; font-weight: 600;">${buyerLocation || 'Non spécifiée'}</p>
                      </td>
                    </tr>
                    ${requiredDateFormatted ? `
                    <tr>
                      <td style="padding: 8px 0;">
                        <p style="margin: 0 0 4px 0; color: #9CA3AF; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Date souhaitée</p>
                        <p style="margin: 0; color: ${'#1a1a1a'}; font-size: 14px; font-weight: 600;">${requiredDateFormatted}</p>
                      </td>
                    </tr>
                    ` : ''}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- CTA Buttons -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 12px;">
            ${emailButton({ url: respondUrl, text: 'Soumettre un devis', fullWidth: true })}
          </td>
        </tr>
        <tr>
          <td align="center">
            <a href="${rfqUrl}" style="color: #6B7280; font-size: 14px; text-decoration: none;">
              Voir les détails complets →
            </a>
          </td>
        </tr>
      </table>

      <!-- Tips -->
      ${alertBox({
        type: 'info',
        children: `
          <strong>💡 Astuce :</strong> Les fournisseurs qui répondent dans les premières 24h ont 
          3x plus de chances de remporter le contrat. Incluez un prix compétitif, des délais réalistes 
          et vos conditions de paiement.
        `,
      })}

      <!-- Urgency Notice -->
      ${alertBox({
        type: 'warning',
        children: `
          ⚠️ Cette offre peut recevoir plusieurs réponses. Ne tardez pas à faire votre proposition !
        `,
      })}
    `,
  });

  const text = `
NOUVELLE DEMANDE DE DEVIS

Bonjour, ${supplierName} !

Une nouvelle demande de correspond à votre domaine d'activité.

TITRE : ${rfqTitle}

DESCRIPTION :
${rfqDescription}

DÉTAILS :
- Catégorie : ${category}
- Quantité : ${quantity.toLocaleString('fr-FR')} ${unit}
- Localisation acheteur : ${buyerLocation || 'Non spécifiée'}
${requiredDateFormatted ? `- Date souhaitée : ${requiredDateFormatted}` : ''}

Répondre maintenant : ${respondUrl}
Voir les détails : ${rfqUrl}

ASTUCE :
Les fournisseurs qui répondent dans les premières 24h ont 3x plus de chances 
de remporter le contrat. Incluez un prix compétitif, des délais réalistes et 
vos conditions de paiement.

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
