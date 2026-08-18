/**
 * Verification Approved Template
 * 
 * Sent to user when their verification is approved.
 * Includes badge level and congratulations message.
 * 
 * @module lib/email/templates/verification-approved
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface VerificationApprovedProps {
  userName: string;
  verificationType: string;
  badgeLevel: string;
  certificateNumber?: string;
  profileUrl: string;
  unsubscribeUrl?: string;
}

export function verificationApprovedTemplate(props: VerificationApprovedProps): { html: string; text: string } {
  const { 
    userName, 
    verificationType, 
    badgeLevel,
    certificateNumber,
    profileUrl,
    unsubscribeUrl 
  } = props;

  // Badge colors based on level
  const badgeColors: Record<string, { bg: string; color: string; icon: string }> = {
    BASIC: { bg: '#DCFCE7', color: '#166534', icon: '🥉' },
    VERIFIED: { bg: '#DBEAFE', color: '#1E40AF', icon: '🥈' },
    CERTIFIED: { bg: '#FEF3C7', color: '#92400E', icon: '🥇' },
    PREMIUM: { bg: '#F3E8FF', color: '#6B21A8', icon: '💎' },
    ENTERPRISE: { bg: '#FEE2E2', color: '#991B1B', icon: '🏆' },
  };

  const badgeStyle = badgeColors[badgeLevel] || badgeColors.BASIC;

  const html = baseEmailTemplate({
    previewText: `Félicitations ! Votre vérification ${verificationType} a été approuvée`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge - Success -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #DCFCE7; color: #166534; font-size: 13px; font-weight: 600; border-radius: 20px;">
              ✅ Vérification Approuvée
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700;">
              Félicitations, ${userName} ! 🎊
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Votre vérification <strong style="color: #006233;">${verificationType}</strong> a été 
              <strong style="color: #16A34A;">approuvée avec succès</strong> ! 
              Vous avez maintenant atteint le niveau <strong>${badgeLevel}</strong>.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Badge Display -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 24px; background: linear-gradient(135deg, ${badgeStyle.bg} 0%, #ffffff 100%); border-radius: 12px; text-align: center; border: 2px solid ${badgeStyle.color};">
            <p style="margin: 0 0 12px 0; font-size: 48px;">${badgeStyle.icon}</p>
            <h3 style="margin: 0 0 8px 0; color: ${badgeStyle.color}; font-size: 22px; font-weight: 700;">
              Niveau ${badgeLevel}
            </h3>
            <p style="margin: 0; color: #6B7280; font-size: 14px;">
              ${verificationType}
            </p>
            ${certificateNumber ? `
            <p style="margin: 12px 0 0 0; color: #9CA3AF; font-size: 12px;">
              Certificat N° : ${certificateNumber}
            </p>
            ` : ''}
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Benefits -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px; background-color: #F0FDF4; border-radius: 8px;">
            <h4 style="margin: 0 0 12px 0; color: #166534; font-size: 15px; font-weight: 600;">
              🌟 Avantages de votre nouveau statut
            </h4>
            <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 14px; line-height: 1.8;">
              <li>Badge de vérification visible sur votre profil</li>
              <li>Meilleure visibilité dans les résultats de recherche</li>
              <li>Confiance accrue des acheteurs potentiels</li>
              <li>Accès aux fonctionnalités premium</li>
            </ul>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      ${emailButton({ url: profileUrl, text: 'Voir mon profil vérifié', fullWidth: true })}

      <!-- Next Steps -->
      ${alertBox({
        type: 'success',
        children: `
          <strong>📋 Prochaines étapes :</strong><br><br>
          • Votre badge est désormais affiché sur votre profil<br>
          • Les acheteurs peuvent voir votre statut de vérification<br>
          • Continuez à compléter votre profil pour plus de visibilité<br>
          • Envisagez d'autres vérifications pour grimper les niveaux
        `,
      })}
    `,
  });

  const text = `
VÉRIFICATION APPROUVÉE

Félicitations, ${userName} !

Votre vérification ${verificationType} a été approuvée avec succès !
Vous avez maintenant atteint le niveau ${badgeLevel}.

NIVEAU ATTEINT : ${badgeLevel}
Type : ${verificationType}
${certificateNumber ? `Certificat N° : ${certificateNumber}` : ''}

AVANTAGES DE VOTRE NOUVEAU STATUT :
• Badge de vérification visible sur votre profil
• Meilleure visibilité dans les résultats de recherche
• Confiance accrue des acheteurs potentiels
• Accès aux fonctionnalités premium

Voir mon profil vérifié : ${profileUrl}

PROCHAINES ÉTAPES :
• Votre badge est désormais affiché sur votre profil
• Les acheteurs peuvent voir votre statut de vérification
• Continuez à compléter votre profil pour plus de visibilité

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
