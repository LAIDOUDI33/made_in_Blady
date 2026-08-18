/**
 * Inspection Report Available Template
 * 
 * Sent when detailed inspection report is ready for download.
 * Includes link to download full report with evidence.
 * 
 * @module lib/email/templates/inspection-report
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface InspectionReportProps {
  userName: string;
  bookingNumber: string;
  inspectionType: string;
  resultScore: number;
  resultStatus: 'pass' | 'fail' | 'conditional';
  reportUrl: string;
  reportFormat: string; // PDF, etc.
  reportSize?: string;
  includesPhotos: boolean;
  includesVideos: boolean;
  validUntil?: Date | string;
  bookingUrl: string;
  unsubscribeUrl?: string;
}

export function inspectionReportTemplate(props: InspectionReportProps): { html: string; text: string } {
  const { 
    userName, 
    bookingNumber, 
    inspectionType,
    resultScore,
    resultStatus,
    reportUrl,
    reportFormat,
    reportSize,
    includesPhotos,
    includesVideos,
    validUntil,
    bookingUrl,
    unsubscribeUrl 
  } = props;

  const validUntilFormatted = validUntil
    ? new Date(validUntil).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  // Status config
  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    pass: { label: 'Réussi', bg: '#DCFCE7', color: '#166534' },
    fail: { label: 'Échec', bg: '#FEE2E2', color: '#991B1B' },
    conditional: { label: 'Conditionnel', bg: '#FEF3C7', color: '#92400E' },
  };

  const sc = statusConfig[resultStatus];

  const html = baseEmailTemplate({
    previewText: `Rapport d'inspection disponible - ${bookingNumber}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #E0E7FF; color: #3730A3; font-size: 13px; font-weight: 600; border-radius: 20px;">
              📄 Rapport Disponible
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700;">
              Votre rapport d'inspection est prêt, ${userName} ! 📑
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              Le rapport complet de votre inspection <strong style="color: #006233;">${inspectionType}</strong> 
              est maintenant disponible au téléchargement.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Report Preview Card -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 24px; background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%); border-radius: 12px; border: 1px solid #CBD5E1;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="width: 80px; vertical-align: top;">
                  <div style="width: 80px; height: 100px; background-color: #DC2626; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 36px; color: white;">📄</span>
                  </div>
                </td>
                <td style="padding-left: 20px; vertical-align: top;">
                  <h3 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 18px; font-weight: 700;">
                    Rapport d'Inspection
                  </h3>
                  <p style="margin: 0 0 4px 0; color: #64748B; font-size: 14px;">${bookingNumber}</p>
                  <p style="margin: 0 0 8px 0; color: #94A3B8; font-size: 13px;">
                    Format : ${reportFormat}${reportSize ? ` | Taille : ${reportSize}` : ''}
                  </p>
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <span style="display: inline-block; padding: 4px 10px; background-color: ${sc.bg}; color: ${sc.color}; font-size: 12px; font-weight: 500; border-radius: 12px;">
                      Score : ${resultScore}/100
                    </span>
                    <span style="display: inline-block; padding: 4px 10px; background-color: #F1F5F9; color: #475569; font-size: 12px; font-weight: 500; border-radius: 12px;">
                      ${sc.label}
                    </span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Report Contents -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px 24px;">
            <h4 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
              📦 Contenu du rapport
            </h4>
            
            <ul style="margin: 0; padding-left: 20px; color: #4B5563; font-size: 14px; line-height: 2;">
              <li>✅ Résumé exécutif et conclusions</li>
              <li>✅ Détails de chaque point d'inspection</li>
              <li>✅ Scores par catégorie</li>
              <li>✅ Recommandations et actions correctives</li>
              ${includesPhotos ? '<li>📷 Photos de preuve (haute résolution)</li>' : ''}
              ${includesVideos ? '<li>🎬 Vidéos de l\'inspection</li>' : ''}
              <li>📋 Informations sur l\'inspecteur et certifications</li>
              <li>🔐 Signature numérique et numéro de certificat</li>
            </ul>
          </td>
        </tr>
      </table>

      ${validUntilFormatted ? `
      <!-- Validity Notice -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 16px 20px; background-color: #FEF3C7; border-radius: 8px;">
            <p style="margin: 0; color: #92400E; font-size: 14px;">
              ⏰ <strong>Validité du rapport :</strong> Ce rapport est valide jusqu'au ${validUntilFormatted}
            </p>
          </td>
        </tr>
      </table>
      ` : ''}

      ${divider()}

      <!-- Download CTA -->
      ${emailButton({ url: reportUrl, text: '📥 Télécharger le rapport', fullWidth: true })}

      <!-- Secondary CTA -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 12px;">
        <tr>
          <td style="text-align: center;">
          <a href="${bookingUrl}" style="display: inline-block; padding: 12px 24px; background-color: transparent; color: #006233; text-decoration: none; border: 2px solid #006233; border-radius: 6px; font-size: 14px; font-weight: 600;">
            Voir dans mon tableau de bord
          </a>
          </td>
        </tr>
      </table>

      <!-- Usage Info -->
      ${alertBox({
        type: 'info',
        children: `
          <strong>💡 Utilisation du rapport :</strong><br><br>
          • Partagez ce rapport avec vos partenaires commerciaux<br>
          • Utilisez-le comme preuve de conformité qualité<br>
          • Incluez-le dans vos dossiers clients<br>
          • Conservez une copie pour vos archives internes<br>
          • Le rapport peut être vérifié via le numéro de certificat
        `,
      })}
    `,
  });

  const text = `
RAPPORT D'INSPECTION DISPONIBLE

Votre rapport d'inspection est prêt, ${userName} !

Le rapport complet de votre inspection ${inspectionType} est maintenant 
disponible au téléchargement.

RAPPORT :
N° de réservation : ${bookingNumber}
Format : ${reportFormat}${reportSize ? ` | Taille : ${reportSize}` : ''}
Score : ${resultScore}/100 (${sc.label})

CONTENU DU RAPPORT :
• Résumé exécutif et conclusions
• Détails de chaque point d'inspection
• Scores par catégorie
• Recommandations et actions correctives
${includesPhotos ? '• Photos de preuve (haute résolution)' : ''}
${includesVideos ? '• Vidéos de l\'inspection' : ''}
• Informations sur l'inspecteur et certifications
• Signature numérique et numéro de certificat

${validUntilFormatted ? `Validité du rapport : jusqu'au ${validUntilFormatted}` : ''}

Télécharger le rapport : ${reportUrl}
Voir dans le tableau de bord : ${bookingUrl}

UTILISATION DU RAPPORT :
• Partagez ce rapport avec vos partenaires commerciaux
• Utilisez-le comme preuve de conformité qualité
• Incluez-le dans vos dossiers clients
• Conservez une copie pour vos archives internes

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
