import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-utils';
import { UserRole } from '@prisma/client';
import { db } from '@/lib/db';

// GET /api/admin/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Verify admin role
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all stats in parallel
    const [
      totalUsers,
      newUsersThisMonth,
      supplierCount,
      verifiedSuppliers,
      activeProducts,
      activeRfqs,
      ordersThisMonth,
      pendingCompanies,
      reportedProducts,
      ordersData
    ] = await Promise.all([
      // Total users
      db.user.count(),
      
      // New users this month
      db.user.count({
        where: {
          createdAt: { gte: startOfMonth }
        }
      }),
      
      // Total suppliers
      db.user.count({
        where: { role: 'SUPPLIER' }
      }),
      
      // Verified suppliers
      db.company.count({
        where: { isVerified: true, isActive: true }
      }),
      
      // Active products
      db.product.count({
        where: { status: 'active', isActive: true }
      }),
      
      // Active RFQs
      db.rfq.count({
        where: {
          status: { in: ['PUBLISHED', 'QUOTATIONS_RECEIVED', 'NEGOTIATION'] }
        }
      }),
      
      // Orders this month
      db.order.count({
        where: {
          createdAt: { gte: startOfMonth }
        }
      }),
      
      // Pending companies
      db.company.count({
        where: { verificationStatus: 'PENDING' }
      }),
      
      // Reported products
      db.product.count({
        where: { status: 'reported' }
      }),
      
      // Revenue this month
      db.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: startOfMonth },
          status: { notIn: ['CANCELLED'] }
        }
      })
    ]);

    // Monthly registrations for chart (last 12 months)
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const monthlyRegistrations = await db.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: twelveMonthsAgo }
      },
      _count: true,
    });

    // Role distribution
    const buyerCount = await db.user.count({ where: { role: 'BUYER' } });
    const adminCount = await db.user.count({ 
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } 
    });

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
          buyers: buyerCount - adminCount - (totalUsers - buyerCount),
          suppliers: supplierCount,
          admins: adminCount,
        },
        companies: {
          total: supplierCount,
          verified: verifiedSuppliers,
          pending: pendingCompanies,
        },
        products: {
          active: activeProducts,
          reported: reportedProducts,
        },
        rfqs: {
          active: activeRfqs,
        },
        orders: {
          thisMonth: ordersThisMonth,
          revenue: ordersData._sum.totalAmount || 0,
        },
        conversionRate: totalUsers > 0 ? ((ordersThisMonth / totalUsers) * 100).toFixed(1) : '0',
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: 'Accès refusé' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
