/**
 * Shipment Delivered Template
 * 
 * Sent when shipment is delivered successfully.
 * Confirms delivery with proof if available.
 * 
 * @module lib/email/templates/shipment-delivered
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface ShipmentDeliveredProps {
  userName: string;
  orderNumber: string;
  trackingNumber: string;
  deliveryDate: Date | string;
  deliveryTime?: string;
  deliveredTo?: string;
  signatureAvailable: boolean;
  productName: string;
  reviewUrl?: string;
  orderUrl: string;
  supportUrl?: string;
  unsubscribeUrl?: string;
}

export function shipmentDeliveredTemplate(props: ShipmentDeliveredProps): { html: string; text: string } {
  const { 
    userName, 
    orderNumber, 
    trackingNumber,
    deliveryDate,
    deliveryTime,
    deliveredTo,
    signatureAvailable,
    productName,
    reviewUrl,
    orderUrl,
    supportUrl,
    unsubscribeUrl 
  } = props;

  const dateFormatted = new Date(deliveryDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = baseEmailTemplate({
    previewText: `Colis livré - ${orderNumber}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge - Success -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #DCFCE7; color: #166534; font-size: 13px; font-weight: 600; border-radius: 20px;">
              ✅ Colis Livré
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700;">
              Livré avec succès, ${userName} ! 🎉
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Votre commande <strong style="color: #006233;">${orderNumber}</strong> a été 
              livrée. Nous espérons que vous serez satisfait(e) de votre achat !
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Success Animation Card -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 32px; background: linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%); border-radius: 12px; text-align: center;">
            <p style="margin: 0 0 12px 0; font-size: 56px;">📦✨</p>
            <h3 style="margin: 0; color: #166534; font-size: 22px; font-weight: 700;">
              Livré !
            </h3>
          </td>
        </tr>
      </table>

      <!-- Delivery Details -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px 24px;">
            <h4 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
              📋 Détails de la livraison
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
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Produit</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${productName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Date de livraison</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">📅 ${dateFormatted}${deliveryTime ? ` à ${deliveryTime}` : ''}</p>
                </td>
              </tr>
              ${deliveredTo ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Livré à</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 14px;">👤 ${deliveredTo}</p>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <pre style="margin: 0; color: #6B7280; font-size: 13px;">N° de suivi</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 14px; font-family: monospace;">${trackingNumber}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Preuve de livraison</p>
                  <p style="margin: 4px 0 0 0; color: #16A34A; font-size: 14px; font-weight: 500;">
                    ${signatureAvailable ? '✅ Signature disponible' : '📷 Photo de preuve disponible'}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- CTAs -->
      ${reviewUrl ? `
      ${emailButton({ url: reviewUrl, text: '⭐ Laisser un avis', fullWidth: true })}
      ` : `
      ${emailButton({ url: orderUrl, text: 'Voir ma commande', fullWidth: true })}
      `}

      <!-- Next Steps / Support -->
      ${alertBox({
        type: 'success',
        children: `
          <strong>🎁 Prochaines étapes :</strong><br><br>
          • Vérifiez l'état de votre colis dès réception<br>
          • Confirmez la réception sur la plateforme (si applicable)<br>
          ${reviewUrl ? `• Partagez votre expérience en laissant un avis<br>` : ''}
          • Conservez l'emballage jusqu'à validation complète<br>
          ${supportUrl ? `• Un problème ? <a href="${supportUrl}" style="color: #006233; font-weight: 600;">Contactez-nous</a>` : ''}
        `,
      })}
    `,
  });

  const text =`
COLIS LIVRÉ

Livré avec succès, ${userName} !

Votre commande ${orderNumber} a été livrée.
Nous espérez que vous serez satisfait(e) de votre achat !

DÉTAILS DE LA LIVRAISON :
N° de commande : ${orderNumber}
Produit : ${productName}
Date de livraison : ${dateFormatted}${deliveryTime ? ` à ${deliveryTime}` : ''}
${deliveredTo ? `Livré à : ${deliveredTo}` : ''}
N° de suivi : ${trackingNumber}
Preuve de livraison : ${signatureAvailable ? 'Signature disponible' : 'Photo disponible'}

${reviewUrl ? `Laisser un avis : ${reviewUrl}` : `Voir ma commande : ${orderUrl}`}

PROCHAINES ÉTAPES :
• Vérifiez l'état de votre colis dès réception
• Confirmez la réception sur la plateforme
${reviewUrl ? '- Partagez votre expérience en laissant un avis' : ''}
• Conservez l'emballage jusqu'à validation complète

Merci d'avoir choisi AlgeriaTrade.dz !

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
