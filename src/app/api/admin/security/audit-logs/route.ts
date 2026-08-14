/**
 * GET /api/admin/security/audit-logs
 * View audit logs with filtering and pagination (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditLogger, ACTION_LABELS } from '@/lib/security/auditLog';

// GET: Retrieve audit logs with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 per page
    const userId = searchParams.get('userId') || undefined;
    const action = searchParams.get('action') || undefined;
    const resource = searchParams.get('resource') || undefined;
    const successParam = searchParams.get('success');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const search = searchParams.get('search') || undefined;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (userId) where.userId = userId;
    if (action) where.action = { contains: action };
    if (resource) where.resource = resource;
    
    if (successParam !== null) {
      where.success = successParam === 'true';
    }

    if (startDateStr || endDateStr) {
      where.createdAt = {};
      if (startDateStr) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDateStr);
      }
      if (endDateStr) {
        (where.createdAt as Record<string, unknown>).lte = new Date(endDateStr);
      }
    }

    if (search) {
      where.OR = [
        { action: { contains: search } },
        { resource: { contains: search } },
        { resourceId: { contains: search } },
        { errorMessage: { contains: search } },
      ];
    }

    // Execute queries in parallel
    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);

    // Format response with action labels
    const formattedLogs = logs.map(log => ({
      id: log.id,
      userId: log.userId,
      userRole: log.userRole,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent ? log.userAgent.substring(0, 100) : null, // Truncate for display
      action: log.action,
      actionLabel: ACTION_LABELS[log.action] || log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      oldValue: log.oldValue,
      newValue: log.newValue,
      metadata: log.metadata,
      success: log.success,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST: Export audit logs to CSV/PDF (placeholder)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format = 'csv', filters = {} } = body;

    // Get filtered logs (same logic as GET)
    const where: Record<string, unknown> = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = { contains: filters.action };
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) (where.createdAt as Record<string, unknown>).gte = new Date(filters.startDate);
      if (filters.endDate) (where.createdAt as Record<string, unknown>).lte = new Date(filters.endDate);
    }

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000, // Limit export size
    });

    if (format === 'csv') {
      // Generate CSV content
      const headers = [
        'Date',
        'Utilisateur ID',
        'Rôle',
        'Action',
        'Ressource',
        'Ressource ID',
        'Adresse IP',
        'Succès',
        'Message d\'erreur',
      ];

      const rows = logs.map(log => [
        new Date(log.createdAt).toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' }),
        log.userId || '',
        log.userRole || '',
        ACTION_LABELS[log.action] || log.action,
        log.resource || '',
        log.resourceId || '',
        log.ipAddress || '',
        log.success ? 'Oui' : 'Non',
        log.errorMessage || '',
      ]);

      const csvContent = [headers.join(','), ...rows.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // For other formats, return JSON
    return NextResponse.json({
      success: true,
      message: `Export ${format.toUpperCase()} non encore implémenté`,
      count: logs.length,
    });

  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export', code: 'EXPORT_ERROR' },
      { status: 500 }
    );
  }
}
