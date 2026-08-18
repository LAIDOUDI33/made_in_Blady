// Contract PDF Export Module
// وحدة تصدير العقود إلى PDF
// Module d'export PDF des contrats

import type { Contract, ContractClause, ContractParty } from '../contracts';

// ============================================
// TYPES
// ============================================

export interface PDFOptions {
  language: 'AR' | 'FR' | 'BILINGUAL';
  includeSignatureBlock: boolean;
  includeStampArea: boolean;
  includePageNumbers: boolean;
  includeLetterhead: boolean;
  watermark?: string;
  fontSize?: 'small' | 'medium' | 'large';
}

export interface PDFGenerationResult {
  success: boolean;
  pdfData?: string; // Base64 encoded PDF
  filename: string;
  error?: string;
}

export interface LetterheadConfig {
  companyName: string;
  logoUrl?: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  rcNumber?: string;
  nifNumber?: string;
}

// Default options
const DEFAULT_OPTIONS: PDFOptions = {
  language: 'BILINGUAL',
  includeSignatureBlock: true,
  includeStampArea: true,
  includePageNumbers: true,
  includeLetterhead: true,
  fontSize: 'medium',
};

const DEFAULT_LETTERHEAD: LetterheadConfig = {
  companyName: 'AlgeriaTrade.dz',
  address: 'Alger, Algérie',
  phone: '+213 XXX XXX XXX',
  email: 'contact@algeriatrade.dz',
  website: 'www.algeriatrade.dz',
};

// ============================================
// PDF GENERATION (Server-side compatible)
// ============================================

/**
 * Generate contract as HTML for PDF conversion
 * توليد العقد كـ HTML لتحويله إلى PDF
 */
export function generateContractHTML(
  contract: Contract,
  options: Partial<PDFOptions> = {},
  letterhead?: Partial<LetterheadConfig>
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lh = { ...DEFAULT_LETTERHEAD, ...letterhead };

  const isRTL = opts.language === 'AR' || opts.language === 'BILINGUAL';
  
  return `
<!DOCTYPE html>
<html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${opts.language === 'BILINGUAL' ? 'fr' : opts.language.toLowerCase()}">
<head>
  <meta charset="UTF-8">
  <title>${contract.contractNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: ${opts.fontSize === 'small' ? '10px' : opts.fontSize === 'large' ? '14px' : '12px'};
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
    }
    
    .letterhead {
      text-align: center;
      border-bottom: 3px solid #006233;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .letterhead h1 {
      color: #006233;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .letterhead .subtitle {
      color: #666;
      font-size: 12px;
    }
    
    .letterhead .contact-info {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 10px;
      font-size: 11px;
      color: #555;
    }
    
    .contract-header {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .contract-title {
      font-size: 18px;
      font-weight: bold;
      color: #006233;
      margin-bottom: 5px;
    }
    
    .contract-number {
      font-size: 14px;
      color: #666;
      margin-bottom: 20px;
    }
    
    .contract-meta {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 30px;
    }
    
    .meta-item {
      flex: 1;
      min-width: 200px;
    }
    
    .meta-label {
      font-weight: bold;
      color: #006233;
      font-size: 11px;
    }
    
    .meta-value {
      color: #333;
    }
    
    .parties-section {
      margin-bottom: 30px;
    }
    
    .party-block {
      background: #fafafa;
      border-left: 4px solid #006233;
      padding: 15px;
      margin-bottom: 15px;
    }
    
    .party-label {
      font-weight: bold;
      color: #006233;
      margin-bottom: 10px;
    }
    
    .party-details p {
      margin: 5px 0;
      font-size: 11px;
    }
    
    .clauses-section {
      margin-bottom: 40px;
    }
    
    .clause {
      margin-bottom: 25px;
    }
    
    .clause-title {
      font-weight: bold;
      color: #006233;
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .clause-content {
      text-align: justify;
    }
    
    .bilingual-content {
      border-top: 1px dashed #ccc;
      margin-top: 15px;
      padding-top: 15px;
    }
    
    .arabic-content {
      direction: rtl;
      text-align: right;
      font-family: 'Traditional Arabic', Arial, sans-serif;
      line-height: 1.8;
    }
    
    .french-content {
      font-style: italic;
      color: #444;
    }
    
    .signature-section {
      page-break-inside: avoid;
      margin-top: 50px;
    }
    
    .signature-blocks {
      display: flex;
      justify-content: space-around;
      gap: 30px;
      margin-top: 30px;
    }
    
    .signature-block {
      flex: 1;
      text-align: center;
    }
    
    .signature-line {
      border-top: 1px solid #333;
      width: 80%;
      margin: 60px auto 10px;
    }
    
    .signature-label {
      font-weight: bold;
      color: #333;
    }
    
    .signature-date {
      font-size: 11px;
      color: #666;
      margin-top: 5px;
    }
    
    .stamp-area {
      width: 120px;
      height: 120px;
      border: 2px dashed #999;
      border-radius: 50%;
      margin: 20px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 11px;
      text-align: center;
    }
    
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 9px;
      color: #999;
      padding: 10px;
      border-top: 1px solid #eee;
    }
    
    .page-number::after {
      content: counter(page) " / " counter(pages);
    }
    
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80px;
      color: rgba(0, 0, 0, 0.05);
      font-weight: bold;
      pointer-events: none;
      z-index: 1000;
    }
    
    @media print {
      .footer {
        position: running(footer);
      }
    }
  </style>
</head>
<body>
  ${opts.watermark ? `<div class="watermark">${opts.watermark}</div>` : ''}
  
  ${opts.includeLetterhead ? generateLetterheadHTML(lh) : ''}
  
  ${generateContractHeaderHTML(contract)}
  ${generatePartiesHTML(contract.partyA, contract.partyB)}
  ${generateClausesHTML(contract.clauses, contract.customClauses, opts.language)}
  
  ${opts.includeSignatureBlock ? generateSignatureSectionHTML(contract) : ''}
  
  ${opts.includePageNumbers ? '<footer class="footer">AlgeriaTrade.dz - Page <span class="page-number"></span></footer>' : ''}
</body>
</html>`;
}

function generateLetterheadHTML(config: LetterheadConfig): string {
  return `
<div class="letterhead">
  <h1>${config.companyName}</h1>
  <div class="subtitle">Plateforme B2B de Commerce en Algérie</div>
  <div style="margin-top: 5px;">
    <span>منصة التجارة B2B في الجزائر</span>
  </div>
  <div class="contact-info">
    <span>📍 ${config.address}</span>
    <span>📞 ${config.phone}</span>
    <span>✉️ ${config.email}</span>
    <span>🌐 ${config.website}</span>
  </div>
</div>`;
}

function generateContractHeaderHTML(contract: Contract): string {
  const statusLabels: Record<string, { en: string; ar: string; fr: string }> = {
    DRAFT: { en: 'DRAFT', ar: 'مسودة', fr: 'BROILLON' },
    SIGNED: { en: 'SIGNED', ar: 'موقع', fr: 'SIGNÉ' },
    PENDING_SIGNATURE: { en: 'PENDING SIGNATURE', ar: 'في انتظار التوقيع', fr: 'EN ATTENTE DE SIGNATURE' },
  };

  const statusLabel = statusLabels[contract.status]?.en || contract.status;

  return `
<div class="contract-header">
  <div class="contract-title">${contract.subjectFr || contract.subject}</div>
  <div style="font-size: 14px; color: #666;">${contract.subjectAr}</div>
  <div class="contract-number">${contract.contractNumber}</div>
  <span style="display: inline-block; background: ${contract.status === 'SIGNED' ? '#28a745' : '#ffc107'}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 11px;">${statusLabel}</span>
</div>

<div class="contract-meta">
  <div class="meta-item">
    <div class="meta-label">Date d'effet / تاريخ النفاذ / Effective Date:</div>
    <div class="meta-value">${new Date(contract.effectiveDate).toLocaleDateString('fr-FR')}</div>
  </div>
  <div class="meta-item">
    <div class="meta-label">Date d'échéance / تاريخ الانتهاء / End Date:</div>
    <div class="meta-value">${contract.endDate ? new Date(contract.endDate).toLocaleDateString('fr-FR') : 'Indéterminée'}</div>
  </div>
  <div class="meta-item">
    <div class="meta-label">Montant / المبلغ / Amount:</div>
    <div class="meta-value">${new Intl.NumberFormat('fr-DZ').format(contract.totalValue)} ${contract.currency}</div>
  </div>
</div>`;
}

function generatePartiesHTML(partyA: ContractParty, partyB: ContractParty): string {
  return `
<div class="parties-section">
  <div class="party-block">
    <div class="party-label">PARTIE A - LE FOURNISSEUR / الطرف أ - المورد</div>
    <div class="party-details">
      <p><strong>Dénomination / التسمية:</strong> ${partyA.companyName}</p>
      <p><strong>Représenté par / ممثل من قبل:</strong> ${partyA.representativeName} (${partyA.representativeTitle})</p>
      <p><strong>Adresse / العنوان:</strong> ${partyA.address}</p>
      <p><strong>NRC:</strong> ${partyA.commercialRegister} | <strong>NIF:</strong> ${partyA.taxId}</p>
      <p><strong>Email:</strong> ${partyA.email} | <strong>Tél:</strong> ${partyA.phone}</p>
    </div>
  </div>
  
  <div class="party-block">
    <div class="party-label">PARTIE B - L'ACHETEUR / الطرف ب - المشتري</div>
    <div class="party-details">
      <p><strong>Dénomination / التسمية:</strong> ${partyB.companyName}</p>
      <p><strong>Représenté par / ممثل من قبل:</strong> ${partyB.representativeName} (${partyB.representativeTitle})</p>
      <p><strong>Adresse / العنوان:</strong> ${partyB.address}</p>
      <p><strong>NRC:</strong> ${partyB.commercialRegister} | <strong>NIF:</strong> ${partyB.taxId}</p>
      <p><strong>Email:</strong> ${partyB.email} | <strong>Tél:</strong> ${partyB.phone}</p>
    </div>
  </div>
</div>`;
}

function generateClausesHTML(
  clauses: ContractClause[],
  customClauses: ContractClause[],
  language: string
): string {
  let html = '<div class="clauses-section">';
  
  // Group clauses by type
  const groupedClauses = new Map<string, ContractClause[]>();
  
  [...clauses, ...customClauses].forEach(clause => {
    const type = clause.clauseType;
    if (!groupedClauses.has(type)) {
      groupedClauses.set(type, []);
    }
    groupedClauses.get(type)!.push(clause);
  });

  groupedClauses.forEach((typeClauses, type) => {
    typeClauses.forEach(clause => {
      html += `
      <div class="clause">
        <div class="clause-title">
          ${language !== 'AR' ? clause.title : ''}
          ${language === 'BILINGUAL' ? ' / ' + clause.titleAr : ''}
          ${language === 'BILINGUAL' ? ' / ' + clause.titleFr : ''}
          ${language === 'AR' ? clause.title : ''}
        </div>
        <div class="clause-content">
          ${language !== 'AR' ? `<p>${clause.content}</p>` : ''}
          
          ${(language === 'BILINGUAL' || language === 'AR') ? `
          <div class="bilingual-content arabic-content">
            <p>${clause.contentAr}</p>
          </div>` : ''}
          
          ${language === 'BILINGUAL' || language === 'FR' ? `
          <div class="bilingual-content french-content">
            <p>${clause.contentFr}</p>
          </div>` : ''}
        </div>
      </div>`;
    });
  });

  html += '</div>';
  return html;
}

function generateSignatureSectionHTML(contract: Contract): string {
  const partyASigned = !!contract.partyASignedAt;
  const partyBSigned = !!contract.partyBSignedAt;

  return `
<div class="signature-section">
  <h3 style="text-align: center; color: #006233; margin-bottom: 20px;">Signatures / التوقيعات</h3>
  
  <div class="signature-blocks">
    <div class="signature-block">
      <div class="party-label">PARTIE A - LE FOURNISSEUR</div>
      <div class="party-label" style="font-size: 12px;">الطرف أ - المورد</div>
      
      ${partyASigned ? `
        <div style="color: #28a745; margin: 20px 0;">✓ Signé le ${new Date(contract.partyASignedAt!).toLocaleDateString('fr-FR')}</div>
        <div style="color: #28a745; margin: 5px 0;">✓ موقع في ${new Date(contract.partyASignedAt!).toLocaleDateString('ar-DZ')}</div>
      ` : '<div class="signature-line"></div>'}
      
      <div class="signature-label">${contract.partyA?.representativeName || '____________________'}</div>
      <div style="font-size: 11px; color: #666;">${contract.partyA?.representativeTitle || ''}</div>
      <div class="signature-date">${partyASigned ? new Date(contract.partyASignedAt!).toLocaleDateString() : 'Date: _______________'}</div>
    </div>
    
    <div class="signature-block">
      <div class="party-label">PARTIE B - L'ACHETEUR</div>
      <div class="party-label" style="font-size: 12px;">الطرف ب - المشتري</div>
      
      ${partyBSigned ? `
        <div style="color: #28a745; margin: 20px 0;">✓ Signé le ${new Date(contract.partyBSignedAt!).toLocaleDateString('fr-FR')}</div>
        <div style="color: #28a745; margin: 5px 0;">✓ موقع في ${new Date(contract.partyBSignedAt!).toLocaleDateString('ar-DZ')}</div>
      ` : '<div class="signature-line"></div>'}
      
      <div class="signature-label">${contract.partyB?.representativeName || '____________________'}</div>
      <div style="font-size: 11px; color: #666;">${contract.partyB?.representativeTitle || ''}</div>
      <div class="signature-date">${partyBSigned ? new Date(contract.partyBSignedAt!).toLocaleDateString() : 'Date: _______________'}</div>
    </div>
  </div>
  
  <div class="stamp-area">
    Cachet / ختم<br/>Stamp
  </div>
</div>`;
}

/**
 * Generate filename for PDF export
 * توليد اسم ملف للتصدير
 */
export function generatePDFFilename(contract: Contract): string {
  const date = new Date().toISOString().slice(0, 10);
  const safeSubject = contract.subject.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  return `${contract.contractNumber}_${safeSubject}_${date}.pdf`;
}

/**
 * Get PDF generation statistics
 * الحصول على إحصائيات توليد PDF
 */
export function getPDFStats(): {
  generatedToday: number;
  generatedThisWeek: number;
  totalGenerated: number;
  averageSize: number;
} {
  // In production, would query database
  return {
    generatedToday: 0,
    generatedThisWeek: 0,
    totalGenerated: 0,
    averageSize: 150, // KB
  };
}

export default {
  generateContractHTML,
  generatePDFFilename,
  getPDFStats,
};
