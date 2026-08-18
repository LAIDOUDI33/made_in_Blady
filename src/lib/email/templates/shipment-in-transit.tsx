/**
 * Shipment In Transit Template
 * 
 * Sent when shipment status updates (in transit).
 * Includes current location and next steps.
 * 
 * @module lib/email/templates/shipment-in-transit
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface ShipmentInTransitProps {
  userName: string;
  orderNumber: string;
  trackingNumber: string;
  currentLocation: string;
  nextStep: string;
  estimatedDelivery: Date | string;
  carrierName: string;
  statusUpdate: string;
  trackingUrl: string;
  orderUrl: string;
  unsubscribeUrl?: string;
}

export function shipmentInTransitTemplate(props: ShipmentInTransitProps): { html: string; text: string } {
  const { 
    userName, 
    orderNumber, 
    trackingNumber,
    currentLocation,
    nextStep,
    estimatedDelivery,
    carrierName,
    statusUpdate,
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
    previewText: `Mise à jour d'expédition - ${orderNumber}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #FEF3C7; color: #92400E; font-size: 13px; font-weight: 600; border-radius: 20px;">
              🚚 Mise à jour d'expédition
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700">
              Votre colis avance, ${userName} ! 📍
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Il y a du nouveau concernant votre commande <strong style="color: #006233;">${orderNumber}</strong>. 
              Votre colis continue son voyage vers vous.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Status Update Card -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px; background-color: #FFFBEB; border-radius: 12px; border-left: 4px solid #F59E0B;">
            <h4 style="margin: 0 0 8px 0; color: #92400E; font-size: 14px; font-weight: 600;">
              📝 Dernière mise à jour
            </h4>
            <p style="margin: 0; color: #78350F; font-size: 14px; line-height: 1.6;">${statusUpdate}</p>
          </td>
        </tr>
      </table>

      <!-- Location & Progress Info -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px 24px;">
            <h4 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
              🗺️ Progression du colis
            </h4>
            
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #F3F4F6;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="width: 40px;"><span style="font-size: 24px;">📍</span></td>
                      <td>
                        <p style="margin: 0; color: #6B7280; font-size: 12px;">Position actuelle</p>
                        <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">${currentLocation}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #F3F4F6;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="width: 40px;"><span style="font-size: 24px;">➡️</span></td>
                      <td>
                        <p style="margin: 0; color: #6B7280; font-size: 12px;">Prochaine étape</p>
                        <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${nextStep}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #F3F4F6;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="width: 40px;"><span style="font-size: 24px;">📅</span></td>
                      <td>
                        <p style="margin: 0; color: #6B7280; font-size: 12px;">Livraison estimée</p>
                        <p style="margin: 4px 0 0 0; color: #16A34A; font-size: 15px; font-weight: 500;">${deliveryFormatted}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="width: 40px;"><span style="font-size: 24px;">🚛</span></td>
                      <td>
                        <p style="margin: 0; color: #6B7280; font-size: 12px;">Transporteur</p>
                        <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 14px;">${carrierName}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <!-- Tracking Number -->
            <div style="margin-top: 16px; padding: 12px; background-color: #F9FAFB; border-radius: 8px; text-align: center;">
              <p style="margin: 0 0 4px 0; color: #9CA3AF; font-size: 11px;">N° de suivi</p>
              <p style="margin: 0; color: #374151; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; font-family: monospace;">${trackingNumber}</p>
            </div>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Track CTA -->
      ${emailButton({ url: trackingUrl, text: '📍 Suivre en temps réel', fullWidth: true })}

      <!-- Info -->
      ${alertBox({
        type: 'info',
        children: `
          <strong>ℹ️ Note :</strong> Les mises à jour de suivi sont fournies par le transporteur. 
          Il peut y avoir un délai entre le mouvement réel du colis et la mise à jour du statut.
        `,
      })}
    `,
  });

  const text = `
MISE À JOUR D'EXPÉDITION

Votre colis avance, ${userName} !

Il y a du nouveau concernant votre commande ${orderNumber}.
Votre colis continue son voyage vers vous.

DERNIÈRE MISE À JOUR :
${statusUpdate}

PROGRESSION DU COLIS :
Position actuelle : ${currentLocation}
Prochaine étape : ${nextStep}
Livraison estimée : ${deliveryFormatted}
Transporteur : ${carrierName}

N° de suivi : ${trackingNumber}

Suivre en temps réel : ${trackingUrl}

Note : Les mises à jour de suivi sont fournies par le transporteur.

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
