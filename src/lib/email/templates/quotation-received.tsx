/**
 * Quotation Received Template
 * 
 * Sent to buyer when a supplier submits a quotation for their RFQ.
 * Includes supplier info, pricing, and action buttons.
 * 
 * @module lib/email/templates/quotation-received
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface QuotationReceivedProps {
  buyerName: string;
  supplierName: string;
  supplierRating?: number;
  supplierReviewCount?: number;
  isVerified: boolean;
  rfqTitle: string;
  totalPrice: number;
  currency: string;
  validUntil?: Date;
  quotationUrl: string;
  acceptUrl: string;
  rejectUrl: string;
  messagesUrl?: string;
  unsubscribeUrl?: string;
}

export function quotationReceivedTemplate(props: QuotationReceivedProps): { html: string; text: string } {
  const { 
    buyerName, 
    supplierName, 
    supplierRating,
    supplierReviewCount,
    isVerified,
    rfqTitle,
    totalPrice,
    currency,
    validUntil,
    quotationUrl,
    acceptUrl,
    rejectUrl,
    messagesUrl,
    unsubscribeUrl 
  } = props;

  // Format price
  const formattedPrice = new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(totalPrice);

  const validUntilFormatted = validUntil
    ? new Date(validUntil).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  // Generate stars for rating
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '½';
    stars += '☆'.repeat(5 - Math.ceil(rating));
    return stars;
  };

  const html = baseEmailTemplate({
    previewText: `Nouveau devis de ${supplierName} pour "${rfqTitle}"`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #DBEAFE; color: #1E40AF; font-size: 13px; font-weight: 600; border-radius: 20px;">
              💰 Nouveau Devis Reçu
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: ${'#1a1a1a'}; font-size: 26px; font-weight: 700;">
              Bonjour, ${buyerName} ! 🎉
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Vous avez reçu un nouveau devis en réponse à votre demande.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Supplier Info Card -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
        <tr>
          <td style="padding: 20px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <!-- Avatar placeholder -->
                <td valign="top" width="56" style="padding-right: 16px;">
                  <div style="width: 48px; height: 48px; background-color: #006233; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 18px; font-weight: 700;">${supplierName.charAt(0)}</span>
                  </div>
                </td>
                <td valign="top">
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin: 0; color: ${'#1a1a1a'}; font-size: 17px; font-weight: 600;">
                          ${supplierName}
                          ${isVerified ? '<span style="display: inline-block; margin-left: 8px; padding: 2px 8px; background-color: #DCFCE7; color: #166534; font-size: 11px; font-weight: 600; border-radius: 12px;">✓ Vérifié</span>' : ''}
                        </p>
                        ${supplierRating ? `
                        <p style="margin: 4px 0 0 0; color: #F59E0B; font-size: 14px;">
                          ${renderStars(supplierRating)} 
                          <span style="color: #6B7280; font-size: 13px;">(${supplierRating}/5 - ${supplierReviewCount || 0} avis)</span>
                        </p>
                        ` : ''}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Quotation Details Card -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden;">
        <!-- Card Header -->
        <tr>
          <td style="padding: 20px 24px; background-color: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
            <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 13px;">Pour votre demande :</p>
            <h3 style="margin: 0; color: ${'#1a1a1a'}; font-size: 16px; font-weight: 700; line-height: 1.3;">
              ${rfqTitle}
            </h3>
        </td>
        </tr>
        
        <!-- Price Section -->
        <tr>
          <td style="padding: 24px;" align="center">
            <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">Prix total proposé</p>
            <p style="margin: 0; color: #006233; font-size: 36px; font-weight: 700;">
              ${formattedPrice}
            </p>
            ${validUntilFormatted ? `
            <p style="margin: 12px 0 0 0; color: #F59E0B; font-size: 13px; font-weight: 500;">
              ⏰ Valable jusqu'au ${validUntilFormatted}
            </p>
            ` : ''}
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Action Buttons -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 12px;">
            ${emailButton({ url: acceptUrl, text: '✓ Accepter ce devis', fullWidth: true })}
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 12px;" align="center">
            <a href="${rejectUrl}" style="display: inline-block; padding: 12px 32px; border: 2px solid #E5E7EB; color: #6B7280; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
              ✗ Refuser
            </a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top: 8px;">
            <a href="${quotationUrl}" style="color: #6B7280; font-size: 14px; text-decoration: none;">
              Voir les détails complets →
            </a>
          </td>
        </tr>
      </table>

      <!-- Message Option -->
      ${messagesUrl ? `
      ${divider()}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 16px; background-color: #F9FAFB; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; color: #666666; font-size: 14px;">
              💬 Des questions ? Contactez le fournisseur directement
            </p>
            <a href="${messagesUrl}" style="color: #006233; font-size: 14px; font-weight: 600; text-decoration: none;">
              Envoyer un message →
            </a>
          </td>
        </tr>
      </table>
      ` : ''}

      <!-- Tips -->
      ${alertBox({
        type: 'info',
        children: `
          <strong>💡 Prochaines étapes après acceptation :</strong><br><br>
          • Le fournisseur sera notifié et pourra préparer la commande<br>
          • Vous recevrez une confirmation avec les détails de livraison<br>
          • Le paiement sera organisé selon les conditions convenues
        `,
      })}
    `,
  });

  const text = `
NOUVEAUX DEVIS REÇU

Bonjour, ${buyerName} !

Vous avez reçu un nouveau devis en réponse à votre demande.

FOURNISSEUR :
${supplierName} ${isVerified ? '(Vérifié)' : ''}
${supplierRating ? `Note : ${supplierRating}/5 (${supplierReviewCount || 0} avis)` : ''}

POUR VOTRE DEMANDE :
${rfqTitle}

PRIX TOTAL PROPOSÉ : ${formattedPrice}
${validUntilFormatted ? `Valable jusqu'au : ${validUntilFormatted}` : ''}

ACTIONS :
- Accepter : ${acceptUrl}
- Refuser : ${rejectUrl}
- Détails : ${quotationUrl}
${messagesUrl ? `- Contacter le fournisseur : ${messagesUrl}` : ''}

PROCHAINES ÉTAPES APRÈS ACCEPTATION :
• Le fournisseur sera notifié et pourra préparer la commande
• Vous recevrez une confirmation avec les détails de livraison
• Le paiement sera organisé selon les conditions convenues

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
