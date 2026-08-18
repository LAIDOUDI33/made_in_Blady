// Invoice Email Templates
// Professional email templates for invoice notifications

export interface EmailTemplateData {
  recipientName: string
  recipientEmail: string
  companyName: string
  invoiceNumber: string
  invoiceType: string
  issueDate: string
  dueDate: string
  subtotal: string
  tvaAmount: string
  totalAmount: string
  currency: string
  paymentTerms: string
  invoiceUrl?: string
  pdfUrl?: string
  sellerInfo?: {
    name: string
    email: string
    phone: string
    address: string
    nif: string
    rc: string
  }
}

// ============================================
// Template 1: New Invoice Created (Draft)
// ============================================

export function getInvoiceCreatedTemplate(data: EmailTemplateData): {
  subject: string
  html: string
  text: string
} {
  const subject = `Nouvelle facture créée : ${data.invoiceNumber}`;

  const html = `
<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #006233, #008040); padding: 30px; color: white;">
      <h1 style="margin: 0; font-size: 24px;">Nouvelle Facture Créée</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Une nouvelle facture a été préparée pour vous</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      <p>Bonjour <strong>${data.recipientName}</strong>,</p>
      
      <p>Une nouvelle facture a été créée et est en attente de votre validation :</p>

      <div style="background: #f8f9fa; border-left: 4px solid #006233; padding: 20px; margin: 25px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>N° Facture</strong></td>
            <td style="padding: 8px 0; font-family: monospace; font-size: 16px; color: #006233;">${data.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Date d'émission</strong></td>
            <td style="padding: 8px 0;">${data.issueDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Date d'échéance</strong></td>
            <td style="padding: 8px 0;">${data.dueDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Montant TTC</strong></td>
            <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #006233;">${data.totalAmount} ${data.currency}</td>
          </tr>
        </table>
      </div>

      <p>Cette facture est actuellement au statut <strong>brouillon</strong>. Elle sera officiellement émise après validation.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.invoiceUrl || '#'}" style="display: inline-block; background: #006233; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Voir la Facture
        </a>
      </div>

      <p>Si vous avez des questions concernant cette facture, n'hésitez pas à nous contacter.</p>

      <p>Cordialement,<br><strong>L'équipe ${data.companyName}</strong></p>
    </div>

    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 20px 30px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #e9ecef;">
      <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
      <p style="margin: 10px 0 0;">© ${new Date().getFullYear()} ${data.companyName}. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
BONJOUR ${data.recipientName.toUpperCase()},

Une nouvelle facture a été créée pour vous :

NUMÉRO DE FACTURE : ${data.invoiceNumber}
DATE D'ÉMISSION   : ${data.issueDate}
DATE D'ÉCHÉANCE     : ${data.dueDate}
MONTANT TTC        : ${data.totalAmount} ${data.currency}

Cette facture est actuellement au statut BROUILLON.

Pour consulter cette facture, veuillez vous connecter à votre compte.

Cordialement,
L'équipe ${data.companyName}
`;

  return { subject, html, text };
}

// ============================================
// Template 2: Invoice Issued (Official)
// ============================================

export function getInvoiceIssuedTemplate(data: EmailTemplateData): {
  subject: string
  html: string
  text: string
} {
  const subject = `Facture émise : ${data.invoiceNumber}`;

  const html = `
<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <div style="background: linear-gradient(135deg, #006233, #008040); padding: 30px; color: white;">
      <h1 style="margin: 0; font-size: 24px;">FACTURE OFFICIELLE</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Document fiscal conforme à la réglementation algérienne</p>
    </div>

    <div style="padding: 30px;">
      <p>Bonjour <strong>${data.recipientName}</strong>,</p>
      
      <p>Nous vous informons que la facture suivante a été <strong>officiellement émise</strong> :</p>

      <div style="background: #e8f5e9; border-left: 4px solid #2e7d32; padding: 20px; margin: 25px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>N° Facture</strong></td>
            <td style="padding: 8px 0; font-family: monospace; font-size: 18px; color: #2e7d32;">${data.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Date d'émission</strong></td>
            <td style="padding: 8px 0;">${data.issueDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Date d'échéance</strong></td>
            <td style="padding: 8px 0; font-weight: 500; color: #d32f2f;">${data.dueDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Sous-total HT</strong></td>
            <td style="padding: 8px 0;">${data.subtotal} ${data.currency}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>TVA</strong></td>
            <td style="padding: 8px 0;">${data.tvaAmount} ${data.currency}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #333; font-size: 16px;"><strong>Total TTC</strong></td>
            <td style="padding: 12px 0; font-size: 18px; font-weight: bold; color: #2e7d32;">${data.totalAmount} ${data.currency}</td>
          </tr>
        </table>
      </div>

      <p><strong>Conditions de paiement :</strong> ${data.paymentTerms}</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.invoiceUrl || '#'}" style="display: inline-block; background: #2e7d32; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Consulter et Payer la Facture
        </a>
      </div>

      <p style="color: #d32f2f; font-size: 14px;">
        ⚠️ Important : Cette facture constitue un document fiscal officiel. 
        Veuillez effectuer le paiement avant la date d'échéance.
      </p>

      <p>Pour toute question, contactez notre service client.</p>

      <p>Cordialement,<br><strong>L'équipe ${data.companyName}</strong></p>
    </div>

    <div style="background: #f8f9fa; padding: 20px 30px; font-size: 11px; color: #666; text-align: center; border-top: 1px solid #e9ecef;">
      <p>Document généré par AlgeriaTrade.dz | NIF: ${data.sellerInfo?.nif || 'N/A'} | RC: ${data.sellerInfo?.rc || 'N/A'}</p>
      <p style="margin: 10px 0 0;">Ce document doit être conservé pendant 10 ans conformément à la réglementation fiscale algérienne.</p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
FACTURE ÉMISE - DOCUMENT FISCAL OFFICIEL

===============================================

Cher(e) ${data.recipientName},

Nous vous confirmons l'émission officielle de votre facture :

RÉFÉRENCE FACTURE : ${data.invoiceNumber}
DATE D'ÉMISSION     : ${data.issueDate}
DATE D'ÉCHÉANCE       : ${data.dueDate}
CONDITIONS DE PAIEMENT : ${data.paymentTerms}

RÉCAPITULATIF FINANCIER :
-----------------------
Sous-total HT : ${data.subtotal} ${data.currency}
TVA           : ${data.tvaAmount} ${data.currency}
--------------
Total TTC     : ${data.totalAmount} ${data.currency}
==============

Cette facture est un document fiscal officiel conforme à la 
réglementation algérienne (Code des Impôts Directs et Taxes).

VEUILLEZ EFFECTUER LE PAIEMENT AVANT LA DATE D'ÉCHÉANCE.

Pour consulter ou payer cette facture :
${data.invoiceUrl || 'Connectez-vous à votre compte.'}

Cordialement,
L'équipe ${data.companyName}

---
${data.companyName}
${data.sellerInfo?.address || ''}
NIF : ${data.sellerInfo?.nif || 'N/A'} | RC : ${data.sellerInfo?.rc || 'N/A'}
`;

  return { subject, html, text };
}

// ============================================
// Template 3: Payment Reminder / Overdue Notice
// ============================================

export function getOverdueReminderTemplate(data: EmailTemplateData & { daysOverdue: number }): {
  subject: string
  html: string
  text: string
} {
  const subject = `RAPPEL - Facture en retard : ${data.invoiceNumber}`;
  const urgency = data.daysOverdue > 7 ? 'URGENT' : data.daysOverdue > 3 ? 'IMPORTANT' : 'Rappel';

  const html = `
<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #fff3e0;">
  <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.15); border: 2px solid #ff9800;">
    
    <div style="background: linear-gradient(135deg, #e65100, #ff9800); padding: 30px; color: white;">
      <span style="display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; letter-spacing: 1px;">
        ${urgency}
      </span>
      <h1 style="margin: 15px 0 0; font-size: 22px;">Facture en Retard de Paiement</h1>
    </div>

    <div style="padding: 30px;">
      <p>Bonjour <strong>${data.recipientName}</strong>,</p>
      
      <p>Nous attirons votre attention sur le fait que la facture ci-dessous est <strong style="color: #d32f2f;">en retard de paiement</strong> de <strong>${data.daysOverdue} jour(s)</strong> :</p>

      <div style="background: #fff3e0; border: 2px solid #ffcc80; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #666;"><strong>N° Facture</strong></td>
            <td style="padding: 10px 0; font-family: monospace; font-size: 16px; color: #e65100;">${data.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666;"><strong>Date d'échéance</strong></td>
            <td style="padding: 10px 0; color: #d32f2f; font-weight: 500;">${data.dueDate} (dépassée)</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666;"><strong>Jours de retard</strong></td>
            <td style="padding: 10px 0; font-size: 18px; font-weight: bold; color: #d32f2f;">${data.daysOverdue} jours</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #333; font-size: 16px;"><strong>Montant dû</strong></td>
            <td style="padding: 10px 0; font-size: 20px; font-weight: bold; color: #d32f2f;">${data.totalAmount} ${data.currency}</td>
          </tr>
        </table>
      </div>

      <p>Veuillez procéder au règlement de cette facture dans les plus brefs délais.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.invoiceUrl || '#'}" style="display: inline-block; background: #e65100; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Payer Maintenant
        </a>
      </div>

      <p style="font-size: 14px; color: #666;">
        Si vous avez déjà effectué le paiement, veuillez ignorer ce message.<br>
        Pour toute difficulté, n'hésitez pas à nous contacter.
      </p>

      <p>Cordialement,<br><strong>L'équipe ${data.companyName}</strong></p>
    </div>

    <div style="background: #fff3e0; padding: 20px 30px; font-size: 11px; color: #666; text-align: center; border-top: 1px solid #ffe0b2;">
      <p>Ceci est un rappel automatique. Des pénalités de retard peuvent s'appliquer.</p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
${urgency} - RAPPEL DE PAIEMENT

===============================================

Cher(e) ${data.recipientName},

VOTRE FACTURE EST EN RETARD DE PAIEMENT

Numéro de facture : ${data.invoiceNumber}
Date d'échéance   : ${data.dueDate}
Jours de retard   : ${data.daysOverdue} JOURS
Montant dû       : ${data.totalAmount} ${data.currency}

===============================================

Nous n'avons pas encore reçu le paiement de cette facture.

Veuillez régulariser votre situation dès que possible.

Des frais de retard peuvent être appliqués conformément aux 
conditions générales de vente.

POUR EFFECTUER LE PAIEMENT :
${data.invoiceUrl || 'Connectez-vous à votre compte.'}

Si vous avez déjà effectué le paiement, veuillez ignorer ce rappel.

Pour toute assistance, contactez notre service client.

Cordialement,
Service Recouvrement - ${data.companyName}
`;

  return { subject, html, text };
}

// ============================================
// Template 4: Payment Confirmation
// ============================================

export function getPaymentReceivedTemplate(data: EmailTemplateData & { paymentAmount: string; paymentMethod: string; paymentReference?: string }): {
  subject: string
  html: string
  text: string
} {
  const subject = `Confirmation de paiement - ${data.invoiceNumber}`;

  const html = `
<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <div style="background: linear-gradient(135deg, #2e7d32, #43a047); padding: 30px; color: white; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 10px;">✓</div>
      <h1 style="margin: 0; font-size: 24px;">Paiement Reçu</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Merci pour votre paiement</p>
    </div>

    <div style="padding: 30px;">
      <p>Bonjour <strong>${data.recipientName}</strong>,</p>
      
      <p>Nous confirmons la réception de votre paiement pour la facture :</p>

      <div style="background: #e8f5e9; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #666;">Facture N°</p>
        <p style="margin: 5px 0 0; font-family: monospace; font-size: 22px; font-weight: bold; color: #2e7d32;">${data.invoiceNumber}</p>
        
        <div style="border-top: 1px solid #c8e6c9; margin: 20px auto; width: 100px;"></div>
        
        <p style="margin: 0; font-size: 18px; color: #2e7d32; font-weight: 500;">
          Montant payé : ${data.paymentAmount} ${data.currency}
        </p>
        <p style="margin: 5px 0 0; font-size: 14px; color: #666;">
          Mode de paiement : ${data.paymentMethod}
          ${data.paymentReference ? `<br>Référence : ${data.paymentReference}` : ''}
        </p>
      </div>

      <p>Un reçu officiel sera disponible dans votre espace client.</p>

      <p>Merci de votre confiance en ${data.companyName}. Nous apprécions votre ponctualité.</p>

      <p>Cordialement,<br><strong>L'équipe ${data.companyName}</strong></p>
    </div>

    <div style="background: #f8f9fa; padding: 20px 30px; font-size: 11px; color: #666; text-align: center; border-top: 1px solid #e9ecef;">
      <p>Cette confirmation ne vaut pas comme facture officielle. Conservez vos justificatifs de paiement.</p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
CONFIRMATION DE PAIEMENT
========================

Bonjour ${data.recipientName},

NOUS CONFIRMONS LA RÉCEPTION DE VOTRE PAIEMENT.

Détails du paiement :
---------------------
Facture         : ${data.invoiceNumber}
Montant payé     : ${data.paymentAmount} ${data.currency}
Mode de paiement : ${data.paymentMethod}
${data.paymentReference ? `Référence      : ${data.paymentReference}` : ''}

Votre paiement a bien été pris en compte.

Un reçu officiel est disponible dans votre espace client.

Merci pour votre confiance en ${data.companyName}.

Cordialement,
L'équipe ${data.companyName}
`;

  return { subject, html, text };
}

// ============================================
// Template 5: Invoice Cancelled
// ============================================

export function getInvoiceCancelledTemplate(data: EmailTemplateData & { cancellationReason: string }): {
  subject: string
  html: string
  text: string
} {
  const subject = `Facture annulée : ${data.invoiceNumber}`;

  const html = `
<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <div style="background: linear-gradient(135deg, #757575, #9e9e9e); padding: 30px; color: white;">
      <h1 style="margin: 0; font-size: 24px;">Facture Annulée</h1>
    </div>

    <div style="padding: 30px;">
      <p>Bonjour <strong>${data.recipientName}</strong>,</p>
      
      <p>Nous vous informons que la facture suivante a été <strong style="color: #9e9e9e;">annulée</strong> :</p>

      <div style="background: #fafafa; border-left: 4px solid #9e9e9e; padding: 20px; margin: 25px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>N° Facture</strong></td>
            <td style="padding: 8px 0; font-family: monospace; text-decoration: line-through;">${data.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Raison de l'annulation</strong></td>
            <td style="padding: 8px 0;">${data.cancellationReason}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;"><strong>Montant original</strong></td>
            <td style="padding: 8px 0; text-decoration: line-through;">${data.totalAmount} ${data.currency}</td>
          </tr>
        </table>
      </div>

      <p>Cette facture n'a plus aucune valeur comptable ou fiscale.</p>

      <p>Si vous avez des questions concernant cette annulation, n'hésitez pas à nous contacter.</p>

      <p>Cordialement,<br><strong>L'équipe ${data.companyName}</strong></p>
    </div>

    <div style="background: #f8f9fa; padding: 20px 30px; font-size: 11px; color: #666; text-align: center; border-top: 1px solid #e9ecef;">
      <p>Email automatique - Ne pas répondre</p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
FACTURE ANNULÉE
==============

Bonjour ${data.recipientName},

La facture suivante a été ANNULÉE :

Numéro de facture : ${data.invoiceNumber}
Raison             : ${data.cancellationReason}
Montant original   : ${data.totalAmount} ${data.currency}

Cette facture n'a plus aucune valeur comptable ou fiscale.

Pour toute question, contactez notre service client.

Cordialement,
L'équipe ${data.companyName}
`;

  return { subject, html, text };
}

// Export all templates
export default {
  getInvoiceCreatedTemplate,
  getInvoiceIssuedTemplate,
  getOverdueReminderTemplate,
  getPaymentReceivedTemplate,
  getInvoiceCancelledTemplate,
};
