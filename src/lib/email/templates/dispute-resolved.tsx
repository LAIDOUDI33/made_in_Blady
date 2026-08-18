/**
 * Dispute Resolved Template
 * 
 * Sent to both parties when a dispute is resolved.
 * Includes resolution outcome and any financial impact.
 * 
 * @module lib/email/templates/dispute-resolved
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface DisputeResolvedProps {
  userName: string;
  orderNumber: string;
  productName: string;
  resolution: string;
  outcome: 'buyer_favor' | 'seller_favor' | 'partial' | 'mutual_agreement';
  refundAmount?: number;
  currency?: string;
  resolvedBy: string; // Mediator name or "Mutual agreement"
  resolutionDate: Date | string;
  canAppeal: boolean;
  appealDeadline?: Date | string;
  disputeUrl: string;
  unsubscribeUrl?: string;
}

export function disputeResolvedTemplate(props: DisputeResolvedProps): { html: string; text: string } {
  const { 
    userName, 
    orderNumber, 
    productName,
    resolution,
    outcome,
    refundAmount,
    currency,
    resolvedBy,
    resolutionDate,
    canAppeal,
    appealDeadline,
    disputeUrl,
    unsubscribeUrl 
  } = props;

  const formatPrice = (value: number, curr: string) => new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: curr,
    minimumFractionDigits: 2,
  }).format(value);

  const resolutionFormatted = new Date(resolutionDate).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const appealDeadlineFormatted = appealDeadline
    ? new Date(appealDeadline).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  // Outcome styling
  const outcomeConfig: Record<string, { label: string; bg: string; color: string; icon: string }> = {
    buyer_favor: { label: 'Décision en faveur de l\'acheteur', bg: '#DBEAFE', color: '#1E40AF', icon: '👤' },
    seller_favor: { label: 'Décision en faveur du vendeur', bg: '#DCFCE7', color: '#166534', icon: '🏪' },
    partial: { label: 'Solution partielle', bg: '#FEF3C7', color: '#92400E', icon: '🤝' },
    mutual_agreement: { label: 'Accord mutuel', bg: '#E0E7FF', color: '#3730A3', icon: '✅' },
  };

  const oc = outcomeConfig[outcome] || outcomeConfig.mutual_agreement;

  const html = baseEmailTemplate({
    previewText: `Litige résolu - Commande ${orderNumber}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: ${oc.bg}; color: ${oc.color}; font-size: 13px; font-weight: 600; border-radius: 20px;">
              ${oc.icon} Litige Résolu
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700;">
              Le litige a été résolu, ${userName}
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              La décision concernant le litige pour la commande 
              <strong style="color: #006233;">${orderNumber}</strong> a été rendue.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Outcome Badge -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px; background-color: ${oc.bg}; border-radius: 8px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 32px;">${oc.icon}</p>
            <h3 style="margin: 0; color: ${oc.color}; font-size: 18px; font-weight: 700;">
              ${oc.label}
            </h3>
          </td>
        </tr>
      </table>

      <!-- Resolution Details -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px 24px;">
            <h4 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
              📋 Détails de la résolution
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
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Résolu par</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 14px;">${resolvedBy}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Date de résolution</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 14px;">${resolutionFormatted}</p>
                </td>
              </tr>
              ${refundAmount !== undefined && currency ? `
              <tr>
                <td style="padding: 10px 0;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Montant remboursé</p>
                  <p style="margin: 4px 0 0 0; color: #16A34A; font-size: 20px; font-weight: 700;">${formatPrice(refundAmount, currency)}</p>
                </td>
              </tr>
              ` : ''}
            </table>
          </td>
        </tr>
      </table>

      <!-- Resolution Text -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px; background-color: #F9FAFB; border-radius: 8px;">
            <h4 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">
              📝 Décision détaillée
            </h4>
            <p style="margin: 0; color: #4B5563; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
${resolution}
            </p>
          </td>
        </tr>
      </table>

      ${canAppeal && appealDeadlineFormatted ? `
      <!-- Appeal Notice -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 16px 20px; background-color: #FFF7ED; border-radius: 8px; border-left: 4px solid #EA580C;">
            <p style="margin: 0; color: #9A3412; font-size: 14px;">
              <strong>⚖️ Droit d'appel :</strong> Vous pouvez faire appel de cette décision avant le 
              <strong>${appealDeadlineFormatted}</strong>.
            </p>
          </td>
        </tr>
      </table>
      ` : ''}

      ${divider()}

      <!-- CTA -->
      ${emailButton({ url: disputeUrl, text: 'Voir les détails complets', fullWidth: true })}

      <!-- Final Note -->
      ${alertBox({
        type: 'info',
        children: `
          <strong>📌 Note importante :</strong><br><br>
          • Cette décision est définitive sauf appel dans les délais<br>
          • Toute action financière sera traitée sous 1-3 jours ouvrables<br>
          • Conservez cet email pour vos dossiers<br>
          • Pour toute question, contactez le support
        `,
      })}
    `,
  });

  const text = `
LITIGE RÉSOLU

Le litige a été résolu, ${userName}

La décision concernant le litige pour la commande ${orderNumber} a été rendue.

ISSUE : ${oc.label}

DÉTAILS DE LA RÉSOLUTION :
N° de commande : ${orderNumber}
Produit : ${productName}
Résolu par : ${resolvedBy}
Date de résolution : ${resolutionFormatted}
${refundAmount !== undefined && currency ? `Montant remboursé : ${formatPrice(refundAmount, currency)}` : ''}

DÉCISION DÉTAILLÉE :
${resolution}

${canAppeal && appealDeadlineFormatted ? `DROIT D'APPEL :
Vous pouvez faire appel de cette décision avant le ${appealDeadlineFormatted}.` : ''}

Voir les détails complets : ${disputeUrl}

NOTE IMPORTANTE :
• Cette décision est définitive sauf appel dans les délais
• Toute action financière sera traitée sous 1-3 jours ouvrables
• Conservez cet email pour vos dossiers

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
