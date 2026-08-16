/**
 * API Route: /api/companies/map
 * 
 * Returns all companies with GPS coordinates for map display
 * Supports pagination and filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const wilaya = searchParams.get('wilaya') || '';
    const verificationStatus = searchParams.get('verificationStatus') || '';
    const exportCapable = searchParams.get('exportCapable') || '';
    const search = searchParams.get('search') || '';
    
    // Build where clause
    const where: any = {
      AND: [
        // Must have GPS coordinates
        {
          latitude: { not: null }
        },
        {
          longitude: { not: null }
        },
        // Active companies only
        {
          isActive: true
        }
      ]
    };
    
    // Optional filters
    if (wilaya && wilaya !== 'all') {
      where.AND.push({ wilaya });
    }
    
    if (verificationStatus && verificationStatus !== 'all') {
      where.AND.push({ verificationStatus });
    }
    
    if (exportCapable === 'yes') {
      where.AND.push({ exportCapability: true });
    } else if (exportCapable === 'no') {
      where.AND.push({ exportCapability: false });
    }
    
    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { wilaya: { contains: search, mode: 'insensitive' } },
          { commune: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      });
    }
    
    // Fetch companies with pagination
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          wilaya: true,
          commune: true,
          latitude: true,
          longitude: true,
          employeeCount: true,
          verificationStatus: true,
          exportCapability: true,
          rating: true,
          website: true,
          description: true
        },
        orderBy: [
          { employeeCount: 'desc' },
          { rating: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.company.count({ where })
    ]);
    
    // Get statistics
    const stats = await Promise.all([
      prisma.company.count({
        where: { ...where, verificationStatus: 'VERIFIED' }
      }),
      prisma.company.count({
        where: { ...where, exportCapability: true }
      }),
      prisma.company.groupBy({
        by: ['wilaya'],
        where: {
          AND: [
            { latitude: { not: null } },
            { longitude: { not: null } },
            { isActive: true }
          ]
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      })
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        companies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        statistics: {
          total,
          verified: stats[0],
          exportReady: stats[1],
          topWilayas: stats[2]
        },
        bounds: {
          // Algeria approximate bounding box
          north: 37.03,
          south: 21.31,
          east: 9.51,
          west: -8.16,
          center: [28.0, 1.65]
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching map companies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch companies' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
