/**
 * Welcome Email - Buyer
 * 
 * Sent to new buyer accounts after registration.
 * Includes quick start guide and profile completion CTA.
 * 
 * @module lib/email/templates/welcome-buyer
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface WelcomeBuyerProps {
  firstName: string;
  email: string;
  loginUrl: string;
  profileUrl: string;
  helpUrl?: string;
  unsubscribeUrl?: string;
}

export function welcomeBuyerTemplate(props: WelcomeBuyerProps): { html: string; text: string } {
  const { firstName, email, loginUrl, profileUrl, helpUrl, unsubscribeUrl } = props;

  const html = baseEmailTemplate({
    previewText: `Bienvenue sur AlgeriaTrade, ${firstName} ! Découvrez comment commencer.`,
    unsubscribeUrl,
    children: `
      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: ${'#1a1a1a'}; font-size: 26px; font-weight: 700;">
              Bienvenue, ${firstName} ! 👋
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Nous sommes ravis de vous accueillir sur <strong style="color: #006233;">AlgeriaTrade.dz</strong>, 
              la première marketplace B2B dédiée au marché algérien.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Quick Start Guide -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 24px 0;">
            <h3 style="margin: 0 0 16px 0; color: ${'#1a1a1a'}; font-size: 18px; font-weight: 600;">
              🚀 Commencez en 3 étapes simples
            </h3>
            
            <!-- Step 1 -->
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
              <tr>
                <td width="40" valign="top" style="padding-right: 12px;">
                  <div style="width: 32px; height: 32px; background-color: #006233; border-radius: 50%; text-align: center; line-height: 32px;">
                    <span style="color: #ffffff; font-size: 14px; font-weight: 700;">1</span>
                  </div>
                </td>
                <td valign="top">
                  <p style="margin: 0 0 4px 0; color: ${'#1a1a1a'}; font-size: 15px; font-weight: 600;">
                    Complétez votre profil
                  </p>
                  <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                    Ajoutez vos informations et préférences pour une expérience personnalisée.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Step 2 -->
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
              <tr>
                <td width="40" valign="top" style="padding-right: 12px;">
                  <div style="width: 32px; height: 32px; background-color: #006233; border-radius: 50%; text-align: center; line-height: 32px;">
                    <span style="color: #ffffff; font-size: 14px; font-weight: 700;">2</span>
                  </div>
                </td>
                <td valign="top">
                  <p style="margin: 0 0 4px 0; color: ${'#1a1a1a'}; font-size: 15px; font-weight: 600;">
                    Explorez les produits et fournisseurs
                  </p>
                  <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                    Découvrez des milliers de produits de fournisseurs vérifiés en Algérie.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Step 3 -->
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="40" valign="top" style="padding-right: 12px;">
                  <div style="width: 32px; height: 32px; background-color: #006233; border-radius: 50%; text-align: center; line-height: 32px;">
                    <span style="color: #ffffff; font-size: 14px; font-weight: 700;">3</span>
                  </div>
                </td>
                <td valign="top">
                  <p style="margin: 0 0 4px 0; color: ${'#1a1a1a'}; font-size: 15px; font-weight: 600;">
                    Publiez votre première demande de devis (RFQ)
                  </p>
                  <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                    Recevez des propositions compétitives de plusieurs fournisseurs.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- CTA Button -->
      ${emailButton({ url: profileUrl, text: 'Compléter mon profil' })}

      <!-- Security Notice -->
      ${alertBox({
        type: 'info',
        children: `
          <strong>📧 Votre compte :</strong> ${email}<br><br>
          Si vous n'avez pas créé ce compte, vous pouvez ignorer cet email en toute sécurité.
        `,
      })}

      <!-- Help Section -->
      ${helpUrl ? `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;">
        <tr>
          <td align="center" style="padding: 16px; background-color: #F9FAFB; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; color: #666666; font-size: 14px;">
              Besoin d'aide pour commencer ?
            </p>
            <a href="${helpUrl}" style="color: #006233; font-size: 14px; font-weight: 600; text-decoration: none;">
              Consulter le guide d'utilisation →
            </a>
          </td>
        </tr>
      </table>
      ` : ''}
    `,
  });

  const text = `
Bienvenue sur AlgeriaTrade, ${firstName} !

Nous sommes ravis de vous accueillir sur AlgeriaTrade.dz, la première marketplace B2B dédiée au marché algérien.

COMMENCEZ EN 3 ÉTAPES SIMPLES :

1. Complétez votre profil
   Ajoutez vos informations et préférences pour une expérience personnalisée.

2. Explorez les produits et fournisseurs
   Découvrez des milliers de produits de fournisseurs vérifiés en Algérie.

3. Publiez votre première demande de devis (RFQ)
   Recevez des propositions compétitives de plusieurs fournisseurs.

Compléter votre profil : ${profileUrl}

Votre compte : ${email}

Si vous n'avez pas créé ce compte, vous pouvez ignorer cet email en toute sécurité.

Besoin d'aide ? Contactez-nous à support@algeriatrade.dz

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
