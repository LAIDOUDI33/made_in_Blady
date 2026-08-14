/**
 * Base Email Template
 * 
 * Provides the common layout and styling for all email templates.
 * Uses inline styles for maximum email client compatibility.
 * 
 * @module lib/email/templates/base
 */

import { EMAIL_CONFIG } from '../service';

export interface BaseTemplateProps {
  previewText?: string;
  children: React.ReactNode;
  unsubscribeUrl?: string;
}

/**
 * Generate base email HTML with header, footer, and branding
 */
export function baseEmailTemplate({
  previewText,
  children,
  unsubscribeUrl,
}: BaseTemplateProps): string {
  const currentYear = new Date().getFullYear();
  
  return `<!DOCTYPE html>
<html lang="fr" dir="ltr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  ${previewText ? `<title>${previewText}</title>` : '<title>AlgeriaTrade</title>'}
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${EMAIL_CONFIG.lightGray}; -webkit-font-smoothing: antialiased;">
  
  <!-- Preview Text -->
  ${previewText ? `<div style="display: none; max-height: 0; overflow: hidden;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ''}
  
  <!-- Outer Wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${EMAIL_CONFIG.lightGray};">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        
        <!-- Main Container (600px) -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; background: linear-gradient(135deg, ${EMAIL_CONFIG.brandColor} 0%, ${EMAIL_CONFIG.brandColorLight} 100%); border-radius: 8px 8px 0 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <!-- Logo -->
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                      Algeria<span style="color: #ffffff; opacity: 0.9;">Trade</span><span style="color: #FFD700;">.dz</span>
                    </h1>
                    <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">
                      La plateforme B2B de l'Algérie
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${children}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: ${EMAIL_CONFIG.lightGray}; border-radius: 0 0 8px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <!-- Divider -->
                <tr>
                  <td style="padding-bottom: 16px; border-bottom: 1px solid ${EMAIL_CONFIG.borderGray};">
                    <p style="margin: 0; color: #666666; font-size: 13px; line-height: 1.6;">
                      Cet email vous a été envoyé par <strong style="color: ${EMAIL_CONFIG.brandColor};">AlgeriaTrade.dz</strong>, 
                      la première marketplace B2B dédiée au marché algérien.
                    </p>
                  </td>
                </tr>
                
                <!-- Contact Info -->
                <tr>
                  <td style="padding: 16px 0;">
                    <p style="margin: 0 0 8px 0; color: #888888; font-size: 12px;">
                      Besoin d'aide ? Contactez-nous à 
                      <a href="mailto:support@algeriatrade.dz" style="color: ${EMAIL_CONFIG.brandColor}; text-decoration: none;">support@algeriatrace.dz</a>
                    </p>
                    <p style="margin: 0; color: #888888; font-size: 12px;">
                      © ${currentYear} AlgeriaTrade.dz — Tous droits réservés
                    </p>
                  </td>
                </tr>
                
                ${unsubscribeUrl ? `
                <!-- Unsubscribe -->
                <tr>
                  <td style="padding-top: 12px; border-top: 1px solid ${EMAIL_CONFIG.borderGray};">
                    <p style="margin: 0; color: #999999; font-size: 11px;">
                      Vous ne souhaitez plus recevoir ces emails ? 
                      <a href="${unsubscribeUrl}" style="color: #999999; text-decoration: underline;">Se désabonner</a>
                    </p>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
          
        </table>
        <!-- End Main Container -->
        
      </td>
    </tr>
  </table>
  
</body>
</html>`;
}

/**
 * Common button component for CTAs
 */
export function emailButton({
  url,
  text,
  fullWidth = false,
}: {
  url: string;
  text: string;
  fullWidth?: boolean;
}): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
    <tr>
      <td align="center" style="${fullWidth ? 'width: 100%;' : ''}">
        <a href="${url}" target="_blank" rel="noopener noreferrer" 
           style="display: inline-block; padding: 14px 32px; background-color: ${EMAIL_CONFIG.brandColor}; 
                  color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600;
                  ${fullWidth ? 'width: 100%; box-sizing: border-box;' : ''}">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

/**
 * Section divider
 */
export function divider(): string {
  return `<hr style="border: none; border-top: 1px solid ${EMAIL_CONFIG.borderGray}; margin: 24px 0;">`;
}

/**
 * Alert/Notice box
 */
export function alertBox({
  type = 'info',
  children,
}: {
  type?: 'info' | 'success' | 'warning' | 'error';
  children: string;
}): string {
  const colors = {
    info: { bg: '#EBF5FF', border: '#0066CC', text: '#004085' },
    success: { bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32' },
    warning: { bg: '#FFF8E1', border: '#FFC107', text: '#856404' },
    error: { bg: '#FFEBEE', border: '#F44336', text: '#C62828' },
  };
  
  const c = colors[type];
  
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${c.bg}; border-left: 4px solid ${c.border}; border-radius: 4px; margin: 16px 0;">
    <tr>
      <td style="padding: 16px 20px; color: ${c.text}; font-size: 14px; line-height: 1.5;">
        ${children}
      </td>
    </tr>
  </table>`;
}

/**
 * Format date in French locale
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format relative time (e.g., "il y a 2 heures")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "à l'instant";
  if (diffMins < 60) return `il y a ${diffMins} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;
  return formatDate(d);
}

// Re-export config for templates
export { EMAIL_CONFIG };
