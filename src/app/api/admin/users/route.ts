import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-utils';
import { UserRole, Prisma } from '@prisma/client';
import { db } from '@/lib/db';

// GET /api/admin/users - List users with filters
export async function GET(request: NextRequest) {
  try {
    // Verify admin role
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR]);

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const role = searchParams.get('role') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const search = searchParams.get('search') || '';
    const wilaya = searchParams.get('wilaya') || 'ALL';

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (role !== 'ALL') {
      where.role = role as UserRole;
    }

    if (status === 'ACTIVE') {
      where.isActive = true;
    } else if (status === 'SUSPENDED') {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (wilaya !== 'ALL' && wilaya) {
      where.company = {
        wilaya: wilaya,
      };
    }

    // Fetch users with pagination
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          company: {
            select: {
              name: true,
              wilaya: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    // Transform data for response
    const transformedUsers = users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.isActive ? 'ACTIVE' : 'SUSPENDED',
      avatar: user.avatar,
      companyName: user.company?.name,
      wilaya: user.company?.wilaya,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.updatedAt.toISOString(), // In real app, track actual login time
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: transformedUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    
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

// POST /api/admin/users - Create user (admin action)
export async function POST(request: NextRequest) {
  try {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

    const body = await request.json();
    const { email, firstName, lastName, password, role, phone } = body;

    // Validate required fields
    if (!email || !firstName || !lastName || !password) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Un utilisateur avec cet email existe déjà' },
        { status: 409 }
      );
    }

    // Hash password (in production use bcrypt)
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await db.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: role || 'BUYER',
        phone: phone || null,
      },
    });

    // Log audit action
    console.log(`Admin created user: ${newUser.id} (${email})`);

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    );
  }
}
