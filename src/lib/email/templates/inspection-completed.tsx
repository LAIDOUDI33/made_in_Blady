/**
 * Inspection Completed Template
 * 
 * Sent when inspection is completed with results.
 * Includes score and pass/fail status.
 * 
 * @module lib/email/templates/inspection-completed
 */

import { baseEmailTemplate, emailButton, divider, alertBox } from './base';

export interface InspectionCompletedProps {
  userName: string;
  bookingNumber: string;
  inspectionType: string;
  inspectorName: string;
  resultScore: number;
  resultStatus: 'pass' | 'fail' | 'conditional';
  completionDate: Date | string;
  summary?: string;
  reportUrl: string;
  bookingUrl: string;
  unsubscribeUrl?: string;
}

export function inspectionCompletedTemplate(props: InspectionCompletedProps): { html: string; text: string } {
  const { 
    userName, 
    bookingNumber, 
    inspectionType,
    inspectorName,
    resultScore,
    resultStatus,
    completionDate,
    summary,
    reportUrl,
    bookingUrl,
    unsubscribeUrl 
  } = props;

  const dateFormatted = new Date(completionDate).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Status configuration
  const statusConfig: Record<string, { label: string; bg: string; color: string; icon: string }> = {
    pass: { label: 'Réussi', bg: '#DCFCE7', color: '#166534', icon: '✅' },
    fail: { label: 'Échec', bg: '#FEE2E2', color: '#991B1B', icon: '❌' },
    conditional: { label: 'Conditionnel', bg: '#FEF3C7', color: '#92400E', icon: '⚠️' },
  };

  const sc = statusConfig[resultStatus] || statusConfig.conditional;

  // Score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#16A34A';
    if (score >= 60) return '#F59E0B';
    return '#DC2626';
  };

  const scoreColor = getScoreColor(resultScore);

  const html = baseEmailTemplate({
    previewText: `Inspection terminée - ${sc.label} - ${bookingNumber}`,
    unsubscribeUrl,
    children: `
      <!-- Header Badge -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 20px;">
            <span style="display: inline-block; padding: 6px 14px; background-color: ${sc.bg}; color: ${sc.color}; font-size: 13px; font-weight: 600; border-radius: 20px;">
              ${sc.icon} Inspection Terminée - ${sc.label}
            </span>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 26px; font-weight: 700;">
              Inspection complétée, ${userName} ! 📋
            </h2>
            <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.6;">
              L'inspection <strong style="color: #006233;">${inspectionType}</strong> a été réalisée par 
              <strong>${inspectorName}</strong>. Voici les résultats préliminaires.
            </p>
          </td>
        </tr>
      </table>

      ${divider()}

      <!-- Score Display -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 32px; background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); border-radius: 12px; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
              Score global
            </p>
            <p style="margin: 0; color: ${scoreColor}; font-size: 56px; font-weight: 700; line-height: 1;">
              ${resultScore}<span style="font-size: 32px;">/100</span>
            </p>
            <div style="margin-top: 16px; display: inline-block; padding: 8px 20px; background-color: ${sc.bg}; color: ${sc.color}; font-size: 16px; font-weight: 600; border-radius: 20px;">
              ${sc.icon} ${sc.label}
            </div>
          </td>
        </tr>
      </table>

      <!-- Details Table -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px 24px;">
            <h4 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">
              📊 Résumé de l'inspection
            </h4>
            
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">N° de réservation</p>
                  <p style="margin: 4px 0 0 0; color: #006233; font-size: 16px; font-weight: 600;">${bookingNumber}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Type d'inspection</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${inspectionType}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Inspecteur</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${inspectorName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <p style="margin: 0; color: #6B7280; font-size: 13px;">Date de réalisation</p>
                  <p style="margin: 4px 0 0 0; color: #1a1a1a; font-size: 14px;">${dateFormatted}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${summary ? `
      <!-- Summary Box -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="padding: 20px; background-color: #F9FAFB; border-radius: 8px;">
            <h4 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">
              📝 Résumé des résultats
            </h4>
            <p style="margin: 0; color: #4B5563; font-size: 14px; line-height: 1.6;">${summary}</p>
          </td>
        </tr>
      </table>
      ` : ''}

      ${divider()}

      <!-- CTAs -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
        <tr>
          <td style="padding-bottom: 12px;">
            ${emailButton({ url: reportUrl, text: '📥 Télécharger le rapport complet', fullWidth: true })}
          </td>
        </tr>
        <tr>
          <td>
            ${emailButton({ url: bookingUrl, text: 'Voir les détails sur le tableau de bord', fullWidth: true })}
          </td>
        </tr>
      </table>

      <!-- Info Note -->
      ${alertBox({
        type: resultStatus === 'pass' ? 'success' : resultStatus === 'fail' ? 'error' : 'warning',
        children: resultStatus === 'pass' 
          ? `<strong>🎉 Félicitations !</strong> Votre produit/installation a passé l'inspection avec succès. Le rapport complet contient tous les détails et photos.`
          : resultStatus === 'fail'
          ? `<strong>⚠️ Action requise :</strong> Veuillez consulter le rapport complet pour comprendre les motifs de l'échec et les mesures correctives nécessaires.`
          : `<strong>📋 Attention :</strong> Certaines conditions doivent être remplies. Consultez le rapport pour les détails et recommandations.`
      })}
    `,
  });

  const text = `
INSPECTION COMPLÉTÉE

Inspection complétée, ${userName} !

L'inspection ${inspectionType} a été réalisée par ${inspectorName}.
Voici les résultats préliminaires.

RÉSULTAT : ${sc.label.toUpperCase()}
SCORE GLOBAL : ${resultScore}/100

RÉSUMÉ DE L'INSPECTION :
N° de réservation : ${bookingNumber}
Type d'inspection : ${inspectionType}
Inspecteur : ${inspectorName}
Date de réalisation : ${dateFormatted}

${summary ? `RÉSUMÉ DES RÉSULTATS :
${summary}` : ''}

Télécharger le rapport complet : ${reportUrl}
Voir les détails : ${bookingUrl}

${resultStatus === 'pass' 
  ? '🎉 Félicitations ! Votre produit/installation a passé l\'inspection avec succès.'
  : resultStatus === 'fail'
  ? '⚠️ Action requise : Veuillez consulter le rapport complet pour les mesures correctives.'
  : '📋 Attention : Certaines conditions doivent être remplies. Consultez le rapport.'}

© ${new Date().getFullYear()} AlgeriaTrade.dz — Tous droits réservés
  `.trim();

  return { html, text };
}
