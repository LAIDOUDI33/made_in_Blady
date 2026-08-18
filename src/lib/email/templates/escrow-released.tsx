/**
 * Escrow Released Template
 * 
 * Sent to seller when funds are released from escrow.
 * Confirms payment transfer to seller's account.
 * 
 * @module lib/email/templates/escrow-released
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface EscrowReleasedProps {
  userName: string;
  orderNumber: string;
  amount: number;
  currency: string;
  productName: string;
  buyerName: string;
  platformFee?: number;
  netAmount?: number;
  releaseDate: Date | string;
  orderUrl: string;
  unsubscribeUrl?: string;
}

export function escrowReleasedTemplate(props: EscrowReleasedProps): { html: string; text: string } {
  const { 
    userName, 
    orderNumber, 
    amount,
    currency,
    productName,
    buyerName,
    platformFee,
    netAmount,
    releaseDate,
    orderUrl,
    unsubscribeUrl 
  } = props;

  const formatPrice = (value: number) => new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value);

  const releaseFormatted = new Date(releaseDate).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = baseEmailTemplate({
    previewText: `Paiement reçu - Commande ${orderNumber}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge - Success -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #DCFCE7; color: #166534; font-size: 13px; font-weight: 600; border-radius: 20px;">
              💰 Paiement Libéré
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700;">
              Excellent ! Paiement reçu, ${userName} ! 🎉
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Les fonds pour la commande <strong style="color: #006233;">${orderNumber}</strong> ont été 
              libérés du séquestre et sont désormais disponibles sur votre compte.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Payment Details -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px 24px;">
            <h4 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
              📊 Récapitulatif du paiement
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
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Acheteur</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${buyerName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td><p style="margin: 0; color: #6B7280; font-size: 13px;">Montant total</p></td>
                      <td align="right"><p style="margin: 0; color: #1a1a1a; font-size: 14px;">${formatPrice(amount)}</p></td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${platformFee !== undefined && platformFee > 0 ? `
              <tr>
                <td style="padding: 6px 0; border-bottom: 1px solid #F3F4F6;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td><p style="margin: 0; color: #6B7280; font-size: 13px;">Commission plateforme (2%)</p></td>
                      <td align="right"><p style="margin: 0; color: #DC2626; font-size: 14px;">-${formatPrice(platformFee)}</p></td>
                    </tr>
                  </table>
                </td>
              </tr>
              ` : ''}
              ${netAmount !== undefined ? `
              <tr>
                <td style="padding: 12px 0; border-top: 2px solid #16A34A;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td><p style="margin: 0; color: #1a1a1a; font-size: 15px; font-weight: 700;">Net à recevoir</p></td>
                      <td align="right"><p style="margin: 0; color: #16A34A; font-size: 20px; font-weight: 700;">${formatPrice(netAmount)}</p></td>
                    </tr>
                  </table>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0; border-top: 1px solid #E5E7EB;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Date de libération</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 14px;">${releaseFormatted}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- CTA -->
      ${emailButton({ url: orderUrl, text: 'Voir la commande', fullWidth: true })}

      <!-- Next Steps -->
      ${alertBox({
        type: 'success',
        children: `
          <strong>✅ Prochaines étapes :</strong><br><br>
          • Le montant sera crédité sur votre compte sous 1-2 jours ouvrables<br>
          • Vous pouvez effectuer un retrait depuis votre tableau de bord<br>
          • Gardez une trace de cette transaction pour votre comptabilité<br>
          • Merci d'avoir fait confiance à AlgeriaTrade.dz !
        `,
      })}
    `,
  });

  const text = `
PAIEMENT LIBÉRÉ

Excellent ! Paiement reçu, ${userName} !

Les fonds pour la commande ${orderNumber} ont été libérés du séquestre 
et sont désormais disponibles sur votre compte.

RÉCAPITULATIF DU PAIEMENT :
N° de commande : ${orderNumber}
Produit : ${productName}
Acheteur : ${buyerName}
Montant total : ${formatPrice(amount)}
${platformFee !== undefined && platformFee > 0 ? `Commission plateforme (2%) : -${formatPrice(platformFee)}` : ''}
${netAmount !== undefined ? `Net à recevoir : ${formatPrice(netAmount)}` : ''}
Date de libération : ${releaseFormatted}

Voir la commande : ${orderUrl}

PROCHAINES ÉTAPES :
• Le montant sera crédité sur votre compte sous 1-2 jours ouvrables
• Vous pouvez effectuer un retrait depuis votre tableau de bord
• Merci d'avoir fait confiance à AlgeriaTrade.dz !

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
