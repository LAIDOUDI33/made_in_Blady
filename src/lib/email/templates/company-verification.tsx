/**
 * Company Verification Result Template
 * 
 * Sent when company verification is approved or rejected.
 * Different content based on verification status.
 * 
 * @module lib/email/templates/company-verification
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface CompanyVerificationProps {
  userName: string;
  companyName: string;
  isApproved: boolean;
  rejectionReason?: string;
  dashboardUrl?: string;
  resubmitUrl?: string;
  supportEmail?: string;
  unsubscribeUrl?: string;
}

export function companyVerificationTemplate(props: CompanyVerificationProps): { html: string; text: string } {
  const { 
    userName, 
    companyName, 
    isApproved,
    rejectionReason,
    dashboardUrl,
    resubmitUrl,
    supportEmail = 'support@algeriatrade.dz',
    unsubscribeUrl 
  } = props;

  if (isApproved) {
    return generateApprovedTemplate({
      userName,
      companyName,
      dashboardUrl,
      supportEmail,
      unsubscribeUrl,
    });
  } else {
    return generateRejectedTemplate({
      userName,
      companyName,
      rejectionReason,
      resubmitUrl,
      supportEmail,
      unsubscribeUrl,
    });
  }
}

function generateApprovedTemplate({
  userName,
  companyName,
  dashboardUrl,
  supportEmail,
  unsubscribeUrl,
}: {
  userName: string;
  companyName: string;
  dashboardUrl?: string;
  supportEmail: string;
  unsubscribeUrl?: string;
}): { html: string; text: string } {
  
  const html = baseEmailTemplate({
    previewText: `Félicitations ! ${companyName} est maintenant vérifiée`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge - Success -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #DCFCE7; color: #166534; font-size: 13px; font-weight: 600; border-radius: 20px;">
              🏅 Entreprise Vérifiée
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: ${'#1a1a1a'}; font-size: 26px; font-weight: 700;">
              Félicitations, ${userName} ! 🎉
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Nous avons le plaisir de vous informer que votre entreprise 
              <strong style="color: #006233;">${companyName}</strong> a été vérifiée avec succès !
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Success Illustration Area -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td align="center" style="padding: 32px 20px; background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); border-radius: 12px;">
            <!-- Badge Icon -->
            <div style="width: 80px; height: 80px; background-color: #22C55E; border-radius: 50%; margin: 0 auto 16px auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);">
              <span style="font-size: 40px;">✓</span>
            </div>
            
            <h3 style="margin: 0 0 8px 0; color: #166534; font-size: 20px; font-weight: 700;">
              Badge de Confiance Activé
            </h3>
            <p style="margin: 0; color: #15803D; font-size: 15px;">
              Votre profil affiche désormais le badge de vérification officiel
            </p>
          </td>
        </tr>
      </table>

      <!-- Benefits List -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 24px; border: 1px solid #E5E7EB; border-radius: 12px;">
            <h4 style="margin: 0 0 16px 0; color: ${'#1a1a1a'}; font-size: 16px; font-weight: 600;">
              ✨ Ce que cela signifie pour vous :
            </h4>
            
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td valign="top" width="28" style="padding-right: 12px;">
                  <span style="color: #22C55E; font-size: 18px;">✓</span>
                </td>
                <td style="padding-bottom: 16px;">
                  <p style="margin: 0; color: ${'#1a1a1a'}; font-size: 14px; font-weight: 500;">Plus de visibilité</p>
                  <p style="margin: 4px 0 0 0; color: #6B7280; font-size: 13px;">Vos produits apparaissent en priorité dans les recherches</p>
                </td>
              </tr>
              <tr>
                <td valign="top" width="28" style="padding-right: 12px;">
                  <span style="color: #22C55E; font-size: 18px;">✓</span>
                </td>
                <td style="padding-bottom: 16px;">
                  <p style="margin: 0; color: ${'#1a1a1a'}; font-size: 14px; font-weight: 500;">Confiance accrue des acheteurs</p>
                  <p style="margin: 4px 0 0 0; color: #6B7280; font-size: 13px;">Le badge vert rassure les acheteurs sur la légitimité de votre entreprise</p>
                </td>
              </tr>
              <tr>
                <td valign="top" width="28" style="padding-right: 12px;">
                  <span style="color: #22C55E; font-size: 18px;">✓</span>
                </td>
                <td>
                  <p style="margin: 0; color: ${'#1a1a1a'}; font-size: 14px; font-weight: 500;">Accès aux fonctionnalités Premium</p>
                  <p style="margin: 4px 0 0 0; color: #6B7280; font-size: 13px;">Débloquez des outils avancés pour développer vos ventes</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Next Steps -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px; background-color: #EFF6FF; border-radius: 8px; border-left: 4px solid #3B82F6;">
            <h4 style="margin: 0 0 12px 0; color: #1E40AF; font-size: 15px; font-weight: 600;">
              🚀 Prochaines étapes recommandées :
            </h4>
            <ol style="margin: 0; padding-left: 20px; color: #1E40AF; font-size: 14px; line-height: 1.8;">
              <li>Complétez votre catalogue avec tous vos produits</li>
              <li>Configurez vos conditions de livraison et paiement</li>
              <li>Activez les notifications pour ne manquer aucune opportunité</li>
            </ol>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      ${dashboardUrl ? emailButton({ url: dashboardUrl, text: 'Accéder à mon tableau de bord', fullWidth: true }) : ''}

      <!-- Success Alert -->
      ${alertBox({
        type: 'success',
        children: `
          Merci de votre patience pendant le processus de vérification. Notre équipe est disponible 
          pour répondre à vos questions : <a href="mailto:${supportEmail}" style="color: #166534; font-weight: 600;">${supportEmail}</a>
        `,
      })}
    `,
  });

  const text = `
FÉLICITATIONS ! VOTRE ENTREPRISE EST VÉRIFIÉE

Félicitations, ${userName} !

Nous avons le plaisir de vous informer que votre entreprise ${companyName} 
a été vérifiée avec succès !

BADGE DE CONFIANCE ACTIVÉ
Votre profil affiche désormais le badge de vérification officiel.

CE QUE CELA SIGNIFIE POUR VOUS :

✓ Plus de visibilité
   Vos produits apparaissent en priorité dans les recherches

✓ Confiance accrue des acheteurs
   Le badge vert rassure les acheteurs sur la légitimité de votre entreprise

✓ Accès aux fonctionnalités Premium
   Débloquez des outils avancés pour développer vos ventes

PROCHAINES ÉTAPES RECOMMANDÉES :
1. Complétez votre catalogue avec tous vos produits
2. Configurez vos conditions de livraison et paiement
3. Activez les notifications pour ne manquer aucune opportunité

${dashboardUrl ? `Accéder au tableau de bord : ${dashboardUrl}` : ''}

Merci de votre patience pendant le processus de vérification.

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}

function generateRejectedTemplate({
  userName,
  companyName,
  rejectionReason,
  resubmitUrl,
  supportEmail,
  unsubscribeUrl,
}: {
  userName: string;
  companyName: string;
  rejectionReason?: string;
  resubmitUrl?: string;
  supportEmail: string;
  unsubscribeUrl?: string;
}): { html: string; text: string } {
  
  const html = baseEmailTemplate({
    previewText: `Information concernant la vérification de ${companyName}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge - Warning -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #FEE2E2; color: #991B1B; font-size: 13px; font-weight: 600; border-radius: 20px;">
              ⚠️ Vérification en Attente
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: ${'#1a1a1a'}; font-size: 26px; font-weight: 700;">
              Bonjour, ${userName}
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Après examen de votre demande, nous ne pouvons pas actuellement valider 
              la vérification de <strong style="color: #006233;">${companyName}</strong>.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Rejection Reason -->
      ${rejectionReason ? `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 24px; background-color: #FEF2F2; border-radius: 12px; border-left: 4px solid #EF4444;">
          <h4 style="margin: 0 0 12px 0; color: #991B1B; font-size: 16px; font-weight: 600;">
            Raison du refus
          </h4>
          <p style="margin: 0; color: #7F1D1D; font-size: 15px; line-height: 1.6;">
            ${rejectionReason}
          </p>
          </td>
        </tr>
      </table>
      ` : ''}

      <!-- What to do next -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 24px; border: 1px solid #E5E7EB; border-radius: 12px;">
            <h4 style="margin: 0 0 16px 0; color: ${'#1a1a1a'}; font-size: 16px; font-weight: 600;">
              📋 Comment résoudre ce problème ?
            </h4>
            
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td valign="top" width="32" style="padding-right: 12px;">
                  <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background-color: #006233; color: white; border-radius: 50%; font-size: 12px; font-weight: 700;">1</span>
                </td>
                <td style="padding-bottom: 16px;">
                  <p style="margin: 0; color: ${'#1a1a1a'}; font-size: 14px; font-weight: 500;">Consultez la raison ci-dessus</p>
                  <p style="margin: 4px 0 0 0; color: #6B7280; font-size: 13px;">Identifiez les informations manquantes ou incorrectes</p>
                </td>
              </tr>
              <tr>
                <td valign="top" width="32" style="padding-right: 12px;">
                  <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background-color: #006233; color: white; border-radius: 50%; font-size: 12px; font-weight: 700;">2</span>
                </td>
                <td style="padding-bottom: 16px;">
                  <p style="margin: 0; color: ${'#1a1a1a'}; font-size: 14px; font-weight: 500;">Corrigez vos informations</p>
                  <p style="margin: 4px 0 0 0; color: #6B7280; font-size: 13px;">Mettez à jour les documents ou données demandés</p>
                </td>
              </tr>
              <tr>
                <td valign="top" width="32" style="padding-right: 12px;">
                  <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background-color: #006233; color: white; border-radius: 50%; font-size: 12px; font-weight: 700;">3</span>
                </td>
                <td>
                  <p style="margin: 0; color: ${'#1a1a1a'}; font-size: 14px; font-weight: 500;">Soumettez à nouveau</p>
                  <p style="margin: 4px 0 0 0; color: #6B7280; font-size: 13px;">Notre équipe examinera votre demande dans les 48h</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- CTA -->
      ${resubmitUrl ? emailButton({ url: resubmitUrl, text: 'Soumettre une nouvelle demande', fullWidth: true }) : ''}

      <!-- Support Info -->
      ${alertBox({
        type: 'info',
        children: `
          Besoin d'aide pour comprendre cette décision ?<br><br>
          N'hésitez pas à contacter notre équipe de vérification :<br>
          📧 <a href="mailto:${supportEmail}" style="color: #1E40AF; font-weight: 600;">${supportEmail}</a><br><br>
          Nous sommes là pour vous accompagner dans ce processus.
        `,
      })}

      <!-- Encouragement -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;">
        <tr>
          <td align="center" style="padding: 20px; background-color: #FFFBEB; border-radius: 8px;">
            <p style="margin: 0; color: #92400E; font-size: 15px; line-height: 1.6;">
              💪 Ne vous découragez pas ! La plupart des refus sont résolus rapidement 
              après correction des informations. Nous attendons votre nouvelle soumission.
            </p>
          </td>
        </tr>
      </table>
    `,
  });

  const text = `INFORMATION CONCERNANT LA VÉRIFICATION DE VOTRE ENTREPRISE

Bonjour, ${userName},

Après examen de votre demande, nous ne pouvons pas actuellement valider 
la vérification de ${companyName}.

${rejectionReason ? `RAISON DU REFUS :\n${rejectionReason}` : ''}

COMMENT RÉSUDRE CE PROBLÈME ?

1. Consultez la raison ci-dessus
   Identifiez les informations manquantes ou incorrectes

2. Corrigez vos informations
   Mettez à jour les documents ou données demandés

3. Soumettez à nouveau
   Notre équipe examinera votre demande dans les 48h

${resubmitUrl ? `Soumettre une nouvelle demande : ${resubmitUrl}` : ''}

BESOIN D'AIDE ?
N'hésitez pas à contacter notre équipe de vérification : ${supportEmail}

Ne vous découragez pas ! La plupart des refus sont résolus rapidement 
après correction des informations.

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
