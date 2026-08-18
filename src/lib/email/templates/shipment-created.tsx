/**
 * Shipment Created Template
 * 
 * Sent to buyer when order is shipped.
 * Includes tracking number and carrier info.
 * 
 * @module lib/email/templates/shipment-created
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface ShipmentCreatedProps {
  userName: string;
  orderNumber: string;
  trackingNumber: string;
  carrierName: string;
  productName: string;
  estimatedDelivery: Date | string;
  shippingMethod: string;
  originAddress?: string;
  destinationAddress: string;
  trackingUrl: string;
  orderUrl: string;
  unsubscribeUrl?: string;
}

export function shipmentCreatedTemplate(props: ShipmentCreatedProps): { html: string; text: string } {
  const { 
    userName, 
    orderNumber, 
    trackingNumber,
    carrierName,
    productName,
    estimatedDelivery,
    shippingMethod,
    originAddress,
    destinationAddress,
    trackingUrl,
    orderUrl,
    unsubscribeUrl 
  } = props;

  const deliveryFormatted = new Date(estimatedDelivery).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = baseEmailTemplate({
    previewText: `Commande expédiée - ${orderNumber}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #DBEAFE; color: #1E40AF; font-size: 13px; font-weight: 600; border-radius: 20px;">
              📦 Commande Expédiée
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700;">
              En route vers vous, ${userName} ! 🚚
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Bonne nouvelle ! Votre commande <strong style="color: #006233;">${orderNumber}</strong> a été 
              expédiée et est en chemin.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Tracking Card -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 24px; background-color: #F0F9FF; border-radius: 12px; border: 1px solid #BAE6FD;">
            <h4 style="margin: 0 0 16px 0; color: #0369A1; font-size: 15px; font-weight: 600;">
              🔍 Suivi de colis
            </h4>
            
            <!-- Tracking Number Display -->
            <div style="text-align: center; padding: 16px; background-color: white; border-radius: 8px; margin-bottom: 16px;">
              <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 12px;">Numéro de suivi</p>
              <p style="margin: 0; color: #0369A1; font-size: 22px; font-weight: 700; letter-spacing: 1px; font-family: monospace;">
                ${trackingNumber}
              </p>
            </div>
            
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid rgba(186, 230, 253, 0.5);">
                  <p style="margin: 0; color: #64748B; font-size: 13px;">Transporteur</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">🚛 ${carrierName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid rgba(186, 230, 253, 0.5);">
                  <p style="margin: 0; color: #64748B; font-size: 13px;">Mode de livraison</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 14px;">${shippingMethod}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <p style="margin: 0; color: #64748B; font-size: 13px;">Livraison estimée</p>
                  <p style="margin: 4px 0 0 0; color: #16A34A; font-size: 15px; font-weight: 500;">📅 ${deliveryFormatted}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Order Details -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px 24px;">
            <h4 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
              📋 Détails de la commande
            </h4>
            
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">N° de commande</p>
                  <p style="margin: 4px 0 0 0; color: #006233; font-size: 16px; font-weight: 600;">${orderNumber}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Produit</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${productName}</p>
                </td>
              </tr>
              ${originAddress ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Expédition depuis</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 13px;">${originAddress}</p>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Adresse de livraison</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 13px;">📍 ${destinationAddress}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Track CTA -->
      ${emailButton({ url: trackingUrl, text: '📍 Suivre mon colis', fullWidth: true })}

      <!-- Secondary CTA -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 12px;">
        <tr>
          <td style="text-align: center;">
            <a href="${orderUrl}" style="display: inline-block; padding: 10px 24px; background-color: transparent; color: #006233; text-decoration: none; border: 2px solid #006233; border-radius: 6px; font-size: 14px; font-weight: 600;">
              Voir ma commande
            </a>
          </td>
        </tr>
      </table>

      <!-- Info Box -->
      ${alertBox({
        type: 'info',
        children: `
          <strong>💡 Informations utiles :</strong><br><br>
          • Vous pouvez suivre votre colis en temps réel via le lien ci-dessus<br>
          • La date de livraison est une estimation et peut varier<br>
          • Assurez-vous que quelqu'un est disponible pour réceptionner le colis<br>
          • En cas de problème, contactez le transporteur ou notre support
        `,
      })}
    `,
  });

  const text = `
COMMANDE EXPÉDIÉE

En route vers vous, ${userName} !

Bonne nouvelle ! Votre commande ${orderNumber} a été expédiée 
et est en chemin.

SUIVI DE COLIS :
Numéro de suivi : ${trackingNumber}
Transporteur : ${carrierName}
Mode de livraison : ${shippingMethod}
Livraison estimée : ${deliveryFormatted}

DÉTAILS DE LA COMMANDE :
N° de commande : ${orderNumber}
Produit : ${productName}
${originAddress ? `Expédition depuis : ${originAddress}` : ''}
Adresse de livraison : ${destinationAddress}

Suivre mon colis : ${trackingUrl}
Voir ma commande : ${orderUrl}

INFORMATIONS UTILES :
• Vous pouvez suivre votre colis en temps réel via le lien ci-dessus
• La date de livraison est une estimation et peut varier
• Assurez-vous que quelqu'un est disponible pour réceptionner le colis

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
