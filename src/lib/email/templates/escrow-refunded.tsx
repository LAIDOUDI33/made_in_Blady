/**
 * Escrow Refunded Template
 * 
 * Sent to buyer when a refund is initiated from escrow.
 * Confirms refund details and expected timeline.
 * 
 * @module lib/email/templates/escrow-refunded
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface EscrowRefundedProps {
  userName: string;
  orderNumber: string;
  amount: number;
  currency: string;
  productName: string;
  sellerName: string;
  refundReason: string;
  refundType: 'full' | 'partial';
  expectedCreditDate?: Date | string;
  orderUrl: string;
  supportUrl?: string;
  unsubscribeUrl?: string;
}

export function escrowRefundedTemplate(props: EscrowRefundedProps): { html: string; text: string } {
  const { 
    userName, 
    orderNumber, 
    amount,
    currency,
    productName,
    sellerName,
    refundReason,
    refundType,
    expectedCreditDate,
    orderUrl,
    supportUrl,
    unsubscribeUrl 
  } = props;

  const formatPrice = (value: number) => new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value);

  const creditDateFormatted = expectedCreditDate
    ? new Date(expectedCreditDate).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const isFullRefund = refundType === 'full';

  const html = baseEmailTemplate({
    previewText: `Remboursement initié - Commande ${orderNumber}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #FEE2E2; color: #991B1B; font-size: 13px; font-weight: 600; border-radius: 20px;">
              ↩️ Remboursement Initié
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700;">
              Remboursement en cours, ${userName}
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Un ${isFullRefund ? 'remboursement complet' : 'remboursement partiel'} a été initié pour la commande 
              <strong style="color: #006233;">${orderNumber}</strong>. 
              Les fonds retourneront vers votre mode de paiement original.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Refund Details -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px 24px;">
            <h4 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
              💳 Détails du remboursement
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
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Vendeur</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${sellerName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Type de remboursement</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">
                    ${isFullRefund ? '💰 Remboursement complet' : '📊 Remboursement partiel'}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Montant remboursé</p>
                  <p style="margin: 4px 0 0 0; color: #DC2626; font-size: 22px; font-weight: 700;">${formatPrice(amount)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Motif</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 14px; line-height: 1.5;">${refundReason}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${creditDateFormatted ? `
      <!-- Credit Date -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 16px 20px; background-color: #DBEAFE; border-radius: 8px;">
            <p style="margin: 0; color: #1E40AF; font-size: 14px;">
              📅 <strong>Date prévue de crédit :</strong> ${creditDateFormatted}
            </p>
            <p style="margin: 8px 0 0 0; color: #3B82F6; font-size: 13px;">
              Délai selon votre banque : 3-5 jours ouvrables
            </p>
          </td>
        </tr>
      </table>
      ` : ''}

      ${divider()}

      <!-- CTA -->
      ${emailButton({ url: orderUrl, text: 'Suivre le remboursement', fullWidth: true })}

      <!-- Support Info -->
      ${alertBox({
        type: isFullRefund ? 'info' : 'warning',
        children: `
          <strong>${isFullRefund ? 'ℹ️' : '⚠️'} Information importante :</strong><br><br>
          • Le remboursement sera effectué vers le mode de paiement initial<br>
          • Le délai de crédit dépend de votre banque (3-5 jours ouvrables)<br>
          • Vous recevrez une confirmation lorsque le remboursement sera complété<br>
          ${supportUrl ? `• Questions ? <a href="${supportUrl}" style="color: #006233; font-weight: 600;">Contactez notre support</a>` : ''}
        `,
      })}
    `,
  });

  const text = `
REMBOURSEMENT EN COURS

Remboursement en cours, ${userName}

Un ${isFullRefund ? 'remboursement complet' : 'remboursement partiel'} a été initié pour 
la commande ${orderNumber}. Les fonds retourneront vers votre mode de paiement original.

DÉTAILS DU REMBOURSEMENT :
N° de commande : ${orderNumber}
Produit : ${productName}
Vendeur : ${sellerName}
Type de remboursement : ${isFullRefund ? 'Remboursement complet' : 'Remboursement partiel'}
Montant remboursé : ${formatPrice(amount)}
Motif : ${refundReason}

${creditDateFormatted ? `Date prévue de crédit : ${creditDateFormatted}` : ''}
Délai selon votre banque : 3-5 jours ouvrables

Suivre le remboursement : ${orderUrl}

INFORMATION IMPORTANTE :
• Le remboursement sera effectué vers le mode de paiement initial
• Le délai de crédit dépend de votre banque (3-5 jours ouvrables)
• Vous recevrez une confirmation lorsque le remboursement sera complété

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
