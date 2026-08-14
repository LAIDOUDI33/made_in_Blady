import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-utils';
import { UserRole, VerificationStatus } from '@prisma/client';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ companyId: string }>;
}

// POST /api/admin/companies/[companyId]/verify - Verify or reject a company
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
    
    const { companyId } = await context.params;
    const body = await request.json();
    const { action, notes } = body; // 'verify' or 'reject'

    if (!['verify', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action invalide. Utilisez "verify" ou "reject"' },
        { status: 400 }
      );
    }

    // Check company exists
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true }
        }
      }
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Entreprise non trouvée' },
        { status: 404 }
      );
    }

    // Update company status
    const isVerified = action === 'verify';
    const newStatus: VerificationStatus = isVerified ? 'VERIFIED' : 'REJECTED';

    const updatedCompany = await db.company.update({
      where: { id: companyId },
      data: {
        verificationStatus: newStatus,
        isVerified,
        isActive: isVerified ? company.isActive : false, // Deactivate if rejected
      },
    });

    // Create notification for the user about verification result
    await db.notification.create({
      data: {
        userId: company.userId,
        type: isVerified ? 'NEW_REVIEW' : 'NEW_MESSAGE', // Using existing types
        title: isVerified 
          ? 'Votre entreprise a été vérifiée ✅' 
          : 'Votre entreprise a été rejetée ❌',
        message: isVerified 
          ? `Félicitations ! Votre entreprise "${company.name}" a été vérifiée avec succès. Vous pouvez maintenant publier des produits et recevoir des commandes.`
          : `Nous regrettons de vous informer que votre demande de vérification pour "${company.name}" a été rejetée.${notes ? ` Motif: ${notes}` : ''} Veuillez contacter le support pour plus d'informations.`,
        data: JSON.stringify({ companyId, action, notes }),
      }
    });

    // Log audit action
    console.log(`[AUDIT] Admin ${action === 'verify' ? 'verified' : 'rejected'} company ${company.name} (${companyId})${notes ? ` - Notes: ${notes}` : ''}`);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        verificationStatus: updatedCompany.verificationStatus,
        isVerified: updatedCompany.isVerified,
      },
      message: action === 'verify' 
        ? 'Entreprise vérifiée avec succès' 
        : 'Entreprise rejetée'
    });
  } catch (error) {
    console.error('Error verifying/rejecting company:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erreur lors du traitement de la demande' },
      { status: 500 }
    );
  }
}
