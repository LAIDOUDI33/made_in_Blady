// ============================================
// Advanced Reporting System - Report Generation API
// POST /api/admin/reports/generate
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { reportGenerator } from '@/lib/reports/generator';
import { reportExporter } from '@/lib/reports/export';
import { auth } from '@/lib/auth-utils';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * POST handler for report generation
 * Generates a report based on configuration and returns download URL
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize user
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié. Veuillez vous connecter.' },
        { status: 401 }
      );
    }

    // Check admin role
    const userRole = session.user.role;
    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Accès refusé. Privilèges administratifs requis.' },
        { status: 403 }
      );
    }

    // Parse request body
    let config;
    try {
      config = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'JSON invalide dans le corps de la requête' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!config.type) {
      return NextResponse.json(
        { error: 'Le type de rapport est requis (type)' },
        { status: 400 }
      );
    }

    // Set defaults
    const format = config.format || 'pdf';
    const validFormats = ['pdf', 'csv', 'excel', 'json', 'html'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Format non supporté. Formats disponibles: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate the report
    console.log(`[Reports] Generating ${config.type} report for user ${session.user.id}`);
    const report = await reportGenerator.generateReport(config, session.user.id);

    // Check generation result
    if (report.status === 'failed') {
      console.error(`[Reports] Failed to generate report:`, report.data.insights);
      return NextResponse.json(
        { 
          error: 'Échec de la génération du rapport',
          details: report.data.insights,
        },
        { status: 500 }
      );
    }

    // Export to requested format
    let buffer: Buffer;
    try {
      buffer = await reportExporter.export(report, format);
    } catch (exportError) {
      console.error('[Reports] Export error:', exportError);
      return NextResponse.json(
        { error: `Échec de l'export au format ${format}` },
        { status: 500 }
      );
    }

    // Create downloads directory if it doesn't exist
    const downloadsDir = join(process.cwd(), 'public', 'downloads', 'reports');
    await mkdir(downloadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `report-${config.type}-${timestamp}.${format === 'excel' ? 'xlsx' : format}`;
    const filepath = join(downloadsDir, filename);

    // Write file to disk
    await writeFile(filepath, buffer);

    // Log successful generation
    console.log(`[Reports] Report generated successfully: ${filename}`);
    console.log(`[Reports] Records: ${report.metadata.recordCount}, Time: ${report.metadata.processingTimeMs}ms`);

    // Return success response with download URL
    return NextResponse.json({
      success: true,
      data: {
        reportId: report.id,
        downloadUrl: `/downloads/reports/${filename}`,
        format,
        filename,
        metadata: {
          recordCount: report.metadata.recordCount,
          processingTimeMs: report.metadata.processingTimeMs,
          fileSize: buffer.length,
        },
        expiresAt: report.expiresAt.toISOString(),
        summary: report.data.summary,
        insightsCount: report.data.insights.length,
      },
    });
  } catch (error) {
    console.error('[Reports] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur lors de la génération du rapport' },
      { status: 500 }
    );
  }
}

/**
 * GET handler - list recently generated reports (optional)
 */
export async function GET() {
  try {
    // In a full implementation, this would query a reports table in the database
    // For now, return empty array as we don't persist report history yet
    
    return NextResponse.json({
      success: true,
      data: {
        recentReports: [],
        message: 'L\'historique des rapports sera disponible prochainement',
      },
    });
  } catch (error) {
    console.error('[Reports] Error fetching history:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    );
  }
}
