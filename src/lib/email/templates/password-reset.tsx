/**
 * Password Reset Template
 * 
 * Sent when user requests a password reset.
 * Includes secure reset link with expiration.
 * 
 * @module lib/email/templates/password-reset
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface PasswordResetProps {
  firstName: string;
  email: string;
  resetUrl: string;
  expiresAt: Date;
  requestIp?: string;
  requestTime?: Date;
  supportEmail?: string;
  unsubscribeUrl?: string;
}

export function passwordResetTemplate(props: PasswordResetProps): { html: string; text: string } {
  const { 
    firstName, 
    email, 
    resetUrl, 
    expiresAt,
    requestIp,
    requestTime,
    supportEmail = 'support@algeriatrade.dz',
    unsubscribeUrl 
  } = props;

  // Format times
  const expiresFormatted = new Date(expiresAt).toLocaleDateString('fr-FR', {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const requestTimeFormatted = requestTime 
    ? new Date(requestTime).toLocaleDateString('fr-FR', {
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const html = baseEmailTemplate({
    previewText: `Réinitialisez votre mot de passe AlgeriaTrade`,
    children: `
      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: ${'#1a1a1a'}; font-size: 26px; font-weight: 700;">
              Réinitialisez votre mot de passe 🔐
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Bonjour ${firstName}, nous avons reçu une demande de réinitialisation de votre mot de passe.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Request Info (if available) -->
      ${requestIp || requestTimeFormatted ? `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 16px; background-color: #F9FAFB; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; color: #666666; font-size: 14px;">
              <strong>Détails de la demande :</strong>
            </p>
            ${requestTimeFormatted ? `<p style="margin: 4px 0; color: #888888; font-size: 13px;">📅 Date : ${requestTimeFormatted}</p>` : ''}
            ${requestIp ? `<p style="margin: 4px 0; color: #888888; font-size: 13px;">🌍 IP : ${requestIp}</p>` : ''}
          </td>
        </tr>
      </table>
      ` : ''}

      <!-- Reset Button -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 16px 0;">
            ${emailButton({ 
              url: resetUrl, 
              text: 'Réinitialiser mon mot de passe',
              fullWidth: true 
            })}
          </td>
        </tr>
      </table>

      <!-- Link for copy-paste -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 16px 0;">
            <p style="margin: 0 0 8px 0; color: #888888; font-size: 13px; text-align: center;">
              Le bouton ne fonctionne pas ? Copiez ce lien :
            </p>
            <p style="margin: 0; word-break: break-all; color: #006233; font-size: 12px; text-align: center; background-color: #F9FAFB; padding: 12px; border-radius: 6px;">
              ${resetUrl}
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Expiration Notice -->
      ${alertBox({
        type: 'warning',
        children: `
          ⏰ <strong>Ce lien expire dans 1 heure</strong> (${expiresFormatted})<br><br>
          Pour des raisons de sécurité, ce lien ne peut être utilisé qu'une seule fois. 
          Si vous n'avez pas réinitialisé votre mot de passe, demandez un nouveau lien.
        `,
      })}

      <!-- Security Notice - IMPORTANT -->
      ${alertBox({
        type: 'error',
        children: `
          🚨 <strong>Vous n'avez PAS demandé cette réinitialisation ?</strong><br><br>
          Si vous n'avez pas demandé à changer votre mot de passe, quelqu'un pourrait essayer 
          d'accéder à votre compte. <strong>Ne partagez jamais ce lien.</strong> Votre compte 
          reste sécurisé tant que vous ne cliquez pas sur le lien ci-dessus.<br><br>
          Nous vous recommandons de protéger votre compte avec un mot de passe fort et unique.
        `,
      })}

      <!-- Tips -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;">
        <tr>
          <td style="padding: 20px; background-color: #F0FDF4; border-radius: 8px; border-left: 4px solid #22C55E;">
            <p style="margin: 0 0 12px 0; color: #166534; font-size: 15px; font-weight: 600;">
              💡 Conseils pour un mot de passe sécurisé :
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 14px; line-height: 1.8;">
              <li>Au moins 12 caractères</li>
              <li>Mélange de lettres majuscules et minuscules</li>
              <li>Chiffres et caractères spéciaux (!@#$%^&*)</li>
              <li>Évitez les informations personnelles évidentes</li>
            </ul>
          </td>
        </tr>
      </table>

      <!-- Help -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;">
        <tr>
          <td align="center">
            <p style="margin: 0; color: #888888; font-size: 14px;">
              Questions ? Contactez-nous à 
              <a href="mailto:${supportEmail}" style="color: #006233; text-decoration: none;">${supportEmail}</a>
            </p>
          </td>
        </tr>
      </table>
    `,
    unsubscribeUrl
  });

  const text = `
RÉINITIALISEZ VOTRE MOT DE PASSE

Bonjour ${firstName},

Nous avons reçu une demande de réinitialisation de votre mot de passe.

${requestTimeFormatted ? `Date de la demande : ${requestTimeFormatted}` : ''}
${requestIp ? `Adresse IP : ${requestIp}` : ''}

Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :
${resetUrl}

⚠️ CE LIEN EXPIRE DANS 1 HEURE (${expiresFormatted})

Pour des raisons de sécurité, ce lien ne peut être utilisé qu'une seule fois.

VOUS N'AVEZ PAS DEMANDÉ CETTE RÉINITIALISATION ?

Si vous n'avez pas demandé à changer votre mot de passe, quelqu'un pourrait essayer 
d'accéder à votre compte. Ne partagez JAMAIS ce lien. Votre compte reste sécurisé 
tant que vous ne cliquez pas sur le lien ci-dessus.

CONSEILS POUR UN MOT DE PASSE SÉCURISÉ :
- Au moins 12 caractères
- Mélange de lettres majuscules et minuscules
- Chiffres et caractères spéciaux
- Évitez les informations personnelles évidentes

Questions ? Contactez-nous à ${supportEmail}

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
