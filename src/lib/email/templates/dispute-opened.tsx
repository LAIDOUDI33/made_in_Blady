/**
 * Dispute Opened Template
 * 
 * Sent to both parties when a new dispute is opened.
 * Includes dispute details and next steps for resolution.
 * 
 * @module lib/email/templates/dispute-opened
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface DisputeOpenedProps {
  userName: string;
  orderNumber: string;
  amount: number;
  currency: string;
  productName: string;
  disputeReason: string;
  openedBy: string; // Name of who opened the dispute
  otherParty: string; // Name of the other party
  responseDeadline: Date | string;
  disputeUrl: string;
  isOpener?: boolean; // True if receiving user opened the dispute
  unsubscribeUrl?: string;
}

export function disputeOpenedTemplate(props: DisputeOpenedProps): { html: string; text: string } {
  const { 
    userName, 
    orderNumber, 
    amount,
    currency,
    productName,
    disputeReason,
    openedBy,
    otherParty,
    responseDeadline,
    disputeUrl,
    isOpener = false,
    unsubscribeUrl 
  } = props;

  const formatPrice = (value: number) => new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value);

  const deadlineFormatted = new Date(responseDeadline).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = baseEmailTemplate({
    previewText: `Nouveau litige ouvert - Commande ${orderNumber}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge - Warning -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #FEF3C7; color: #92400E; font-size: 13px; font-weight: 600; border-radius: 20px;">
              ⚠️ Nouveau Litige
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700;">
              ${isOpener ? 'Votre litige a été créé' : 'Un litige a été ouvert'}, ${userName}
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              ${isOpener 
                ? `Votre litige pour la commande <strong style="color: #006233;">${orderNumber}</strong> a été créé avec succès. L'autre partie (<strong>${otherParty}</strong>) a été notifiée.`
                : `<strong>${openedBy}</strong> a ouvert un litige pour la commande <strong style="color: #006233;">${orderNumber}</strong>. Votre réponse est requise.`
              }
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Dispute Details -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px 24px;">
            <h4 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
              📋 Détails du litige
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
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Montant concerné</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">${formatPrice(amount)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Raison du litige</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 14px; line-height: 1.5;">${disputeReason}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Date limite de réponse</p>
                  <p style="margin: 4px 0 0 0; color: #DC2626; font-size: 15px; font-weight: 600;">⏰ ${deadlineFormatted}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${!isOpener ? `
      <!-- Action Required Box -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px; background-color: #FEF2F2; border-radius: 8px; border-left: 4px solid #DC2626;">
            <h4 style="margin: 0 0 8px 0; color: #991B1B; font-size: 14px; font-weight: 600;">
              ⚡ Action requise de votre part
            </h4>
            <p style="margin: 0; color: #7F1D1D; font-size: 14px; line-height: 1.6;">
              Vous devez répondre à ce litige avant la date limite. En l'absence de réponse, 
              le litige pourra être tranché en faveur de l'autre partie.
            </p>
          </td>
        </tr>
      </table>
      ` : ''}

      ${divider()}

      <!-- CTA -->
      ${emailButton({ url: disputeUrl, text: isOpener ? 'Voir mon litige' : 'Répondre au litige', fullWidth: true })}

      <!-- Process Info -->
      ${alertBox({
        type: 'warning',
        children: `
          <strong>📝 Processus de résolution :</strong><br><br>
          1. Les deux parties peuvent présenter leurs arguments et preuves<br>
          2. Un médiateur peut être assigné si nécessaire<br>
          3. Tentative de médiation amiable pendant 7 jours<br>
          4. Si échec, passage à l'arbitrage final<br>
          5. Décision finale exécutoire
        `,
      })}
    `,
  });

  const text = `
NOUVEAU LITIGE OUVERT

${isOpener ? 'Votre litige a été créé' : 'Un litige a été ouvert'}, ${userName}

${isOpener 
  ? `Votre litige pour la commande ${orderNumber} a été créé avec succès. L'autre partie (${otherParty}) a été notifiée.`
  : `${openedBy} a ouvert un litige pour la commande ${orderNumber}. Votre réponse est requise.`
}

DÉTAILS DU LITIGE :
N° de commande : ${orderNumber}
Produit : ${productName}
Montant concerné : ${formatPrice(amount)}
Raison du litige : ${disputeReason}
Date limite de réponse : ${deadlineFormatted}

${!isOpener ? `ACTION REQUISE :
Vous devez répondre à ce litige avant la date limite.` : ''}

${disputeUrl}

PROCESSUS DE RÉSOLUTION :
1. Les deux parties peuvent présenter leurs arguments et preuves
2. Un médiateur peut être assigné si nécessaire
3. Tentative de médiation amiable pendant 7 jours
4. Si échec, passage à l'arbitrage final
5. Décision finale exécutoire

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
