/**
 * Welcome Email - Supplier
 * 
 * Sent to new supplier accounts after registration.
 * Includes company verification guide and product listing tips.
 * 
 * @module lib/email/templates/welcome-supplier
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface WelcomeSupplierProps {
  firstName: string;
  companyName?: string;
  email: string;
  loginUrl: string;
  companyUrl: string;
  productsUrl: string;
  helpUrl?: string;
  unsubscribeUrl?: string;
}

export function welcomeSupplierTemplate(props: WelcomeSupplierProps): { html: string; text: string } {
  const { firstName, companyName, email, loginUrl, companyUrl, productsUrl, helpUrl, unsubscribeUrl } = props;

  const html = baseEmailTemplate({
    previewText: `${companyName || 'Votre entreprise'} sur AlgeriaTrade - Commencez à vendre !`,
    unsubscribeUrl,
    children: `
      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: ${'#1a1a1a'}; font-size: 26px; font-weight: 700;">
              Bienvenue, ${firstName} ! 🏢
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Rejoignez des centaines de fournisseurs sur <strong style="color: #006233;">AlgeriaTrade.dz</strong> 
              et développez votre activité en Algérie.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Supplier Benefits -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 24px 0;">
            <h3 style="margin: 0 0 16px 0; color: ${'#1a1a1a'}; font-size: 18px; font-weight: 600;">
              ✨ Pourquoi vendre sur AlgeriaTrade ?
            </h3>
            
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 8px 0;">
                  <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.5;">
                    ✓ Accès à des acheteurs professionnels dans toute l'Algérie<br>
                    ✓ Outils de gestion des devis et commandes intégrés<br>
                    ✓ Profil entreprise vérifié pour plus de confiance<br>
                    ✓ Support client dédié en français et arabe
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Setup Steps -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 24px 0;">
            <h3 style="margin: 0 0 16px 0; color: ${'#1a1a1a'}; font-size: 18px; font-weight: 600;">
              📋 Configuration initiale
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
                    Créez votre profil entreprise
                  </p>
                  <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                    Ajoutez vos informations légales (RC, NIF, NIS) pour la vérification.
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
                    Ajoutez vos premiers produits
                  </p>
                  <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                    Photos, descriptions détaillées et prix compétitifs attirent les acheteurs.
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
                    Répondez aux demandes de devis
                  </p>
                  <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                    Recevez des notifications pour chaque RFQ correspondant à vos produits.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- CTA Buttons -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 12px;">
            ${emailButton({ url: companyUrl, text: 'Configurer mon entreprise' })}
          </td>
        </tr>
        <tr>
          <td>
            ${emailButton({ url: productsUrl, text: 'Ajouter un produit' })}
          </td>
        </tr>
      </table>

      <!-- Verification Badge Info -->
      ${alertBox({
        type: 'info',
        children: `
          <strong>🏅 Badge de vérification :</strong> Une fois votre entreprise vérifiée par notre équipe, 
          vous recevrez un badge de confiance qui augmente significativement vos chances de conversion. 
          Le processus prend généralement 24-48h ouvrables.
        `,
      })}

      <!-- Security Notice -->
      ${alertBox({
        type: 'warning',
        children: `
          <strong>🔐 Votre compte :</strong> ${email}<br><br>
          Si vous n'avez pas créé ce compte fournisseur, veuillez nous contacter immédiatement.
        `,
      })}

      <!-- Help Section -->
      ${helpUrl ? `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;">
        <tr>
          <td align="center" style="padding: 16px; background-color: #F9FAFB; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; color: #666666; font-size: 14px;">
              Guide du vendeur disponible
            </p>
            <a href="${helpUrl}" style="color: #006233; font-size: 14px; font-weight: 600; text-decoration: none;">
              Consulter le guide →
            </a>
          </td>
        </tr>
      </table>
      ` : ''}
    `,
  });

  const text = `
Bienvenue sur AlgeriaTrade, ${firstName} !

Rejoignez des centaines de fournisseurs sur AlgeriaTrade.dz et développez votre activité en Algérie.

POURQUOI VENDRE SUR ALGERIATRADE ?

✓ Accès à des acheteurs professionnels dans toute l'Algérie
✓ Outils de gestion des devis et commandes intégrés
✓ Profil entreprise vérifié pour plus de confiance
✓ Support client dédié en français et arabe

CONFIGURATION INITIALE :

1. Créez votre profil entreprise
   Ajoutez vos informations légales (RC, NIF, NIS) pour la vérification.

2. Ajoutez vos premiers produits
   Photos, descriptions détaillées et prix compétitifs attirent les acheteurs.

3. Répondez aux demandes de devis
   Recevez des notifications pour chaque RFQ correspondant à vos produits.

Configurer mon entreprise : ${companyUrl}
Ajouter un produit : ${productsUrl}

BADGE DE VÉRIFICATION :
Une fois votre entreprise vérifiée par notre équipe, vous recevrez un badge de confiance 
qui augmente significativement vos chances de conversion.

Votre compte : ${email}

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
