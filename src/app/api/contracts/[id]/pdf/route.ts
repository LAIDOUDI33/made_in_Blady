import { NextRequest, NextResponse } from 'next/server';
import { getContractById } from '@/lib/contracts';

// GET /api/contracts/[id]/pdf - Generate and download contract PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contract = await getContractById(id);

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Generate HTML content for PDF (simplified version)
    // In production, use a proper PDF library like puppeteer or jsPDF
    const htmlContent = generateContractHTML(contract);

    // Return HTML that can be printed/saved as PDF
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${contract.contractNumber}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF - فشل في توليد PDF' },
      { status: 500 }
    );
  }
}

function generateContractHTML(contract: any): string {
  const partyA = contract.partyA || {};
  const partyB = contract.partyB || {};
  
  return `
<!DOCTYPE html>
<html dir="auto" lang="mul">
<head>
  <meta charset="UTF-8">
  <title>${contract.contractNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
    }
    .header { 
      text-align: center; 
      border-bottom: 3px double #006233; 
      padding-bottom: 20px; 
      margin-bottom: 30px;
    }
    .header h1 { color: #006233; font-size: 24px; }
    .header .contract-number { font-size: 14px; color: #666; margin-top: 5px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .party-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
    .party-card h3 { color: #D52B1E; margin-bottom: 10px; font-size: 16px; }
    .party-card p { font-size: 12px; margin: 5px 0; }
    .section { margin-bottom: 25px; }
    .section h2 { 
      background: linear-gradient(to right, #006233, #00875a);
      color: white; 
      padding: 10px 15px; 
      font-size: 16px;
      margin-bottom: 15px;
    }
    .clause { 
      margin-bottom: 20px; 
      padding-left: 15px; 
      border-left: 3px solid #006233;
    }
    .clause h4 { font-size: 14px; color: #333; margin-bottom: 8px; }
    .clause p { font-size: 13px; text-align: justify; }
    .bilingual { display: flex; flex-direction: column; gap: 10px; }
    .ar { direction: rtl; font-family: 'Traditional Arabic', serif; text-align: right; }
    .fr { font-style: italic; color: #444; }
    .financial-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .financial-table th, .financial-table td { 
      border: 1px solid #ddd; 
      padding: 10px; 
      text-align: left;
      font-size: 13px;
    }
    .financial-table th { background: #f5f5f5; font-weight: 600; }
    .signatures { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 50px; 
      margin-top: 50px;
      padding-top: 30px;
      border-top: 2px solid #ddd;
    }
    .signature-block { text-align: center; }
    .signature-line { 
      border-top: 1px solid #333; 
      width: 200px; 
      margin: 60px auto 10px;
    }
    .footer { 
      text-align: center; 
      margin-top: 40px; 
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 11px;
      color: #888;
    }
    @media print {
      body { padding: 10mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🇩🇿 AlgeriaTrade.dz</h1>
    <p>منصة التجارة بين الشركات في الجزائر</p>
    <p class="contract-number">${contract.contractNumber}</p>
  </div>

  <div class="parties">
    <div class="party-card">
      <h3>Party A - Supplier / البائع</h3>
      <p><strong>${partyA.companyName || 'N/A'}</strong></p>
      <p>Representative: ${partyA.representativeName || 'N/A'} (${partyA.representativeTitle || ''})</p>
      <p>Email: ${partyA.email || 'N/A'}</p>
      <p>Phone: ${partyA.phone || 'N/A'}</p>
      <p>Address: ${partyA.address || 'N/A'}</p>
      ${partyA.commercialRegister ? `<p>NRC: ${partyA.commercialRegister}</p>` : ''}
      ${partyA.taxId ? `<p>NIF: ${partyA.taxId}</p>` : ''}
    </div>
    
    <div class="party-card">
      <h3>Party B - Buyer / المشتري</h3>
      <p><strong>${partyB.companyName || 'N/A'}</strong></p>
      <p>Representative: ${partyB.representativeName || 'N/A'} (${partyB.representativeTitle || ''})</p>
      <p>Email: ${partyB.email || 'N/A'}</p>
      <p>Phone: ${partyB.phone || 'N/A'}</p>
      <p>Address: ${partyB.address || 'N/A'}</p>
      ${partyB.commercialRegister ? `<p>NRC: ${partyB.commercialRegister}</p>` : ''}
      ${partyB.taxId ? `<p>NIF: ${partyB.taxId}</p>` : ''}
    </div>
  </div>

  <div class="section">
    <h2>Subject Matter / موضوع العقد / Objet du contrat</h2>
    <div class="bilingual">
      <p><strong>EN:</strong> ${contract.subject}</p>
      <p class="ar"><strong>AR:</strong> ${contract.subjectAr}</p>
      <p class="fr"><strong>FR:</strong> ${contract.subjectFr}</p>
    </div>
  </div>

  <div class="section">
    <h2>Financial Terms / الشروط المالية / Conditions financières</h2>
    <table class="financial-table">
      <tr>
        <th>Total Value</th>
        <td>${contract.totalValue?.toLocaleString()} ${contract.currency}</td>
      </tr>
      <tr>
        <th>Currency</th>
        <td>${contract.currency} (Algerian Dinar)</td>
      </tr>
      <tr>
        <th>Payment Terms</th>
        <td>${contract.paymentTerms}</td>
      </tr>
      <tr>
        <th>Effective Date</th>
        <td>${new Date(contract.effectiveDate).toLocaleDateString()}</td>
      </tr>
      <tr>
        <th>End Date</th>
        <td>${contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Indefinite'}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>Contract Clauses / بنود العقد / Clauses du contrat</h2>
    ${(contract.clauses || []).map((clause: any, index: number) => `
      <div class="clause" style="order: ${clause.order || index}">
        <h4>${index + 1}. ${clause.title} / ${clause.titleAr} / ${clause.titleFr}</h4>
        <div class="bilingual">
          <p>${clause.content}</p>
          <p class="ar">${clause.contentAr}</p>
          <p class="fr">${clause.contentFr}</p>
        </div>
      </div>
    `).join('')}
  </div>

  ${(contract.customClauses && contract.customClauses.length > 0) ? `
  <div class="section">
    <h2>Custom Clauses / البود المخصصة / Clauses personnalisées</h2>
    ${contract.customClauses.map((clause: any) => `
      <div class="clause">
        <h4>${clause.title} / ${clause.titleAr} / ${clause.titleFr}</h4>
        <div class="bilingual">
          <p>${clause.content}</p>
          <p class="ar">${clause.contentAr}</p>
          <p class="fr">${clause.contentFr}</p>
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="signatures">
    <div class="signature-block">
      <p><strong>Party A - Supplier / البائع</strong></p>
      <div class="signature-line"></div>
      <p>Date: ${contract.partyASignedAt ? new Date(contract.partyASignedAt).toLocaleDateString() : '________________'}</p>
    </div>
    
    <div class="signature-block">
      <p><strong>Party B - Buyer / المشتري</strong></p>
      <div class="signature-line"></div>
      <p>Date: ${contract.partyBSignedAt ? new Date(contract.partyBSignedAt).toLocaleDateString() : '________________'}</p>
    </div>
  </div>

  <div class="footer">
    <p>This contract was generated electronically via AlgeriaTrade.dz platform</p>
    <p>تم إنشاء هذا العقد إلكترونياً عبر منصة الجزائر تريد</p>
    <p>Version: ${contract.version} | Generated: ${new Date().toISOString()}</p>
  </div>
</body>
</html>`;
}
