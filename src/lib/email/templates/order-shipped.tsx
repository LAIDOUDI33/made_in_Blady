/**
 * Order Shipped Template
 * 
 * Sent to buyer when order is shipped with tracking info.
 * Includes tracking number, carrier, and estimated delivery.
 * 
 * @module lib/email/templates/order-shipped
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface OrderShippedProps {
  buyerName: string;
  orderNumber: string;
  supplierName: string;
  carrierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  itemsCount: number;
  orderUrl: string;
  unsubscribeUrl?: string;
}

export function orderShippedTemplate(props: OrderShippedProps): { html: string; text: string } {
  const { 
    buyerName, 
    orderNumber, 
    supplierName,
    carrierName,
    trackingNumber,
    trackingUrl,
    estimatedDelivery,
    itemsCount,
    orderUrl,
    unsubscribeUrl 
  } = props;

  // Format date
  const estimatedDeliveryFormatted = estimatedDelivery
    ? new Date(estimatedDelivery).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })
    : null;

  const html = baseEmailTemplate({
    previewText: `Votre commande ${orderNumber} a été expédiée !`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #DBEAFE; color: #1E40AF; font-size: 13px; font-weight: 600; border-radius: 20px;">
              🚚 Commande Expédiée
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: ${'#1a1a1a'}; font-size: 26px; font-weight: 700;">
              Bonne nouvelle, ${buyerName} ! 📦
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Votre commande <strong style="color: #006233;">${orderNumber}</strong> est en route ! 
              ${supplierName} vient d'expédier vos articles.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Shipment Info Card -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 24px;" align="center">
            <!-- Truck Icon -->
            <div style="width: 64px; height: 64px; background-color: #DBEAFE; border-radius: 50%; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 32px;">🚚</span>
            </div>
            
            <p style="margin: 0 0 16px 0; color: ${'#1a1a1a'}; font-size: 18px; font-weight: 600;">
              Votre colis a été remis au transporteur
            </p>
            
            ${carrierName ? `
            <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">
              Transporteur : <strong>${carrierName}</strong>
            </p>
            ` : ''}
            
            ${itemsCount ? `
            <p style="margin: 0; color: #6B7280; font-size: 14px;">
              Nombre d'articles : <strong>${itemsCount}</strong>
            </p>
            ` : ''}
          </td>
        </tr>
      </table>

      <!-- Tracking Section (if available) -->
      ${(trackingNumber || trackingUrl) ? `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px 24px; background-color: #F0FDF4; border-radius: 12px; border: 2px dashed #22C55E;">
          <h4 style="margin: 0 0 16px 0; color: #166534; font-size: 16px; font-weight: 600; text-align: center;">
            🔍 Suivre votre colis
          </h4>
          
          ${trackingNumber ? `
          <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin-bottom: 16px;">
            <tr>
              <td style="padding: 12px 24px; background-color: #ffffff; border-radius: 8px; text-align: center;">
                <p style="margin: 0 0 4px 0; color: #9CA3AF; font-size: 12px; text-transform: uppercase;">Numéro de suivi</p>
                <p style="margin: 0; color: #006233; font-size: 20px; font-weight: 700; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                  ${trackingNumber}
                </p>
              </td>
            </tr>
          </table>
          ` : ''}
          
          ${trackingUrl ? `
          <div style="text-align: center;">
            ${emailButton({ url: trackingUrl, text: 'Suivre mon colis en direct' })}
          </div>
          ` : ''}
          
          </td>
        </tr>
      </table>
      ` : ''}

      <!-- Estimated Delivery -->
      ${estimatedDeliveryFormatted ? `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 16px 20px; background-color: #FEF3C7; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #92400E; font-size: 15px;">
              📅 <strong>Livraison estimée :</strong> ${estimatedDeliveryFormatted}
            </p>
          </td>
        </tr>
      </table>
      ` : ''}

      ${divider()}

      <!-- CTA -->
      ${emailButton({ url: orderUrl, text: 'Voir les détails de ma commande', fullWidth: true })}

      <!-- Tips -->
      ${alertBox({
        type: 'info',
        children: `
          <strong>💡 Conseils pour la réception :</strong><br><br>
          • Vérifiez l'état du colis devant le livreur<br>
          • Signez le bon de livraison après vérification<br>
          • Conservez votre numéro de suivi jusqu'à réception<br>
          • Contactez-nous en cas de problème avec la livraison
        `,
      })}

      <!-- Support -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;">
        <tr>
          <td align="center" style="padding: 20px; background-color: #F9FAFB; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; color: #666666; font-size: 14px;">
              Question sur votre livraison ?
            </p>
            <p style="margin: 0; color: #888888; font-size: 13px;">
              Contactez <strong>${supplierName}</strong> ou notre support à 
              <a href="mailto:support@algeriatrade.dz" style="color: #006233; text-decoration: none;">support@algeriatrade.dz</a>
            </p>
          </td>
        </tr>
      </table>
    `,
  });

  const text = `
COMMANDE EXPÉDIÉE

Bonne nouvelle, ${buyerName} !

Votre commande ${orderNumber} est en route !
${supplierName} vient d'expédier vos articles.

INFORMATIONS D'EXPÉDITION :
${carrierName ? `Transporteur : ${carrierName}` : ''}
${itemsCount ? `Nombre d'articles : ${itemsCount}` : ''}

${trackingNumber ? `NUMÉRO DE SUIVI : ${trackingNumber}` : ''}
${trackingUrl ? `SUIVRE EN DIRECT : ${trackingUrl}` : ''}

${estimatedDeliveryFormatted ? `LIVRAISON ESTIMÉE : ${estimatedDeliveryFormatted}` : ''}

Détails de la commande : ${orderUrl}

CONSEILS POUR LA RÉCEPTION :
• Vérifiez l'état du colis devant le livreur
• Signez le bon de livraison après vérification
• Conservez votre numéro de suivi jusqu'à réception
• Contactez-nous en cas de problème avec la livraison

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
