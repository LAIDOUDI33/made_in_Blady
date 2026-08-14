// ============================================
// Advanced Reporting System - Export Service
// AlgeriaTrade.dz B2B Platform
// Handles export to multiple formats: PDF, CSV, Excel, JSON, HTML
// ============================================

import { ReportResult, ReportFormat } from './types';

/**
 * Export service class
 * Converts report data to various downloadable formats
 */
export class ReportExporter {
  
  /**
   * Export a report to the specified format
   * @param report - The generated report to export
   * @param format - Target export format
   * @returns Buffer containing the exported data
   */
  async export(report: ReportResult, format: ReportFormat): Promise<Buffer> {
    switch (format) {
      case 'pdf':
        return this.exportToPDF(report);
      case 'csv':
        return this.exportToCSV(report);
      case 'excel':
        return this.exportToExcel(report);
      case 'json':
        return this.exportToJSON(report);
      case 'html':
        return this.exportToHTML(report);
      default:
        throw new Error(`Format d'export non supporté: ${format}`);
    }
  }

  /**
   * Get MIME type for a given format
   */
  getMimeType(format: ReportFormat): string {
    const mimeTypes: Record<ReportFormat, string> = {
      pdf: 'application/pdf',
      csv: 'text/csv',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      json: 'application/json',
      html: 'text/html',
    };
    return mimeTypes[format];
  }

  /**
   * Get file extension for a given format
   */
  getFileExtension(format: ReportFormat): string {
    const extensions: Record<ReportFormat, string> = {
      pdf: '.pdf',
      csv: '.csv',
      excel: '.xlsx',
      json: '.json',
      html: '.html',
    };
    return extensions[format];
  }

  // ============================================
  // FORMAT-SPECIFIC EXPORTERS
  // ============================================

  /**
   * Export to PDF format
   * Generates HTML that can be converted to PDF using a headless browser or library
   */
  private async exportToPDF(report: ReportResult): Promise<Buffer> {
    // For PDF generation, we create HTML content with print-optimized styles
    // In production, this would be converted using puppeteer, wkhtmltopdf, or @react-pdf/renderer
    const htmlContent = this.generatePDFCompatibleHTML(report);
    
    // Return as HTML buffer - can be converted to actual PDF by the calling function
    // For now, we return styled HTML that prints well
    return Buffer.from(htmlContent, 'utf-8');
  }

  /**
   * Export to CSV format
   * Standard comma-separated values with proper escaping
   */
  private async exportToCSV(report: ReportResult): Promise<Buffer> {
    const { headers, rows } = report.data.table;
    
    // Build CSV content with proper escaping
    const csvLines: string[] = [];
    
    // Add metadata as comments at the top
    csvLines.push(`# Rapport: ${report.config.type}`);
    csvLines.push(`# Généré le: ${report.generatedAt.toLocaleString('fr-FR')}`);
    csvLines.push(`# Par: ${report.generatedBy}`);
    csvLines.push('');
    
    // Header row
    csvLines.push(headers.map(h => this.escapeCSVField(h)).join(','));
    
    // Data rows
    rows.forEach(row => {
      csvLines.push(row.map(cell => this.escapeCSVField(String(cell))).join(','));
    });
    
    // Add summary section
    csvLines.push('');
    csvLines.push('# RÉSUMÉ');
    Object.entries(report.data.summary).forEach(([key, value]) => {
      csvLines.push(`${this.escapeCSVField(key)},${this.escapeCSVField(String(value))}`);
    });
    
    return Buffer.from(csvLines.join('\n'), 'utf-8');
  }

  /**
   * Export to Excel format
   * Creates an Excel-compatible file (simplified XML format)
   * In production, use exceljs library for full Excel support
   */
  private async exportToExcel(report: ReportResult): Promise<Buffer> {
    // Create a simplified Excel XML format
    // For production, use the exceljs library for full .xlsx support
    
    const { headers, rows } = report.data.table;
    
    // Generate Excel XML content
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center"/>
   <Font ss:Bold="1"/>
   <Interior ss:Color="#006233" ss:Pattern="Solid"/>
   <Font ss:Color="#FFFFFF"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:Bold="1" ss:Size="16"/>
  </Style>
  <Style ss:ID="Metric">
   <Font ss:Bold="1" ss:Color="#006233"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Rapport">
  <Table>
   <Row>
    <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="Title"><Data ss:Type="String">📊 Rapport: ${report.config.type}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="${headers.length - 1}"><Data ss:Type="String">Généré le ${report.generatedAt.toLocaleDateString('fr-FR')}</Data></Cell>
   </Row>
   <Row/>
   ${rows.map((row, idx) => `
   <Row>
    ${(idx === 0 ? headers : row).map((cell, cellIdx) => 
      `<Cell ss:StyleID="${idx === -1 || idx === 0 ? 'Header' : ''}"><Data ss:Type="String">${this.escapeXML(String(cell))}</Data></Cell>`
    ).join('')}
   </Row>`).join('')}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Résumé">
  <Table>
   <Row><Cell><Data ss:Type="String">Métrique</Data></Cell><Cell><Data ss:Type="String">Valeur</Data></Cell></Row>
   ${Object.entries(report.data.summary).map(([key, value]) => `
   <Row>
    <Cell ss:StyleID="Metric"><Data ss:Type="String">${this.escapeXML(key)}</Data></Cell>
    <Cell><Data ss:Type="String">${this.escapeXML(String(value))}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`;
    
    return Buffer.from(xmlContent, 'utf-8');
  }

  /**
   * Export to JSON format
   * Clean JSON with all report data
   */
  private async exportToJSON(report: ReportResult): Promise<Buffer> {
    const jsonData = {
      metadata: {
        id: report.id,
        type: report.config.type,
        format: report.config.format,
        period: report.config.period,
        generatedAt: report.generatedAt.toISOString(),
        generatedBy: report.generatedBy,
        expiresAt: report.expiresAt.toISOString(),
        processingTimeMs: report.metadata.processingTimeMs,
        recordCount: report.metadata.recordCount,
      },
      summary: report.data.summary,
      table: report.data.table,
      insights: report.data.insights,
      charts: report.data.charts.map(chart => ({
        type: chart.type,
        title: chart.title,
        dataPoints: chart.data.length,
      })),
    };
    
    return Buffer.from(JSON.stringify(jsonData, null, 2), 'utf-8');
  }

  /**
   * Export to HTML format
   * Full-styled HTML report suitable for viewing or printing
   */
  private async exportToHTML(report: ReportResult): Promise<Buffer> {
    return Buffer.from(this.generateHTMLReport(report), 'utf-8');
  }

  // ============================================
  // HTML GENERATORS
  // ============================================

  /**
   * Generate full HTML report with styling
   */
  private generateHTMLReport(report: ReportResult): string {
    const { headers, rows } = report.data.table;
    
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport ${report.config.type} - AlgeriaTrade.dz</title>
    <style>
        :root {
            --primary-color: #006233;
            --secondary-color: #D52B1E;
            --accent-color: #FFD700;
            --bg-light: #f8f9fa;
            --text-dark: #212529;
            --text-muted: #6c757d;
            --border-color: #dee2e6;
            --success-color: #28a745;
            --warning-color: #ffc107;
            --danger-color: #dc3545;
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: var(--text-dark);
            background: var(--bg-light);
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-radius: 12px;
            overflow: hidden;
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, var(--primary-color) 0%, #004d27 100%);
            color: white;
            padding: 30px 40px;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .header-meta {
            opacity: 0.9;
            font-size: 14px;
        }
        
        .header-meta span {
            margin-right: 20px;
        }
        
        /* Summary Cards */
        .summary-section {
            padding: 30px 40px;
            background: var(--bg-light);
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            text-align: center;
        }
        
        .metric-label {
            font-size: 13px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        
        .metric-value {
            font-size: 28px;
            font-weight: 700;
            color: var(--primary-color);
        }
        
        /* Table Section */
        .table-section {
            padding: 30px 40px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: var(--text-dark);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .table-wrapper {
            overflow-x: auto;
            border-radius: 10px;
            border: 1px solid var(--border-color);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th {
            background: var(--primary-color);
            color: white;
            padding: 14px 16px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        td {
            padding: 12px 16px;
            border-bottom: 1px solid var(--border-color);
            font-size: 14px;
        }
        
        tr:hover {
            background: rgba(0, 98, 51, 0.03);
        }
        
        tr:last-child td {
            border-bottom: none;
        }
        
        /* Insights Section */
        .insights-section {
            padding: 30px 40px;
            background: var(--bg-light);
        }
        
        .insight-card {
            background: white;
            padding: 16px 20px;
            border-radius: 8px;
            margin-bottom: 12px;
            border-left: 4px solid var(--primary-color);
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }
        
        .insight-icon {
            font-size: 18px;
            flex-shrink: 0;
        }
        
        .insight-text {
            font-size: 14px;
            color: var(--text-dark);
        }
        
        /* Footer */
        .footer {
            background: var(--text-dark);
            color: white;
            padding: 20px 40px;
            text-align: center;
            font-size: 13px;
        }
        
        .footer a {
            color: var(--accent-color);
            text-decoration: none;
        }
        
        /* Print styles */
        @media print {
            body { padding: 0; background: white; }
            .container { box-shadow: none; border-radius: 0; }
            .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>📊 Rapport: ${this.formatReportTitle(report.config.type)}</h1>
            <div class="header-meta">
                <span>📅 Généré le ${report.generatedAt.toLocaleDateString('fr-FR')} à ${report.generatedAt.toLocaleTimeString('fr-FR')}</span>
                <span>⏱️ Traitement: ${report.metadata.processingTimeMs}ms</span>
                <span>📊 Enregistrements: ${report.metadata.recordCount}</span>
            </div>
        </div>

        <!-- Summary Metrics -->
        <div class="summary-section">
            <div class="summary-grid">
                ${Object.entries(report.data.summary).slice(0, 8).map(([key, value]) => `
                <div class="metric-card">
                    <div class="metric-label">${this.formatMetricLabel(key)}</div>
                    <div class="metric-value">${value}</div>
                </div>
                `).join('')}
            </div>
        </div>

        <!-- Data Table -->
        <div class="table-section">
            <h2 class="section-title">📋 Données Détaillées</h2>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${rows.slice(0, 100).map(row => `
                        <tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${rows.length > 100 ? `<p style="margin-top: 15px; color: var(--text-muted); font-size: 13px;">Affichage des 100 premières lignes sur ${rows.length} au total</p>` : ''}
        </div>

        <!-- Insights -->
        ${report.data.insights.length > 0 ? `
        <div class="insights-section">
            <h2 class="section-title">💡 Insights & Recommandations</h2>
            ${report.data.insights.map(insight => `
            <div class="insight-card">
                <span class="insight-icon">💡</span>
                <span class="insight-text">${insight}</span>
            </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
            <p>Généré par <strong>AlgeriaTrade.dz</strong> - Plateforme B2B Algérie</p>
            <p>Ce rapport expire le ${report.expiresAt.toLocaleDateString('fr-FR')} | ID: ${report.id.substring(0, 8)}...</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate PDF-compatible HTML (optimized for printing/PDF conversion)
   */
  private generatePDFCompatibleHTML(report: ReportResult): string {
    // Similar to HTML but with print-specific optimizations
    return this.generateHTMLReport(report);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Escape CSV field value
   */
  private escapeCSVField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  /**
   * Escape XML special characters
   */
  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Format report type to French title
   */
  private formatReportTitle(type: string): string {
    const titles: Record<string, string> = {
      sales_overview: 'Vue d\'ensemble des Ventes',
      product_performance: 'Performance des Produits',
      supplier_analytics: 'Analyse des Fournisseurs',
      buyer_behavior: 'Comportement des Acheteurs',
      rfq_analysis: 'Analyse des Appels d\'Offres',
      revenue_by_category: 'Revenus par Catégorie',
      geographic_distribution: 'Distribution Géographique',
      payment_methods: 'Méthodes de Paiement',
      user_growth: 'Croissance des Utilisateurs',
      inventory_status: 'État des Stocks',
      custom: 'Rapport Personnalisé',
    };
    return titles[type] || type;
  }

  /**
   * Format metric key to French label
   */
  private formatMetricLabel(key: string): string {
    const labels: Record<string, string> = {
      totalRevenue: 'Chiffre d\'Affaires',
      totalOrders: 'Total Commandes',
      averageOrderValue: 'Panier Moyen',
      completionRate: 'Taux de Complétion',
      completedOrders: 'Commandes Terminées',
      pendingOrders: 'Commandes en Attente',
      totalProduits: 'Total Produits',
      vuesTotales: 'Vues Totales',
      revenuTotal: 'Revenu Total',
      totalFournisseurs: 'Total Fournisseurs',
      totalAcheteurs: 'Total Acheteurs',
      nouveauxInscrits: 'Nouveaux Inscrits',
      verificationRate: 'Taux de Vérification',
      utilisateursActifs: 'Utilisateurs Actifs',
      enRupture: 'En Rupture',
      stockFaible: 'Stock Faible',
      valeurTotaleStock: 'Valeur du Stock',
      regionsActives: 'Régions Actives',
      methodesUtilisees: 'Méthodes Utilisées',
      categoriesAnalysées: 'Catégories Analysées',
    };
    return labels[key] || key.replace(/([A-Z])/g, ' $1').trim();
  }
}

// Export singleton instance
export const reportExporter = new ReportExporter();
