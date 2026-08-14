/**
 * Email Verification Template
 * 
 * Sent when user needs to verify their email address.
 * Includes verification button/link and code display option.
 * 
 * @module lib/email/templates/email-verification
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface EmailVerificationProps {
  firstName: string;
  email: string;
  verificationUrl: string;
  verificationCode?: string;
  expiresAt: Date;
  supportEmail?: string;
  unsubscribeUrl?: string;
}

export function emailVerificationTemplate(props: EmailVerificationProps): { html: string; text: string } {
  const { 
    firstName, 
    email, 
    verificationUrl, 
    verificationCode,
    expiresAt,
    supportEmail = 'support@algeriatrade.dz',
    unsubscribeUrl 
  } = props;

  // Format expiration time
  const expiresFormatted = new Date(expiresAt).toLocaleDateString('fr-FR', {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = baseEmailTemplate({
    previewText: `Confirmez votre adresse email ${email}`,
    unsubscribeUrl,
    children: `
      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: ${'#1a1a1a'}; font-size: 26px; font-weight: 700;">
              Vérifiez votre adresse email ✉️
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Bonjour ${firstName}, pour activer votre compte AlgeriaTrade et accéder à toutes 
              les fonctionnalités, veuillez confirmer votre adresse email.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Verification Button -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 16px 0;">
            ${emailButton({ 
              url: verificationUrl, 
              text: 'Vérifier mon adresse email',
              fullWidth: true 
            })}
          </td>
        </tr>
      </table>

      <!-- Alternative: Code Display -->
      ${verificationCode ? `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 20px 0;">
            <p style="margin: 0 0 12px 0; color: #666666; font-size: 14px; text-align: center;">
              Ou copiez ce code de vérification :
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" align="center">
              <tr>
                <td style="padding: 16px 32px; background-color: #F3F4F6; border-radius: 8px; letter-spacing: 8px;">
                  <span style="font-size: 28px; font-weight: 700; color: #006233; font-family: 'Courier New', monospace;">
                    ${verificationCode}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      ` : ''}

      <!-- Link for copy-paste -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 16px 0;">
            <p style="margin: 0 0 8px 0; color: #888888; font-size: 13px; text-align: center;">
              Le lien ne fonctionne pas ? Copiez-collez cette URL dans votre navigateur :
            </p>
            <p style="margin: 0; word-break: break-all; color: #006233; font-size: 12px; text-align: center; background-color: #F9FAFB; padding: 12px; border-radius: 6px;">
              ${verificationUrl}
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Expiration Notice -->
      ${alertBox({
        type: 'warning',
        children: `
          ⏰ <strong>Ce lien expire le ${expiresFormatted}</strong><br><br>
          Si le lien a expiré, vous pouvez demander un nouveau code de vérification 
          depuis la page de connexion.
        `,
      })}

      <!-- Security Notice -->
      ${alertBox({
        type: 'info',
        children: `
          🔒 <strong>Sécurité :</strong> Si vous n'avez pas créé de compte sur AlgeriaTrade avec 
          l'adresse <strong>${email}</strong>, vous pouvez ignorer cet email en toute sécurité. 
          Votre adresse ne sera pas utilisée.
        `,
      })}

      <!-- Help -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;">
        <tr>
          <td align="center">
            <p style="margin: 0; color: #888888; font-size: 14px;">
              Besoin d'aide ? Contactez-nous à 
              <a href="mailto:${supportEmail}" style="color: #006233; text-decoration: none;">${supportEmail}</a>
            </p>
          </td>
        </tr>
      </table>
    `,
  });

  const text = `
VÉRIFIEZ VOTRE ADRESSE EMAIL

Bonjour ${firstName},

Pour activer votre compte AlgeriaTrade et accéder à toutes les fonctionnalités, 
veuillez confirmer votre adresse email.

Cliquez sur le lien ci-dessous pour vérifier :
${verificationUrl}

${verificationCode ? `Ou utilisez ce code : ${verificationCode}` : ''}

Ce lien expire le : ${expiresFormatted}

SÉCURITÉ :
Si vous n'avez pas créé de compte sur AlgeriaTrade avec l'adresse ${email}, 
vous pouvez ignorer cet email en toute sécurité.

Besoin d'aide ? Contactez-nous à ${supportEmail}

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
