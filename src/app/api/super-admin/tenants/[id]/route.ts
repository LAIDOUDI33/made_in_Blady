/**
 * Super Admin Single Tenant API
 * GET /api/super-admin/tenants/[id] - Get tenant details
 * PUT /api/super-admin/tenants/[id] - Update tenant
 * PATCH /api/super-admin/tenants/[id] - Partial update (e.g., toggle active)
 * DELETE /api/super-admin/tenants/[id] - Delete tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single tenant
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const tenant = await db.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            companies: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { message: 'Locataire non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la récupération du locataire' },
      { status: 500 }
    );
  }
}

// PUT update tenant (full update)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if tenant exists
    const existingTenant = await db.tenant.findUnique({
      where: { id },
    });

    if (!existingTenant) {
      return NextResponse.json(
        { message: 'Locataire non trouvé' },
        { status: 404 }
      );
    }

    // If slug is being changed, check uniqueness
    if (body.slug && body.slug !== existingTenant.slug) {
      const slugExists = await db.tenant.findUnique({
        where: { slug: body.slug },
      });
      
      if (slugExists) {
        return NextResponse.json(
          { message: 'Ce slug est déjà utilisé' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    
    // Basic info
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.domain !== undefined) updateData.domain = body.domain;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.planType !== undefined) updateData.planType = body.planType;

    // Branding
    if (body.primaryColor !== undefined) updateData.primaryColor = body.primaryColor;
    if (body.secondaryColor !== undefined) updateData.secondaryColor = body.secondaryColor;
    if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl;
    if (body.faviconUrl !== undefined) updateData.faviconUrl = body.faviconUrl;
    if (body.backgroundImage !== undefined) updateData.backgroundImage = body.backgroundImage;

    // Localization
    if (body.defaultLanguage !== undefined) updateData.defaultLanguage = body.defaultLanguage;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.currencySymbol !== undefined) updateData.currencySymbol = body.currencySymbol;
    if (body.locale !== undefined) updateData.locale = body.locale;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.countryName !== undefined) updateData.countryName = body.countryName;
    if (body.countryCode !== undefined) updateData.countryCode = body.countryCode;
    if (body.phonePrefix !== undefined) updateData.phonePrefix = body.phonePrefix;

    // Features
    if (body.features !== undefined) {
      updateData.features = JSON.stringify(body.features);
    }

    // Contact
    if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail;
    if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone;
    if (body.websiteUrl !== undefined) updateData.websiteUrl = body.websiteUrl;
    if (body.facebookUrl !== undefined) updateData.facebookUrl = body.facebookUrl;
    if (body.linkedinUrl !== undefined) updateData.linkedinUrl = body.linkedinUrl;
    if (body.twitterUrl !== undefined) updateData.twitterUrl = body.twitterUrl;
    if (body.footerText !== undefined) updateData.footerText = body.footerText;

    // Custom code
    if (body.customCSS !== undefined) updateData.customCSS = body.customCSS;
    if (body.customJS !== undefined) updateData.customJS = body.customJS;

    const updatedTenant = await db.tenant.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la mise à jour du locataire' },
      { status: 500 }
    );
  }
}

// PATCH partial update (for toggles, etc.)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingTenant = await db.tenant.findUnique({
      where: { id },
    });

    if (!existingTenant) {
      return NextResponse.json(
        { message: 'Locataire non trouvé' },
        { status: 404 }
      );
    }

    // Only allow specific fields to be updated via PATCH
    const allowedFields = ['isActive', 'isPublic', 'planType'];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'Aucun champ valide à mettre à jour' },
        { status: 400 }
      );
    }

    const updatedTenant = await db.tenant.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error('Error patching tenant:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la mise à jour du locataire' },
      { status: 500 }
    );
  }
}

// DELETE tenant
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existingTenant = await db.tenant.findUnique({
      where: { id },
    });

    if (!existingTenant) {
      return NextResponse.json(
        { message: 'Locataire non trouvé' },
        { status: 404 }
      );
    }

    // In production, you might want to soft-delete or archive data first
    // For now, we'll delete the tenant and all related data
    
    // Note: This will fail if there are foreign key constraints without cascade delete
    // You may need to delete related records first or use a soft-delete approach
    
    await db.tenant.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: 'Locataire supprimé avec succès',
      deletedId: id 
    });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    
    // Check for foreign key constraint errors
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      return NextResponse.json(
        { 
          message: 'Impossible de supprimer ce locataire car il contient des données associées. Veuillez d\'abord désactiver le locataire.' 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Erreur lors de la suppression du locataire' },
      { status: 500 }
    );
  }
}
