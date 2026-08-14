/**
 * Order Confirmed Template
 * 
 * Sent to buyer when an order is confirmed by supplier.
 * Includes order details, items, and expected delivery.
 * 
 * @module lib/email/templates/order-confirmed
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderConfirmedProps {
  buyerName: string;
  orderNumber: string;
  supplierName: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  currency: string;
  expectedDelivery?: Date;
  deliveryAddress: string;
  deliveryWilaya: string;
  supplierContact?: string;
  orderUrl: string;
  unsubscribeUrl?: string;
}

export function orderConfirmedTemplate(props: OrderConfirmedProps): { html: string; text: string } {
  const { 
    buyerName, 
    orderNumber, 
    supplierName,
    items,
    subtotal,
    taxAmount,
    shippingCost,
    totalAmount,
    currency,
    expectedDelivery,
    deliveryAddress,
    deliveryWilaya,
    supplierContact,
    orderUrl,
    unsubscribeUrl 
  } = props;

  // Format prices
  const formatPrice = (amount: number) => new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);

  const expectedDeliveryFormatted = expectedDelivery
    ? new Date(expectedDelivery).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  // Generate items rows
  const itemsRows = items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #F3F4F6;">
        <p style="margin: 0; color: ${'#1a1a1a'}; font-size: 14px; font-weight: 500;">${item.name}</p>
        <p style="margin: 4px 0 0 0; color: #9CA3AF; font-size: 13px;">Qté : ${item.quantity} × ${formatPrice(item.unitPrice)}</p>
      </td>
      <td align="right" valign="bottom" style="padding: 12px 0; border-bottom: 1px solid #F3F4F6;">
        <p style="margin: 0; color: ${'#1a1a1a'}; font-size: 14px; font-weight: 600;">${formatPrice(item.totalPrice)}</p>
      </td>
    </tr>
  `).join('');

  const html = baseEmailTemplate({
    previewText: `Commande ${orderNumber} confirmée`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #DCFCE7; color: #166534; font-size: 13px; font-weight: 600; border-radius: 20px;">
              ✅ Commande Confirmée
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: ${'#1a1a1a'}; font-size: 26px; font-weight: 700;">
              Merci pour votre commande, ${buyerName} ! 🛒
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Votre commande a été confirmée par <strong style="color: #006233;">${supplierName}</strong>. 
              Voici le récapitulatif de votre commande.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Order Number -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 16px 20px; background-color: #F9FAFB; border-radius: 8px; text-align: center;">
            <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
              Numéro de commande
            </p>
            <p style="margin: 0; color: #006233; font-size: 22px; font-weight: 700; letter-spacing: 1px;">
              ${orderNumber}
            </p>
          </td>
        </tr>
      </table>

      <!-- Items Table -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px 24px;">
            <h4 style="margin: 0 0 16px 0; color: ${'#1a1a1a'}; font-size: 15px; font-weight: 600;">
              Articles commandés
            </h4>
            
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              ${itemsRows}
            </table>

            <!-- Totals -->
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px; padding-top: 16px; border-top: 2px solid #E5E7EB;">
              <tr>
                <td style="padding: 4px 0;"><p style="margin: 0; color: #6B7280; font-size: 14px;">Sous-total</p></td>
                <td align="right"><p style="margin: 0; color: #6B7280; font-size: 14px;">${formatPrice(subtotal)}</p></td>
              </tr>
              ${taxAmount > 0 ? `
              <tr>
                <td style="padding: 4px 0;"><p style="margin: 0; color: #6B7280; font-size: 14px;">TVA</p></td>
                <td align="right"><p style="margin: 0; color: #6B7280; font-size: 14px;">${formatPrice(taxAmount)}</p></td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 4px 0;"><p style="margin: 0; color: #6B7280; font-size: 14px;">Livraison</p></td>
                <td align="right"><p style="margin: 0; color: #6B7280; font-size: 14px;">${shippingCost === 0 ? 'Gratuite' : formatPrice(shippingCost)}</p></td>
              </tr>
              <tr>
                <td style="padding: 12px 0 0 0; border-top: 2px solid #006233;"><p style="margin: 0; color: ${'#1a1a1a'}; font-size: 16px; font-weight: 700;">Total</p></td>
                <td align="right" style="padding: 12px 0 0 0; border-top: 2px solid #006233;"><p style="margin: 0; color: #006233; font-size: 18px; font-weight: 700;">${formatPrice(totalAmount)}</p></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Delivery Info -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px; background-color: #FEF3C7; border-radius: 8px; border-left: 4px solid #F59E0B;">
          <h4 style="margin: 0 0 12px 0; color: #92400E; font-size: 15px; font-weight: 600;">
            📦 Informations de livraison
          </h4>
          <p style="margin: 0 0 8px 0; color: #78350F; font-size: 14px; line-height: 1.5;">
            <strong>Adresse :</strong> ${deliveryAddress}
          </p>
          <p style="margin: 0 0 8px 0; color: #78350F; font-size: 14px;">
            <strong>Wilaya :</strong> ${deliveryWilaya}
          </p>
          ${expectedDeliveryFormatted ? `
          <p style="margin: 0; color: #059669; font-size: 14px; font-weight: 500;">
            ⏰ Livraison estimée : ${expectedDeliveryFormatted}
          </p>
          ` : ''}
        </td>
        </tr>
      </table>

      <!-- Supplier Contact -->
      ${supplierContact ? `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 16px 20px; background-color: #F0FDF4; border-radius: 8px;">
            <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 14px; font-weight: 600;">
              📞 Contact fournisseur
            </h4>
            <p style="margin: 0; color: #166534; font-size: 14px;">${supplierContact}</p>
          </td>
        </tr>
      </table>
      ` : ''}

      <!-- CTA -->
      ${emailButton({ url: orderUrl, text: 'Suivre ma commande', fullWidth: true })}

      <!-- Next Steps -->
      ${alertBox({
        type: 'success',
        children: `
          <strong>📋 Prochaines étapes :</strong><br><br>
          • Le fournisseur va préparer votre commande<br>
          • Vous recevrez une notification avec les informations de suivi<br>
          • En cas de question, contactez directement le fournisseur<br>
          • Conservez ce récapitulatif pour vos dossiers
        `,
      })}
    `,
  });

  const text = `
COMMANDE CONFIRMÉE

Merci pour votre commande, ${buyerName} !

Votre commande a été confirmée par ${supplierName}.

NUMÉRO DE COMMANDE : ${orderNumber}

ARTICLES COMMANDÉS :
${items.map(item => `- ${item.name} (x${item.quantity}) : ${formatPrice(item.totalPrice)}`).join('\n')}

RÉCAPITULATIF :
Sous-total : ${formatPrice(subtotal)}
${taxAmount > 0 ? `TVA : ${formatPrice(taxAmount)}` : ''}
Livraison : ${shippingCost === 0 ? 'Gratuite' : formatPrice(shippingCost)}
TOTAL : ${formatPrice(totalAmount)}

INFORMATIONS DE LIVRAISON :
Adresse : ${deliveryAddress}
Wilaya : ${deliveryWilaya}
${expectedDeliveryFormatted ? `Livraison estimée : ${expectedDeliveryFormatted}` : ''}

${supplierContact ? `CONTACT FOURNISSEUR :\n${supplierContact}` : ''}

Suivre ma commande : ${orderUrl}

PROCHAINES ÉTAPES :
• Le fournisseur va préparer votre commande
• Vous recevrez une notification avec les informations de suivi
• En cas de question, contactez directement le fournisseur

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
