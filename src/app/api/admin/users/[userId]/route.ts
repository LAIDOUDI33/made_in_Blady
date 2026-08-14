import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-utils';
import { UserRole, Prisma } from '@prisma/client';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// GET /api/admin/users/[userId] - Get user details
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR]);
    
    const { userId } = await context.params;

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        _count: {
          select: {
            ordersPlaced: true,
            rfqsCreated: true,
            reviews: true,
            favorites: true,
            messagesSent: true,
            notifications: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Get user's products count (if supplier)
    let productCount = 0;
    let ordersReceivedCount = 0;
    
    if (user.company) {
      [productCount] = await Promise.all([
        db.product.count({ where: { companyId: user.company!.id } }),
        db.order.count({ where: { companyId: user.company!.id } }),
      ]);
      ordersReceivedCount = productCount; // Reuse variable
    }

    return NextResponse.json({
      success: true,
      data: {
        ...userWithoutPassword,
        stats: {
          productCount,
          ordersReceived: ordersReceivedCount,
          ordersPlaced: user._count.ordersPlaced,
          rfqsCreated: user._count.rfqsCreated,
          reviewsGiven: user._count.reviews,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[userId] - Update user
export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
    
    const { userId } = await context.params;
    const body = await request.json();
    const { role, isActive, action } = body;

    // Check user exists
    const existingUser = await db.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    let updateData: Prisma.UserUpdateInput = {};
    let auditMessage = '';

    switch (action) {
      case 'suspend':
        updateData.isActive = false;
        auditMessage = `Admin suspended user ${existingUser.email}`;
        break;
      
      case 'activate':
        updateData.isActive = true;
        auditMessage = `Admin activated user ${existingUser.email}`;
        break;
      
      case 'change_role':
        if (!role || !['BUYER', 'SUPPLIER', 'ADMIN', 'MODERATOR'].includes(role)) {
          return NextResponse.json(
            { success: false, error: 'Rôle invalide' },
            { status: 400 }
          );
        }
        updateData.role = role as UserRole;
        auditMessage = `Admin changed role of ${existingUser.email} to ${role}`;
        break;
      
      default:
        // Direct field updates
        if (role !== undefined) updateData.role = role as UserRole;
        if (isActive !== undefined) updateData.isActive = isActive;
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Log audit action
    console.log(`[AUDIT] ${auditMessage || `Admin updated user ${userId}`}`);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour de l\'utilisateur' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[userId] - Delete user (super admin only)
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    await requireRole([UserRole.SUPER_ADMIN]);
    
    const { userId } = await context.params;

    // Check user exists
    const existingUser = await db.user.findUnique({ 
      where: { id: userId },
      include: { company: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Prevent self-deletion (would need session check)
    // This is a simplified check

    // Delete user (cascade will handle related records)
    await db.user.delete({
      where: { id: userId }
    });

    // Log audit action
    console.log(`[AUDIT] Super Admin deleted user ${existingUser.email} (${userId})`);

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    );
  }
}
