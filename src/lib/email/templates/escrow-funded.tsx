/**
 * Escrow Funded Template
 * 
 * Sent to both buyer and seller when escrow is funded.
 * Confirms that funds are securely held by the platform.
 * 
 * @module lib/email/templates/escrow-funded
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface EscrowFundedProps {
  userName: string;
  orderNumber: string;
  amount: number;
  currency: string;
  productName: string;
  sellerName?: string;
  buyerName?: string;
  autoReleaseDate?: Date | string;
  escrowUrl: string;
  unsubscribeUrl?: string;
}

export function escrowFundedTemplate(props: EscrowFundedProps): { html: string; text: string } {
  const { 
    userName, 
    orderNumber, 
    amount,
    currency,
    productName,
    sellerName,
    buyerName,
    autoReleaseDate,
    escrowUrl,
    unsubscribeUrl 
  } = props;

  // Format price
  const formatPrice = (value: number) => new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value);

  const autoReleaseFormatted = autoReleaseDate
    ? new Date(autoReleaseDate).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const html = baseEmailTemplate({
    previewText: `Séquestre activé - Commande ${orderNumber}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #DBEAFE; color: #1E40AF; font-size: 13px; font-weight: 600; border-radius: 20px;">
              🔒 Séquestre Activé
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700;">
              Fonds en sécurité, ${userName} ! 🛡️
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Le paiement pour la commande <strong style="color: #006233;">${orderNumber}</strong> a été 
              reçu et est maintenant sécurisé dans notre compte de séquestre.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Order Details -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px 24px;">
            <h4 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
              💰 Détails du séquestre
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
              ${sellerName ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Vendeur</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${sellerName}</p>
                </td>
              </tr>
              ` : ''}
              ${buyerName ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Acheteur</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${buyerName}</p>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Montant séquestré</p>
                  <p style="margin: 4px 0 0 0; color: #16A34A; font-size: 22px; font-weight: 700;">${formatPrice(amount)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${autoReleaseFormatted ? `
      <!-- Auto Release Info -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 16px 20px; background-color: #FEF3C7; border-radius: 8px;">
            <p style="margin: 0; color: #92400E; font-size: 14px;">
              ⏰ <strong>Date de libération automatique :</strong> ${autoReleaseFormatted}
            </p>
            <p style="margin: 8px 0 0 0; color: #A16207; font-size: 13px;">
              Si aucun litige n'est ouvert, les fonds seront automatiquement libérés à cette date.
            </p>
          </td>
        </tr>
      </table>
      ` : ''}

      ${divider()}

      <!-- CTA -->
      ${emailButton({ url: escrowUrl, text: 'Voir les détails du séquestre', fullWidth: true })}

      <!-- Protection Info -->
      ${alertBox({
        type: 'success',
        children: `
          <strong>🛡️ Protection Trade Assurance :</strong><br><br>
          • Vos fonds sont sécurisés jusqu'à confirmation de réception<br>
          • Possibilité d'ouvrir un litige si problème<br>
          • Remboursement garanti en cas de litige validé<br>
          • Support client disponible 7j/7
        `,
      })}
    `,
  });

  const text = `
SÉQUESTRE ACTIVÉ

Fonds en sécurité, ${userName} !

Le paiement pour la commande ${orderNumber} a été reçu et est maintenant 
sécurisé dans notre compte de séquestre.

DÉTAILS DU SÉQUESTRE :
N° de commande : ${orderNumber}
Produit : ${productName}
${sellerName ? `Vendeur : ${sellerName}` : ''}
${buyerName ? `Acheteur : ${buyerName}` : ''}
Montant séquestré : ${formatPrice(amount)}

${autoReleaseFormatted ? `Date de libération automatique : ${autoReleaseFormatted}` : ''}

Voir les détails du séquestre : ${escrowUrl}

PROTECTION TRADE ASSURANCE :
• Vos fonds sont sécurisés jusqu'à confirmation de réception
• Possibilité d'ouvrir un litige si problème
• Remboursement garanti en cas de litige validé

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
