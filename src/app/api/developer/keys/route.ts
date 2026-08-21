import { NextRequest, NextResponse } from 'next/server';
import { generateApiKey, hashApiKey } from '@/lib/api-gateway/gateway';

// Mock storage for demo (use database in production)
const apiKeysStore = new Map();

// GET /api/developer/keys - List API keys for authenticated user
export async function GET(request: NextRequest) {
  try {
    // In production, get user ID from session/auth token
    const userId = request.headers.get('x-user-id') || 'demo_user';
    
    // Mock data - in production, query database
    const mockKeys = [
      {
        id: 'key_1',
        name: 'Production Key',
        keyPrefix: 'at_a1b2c3d4...',
        permissions: ['products:read', 'products:write', 'orders:read'],
        rateLimit: 1000,
        isActive: true,
        lastUsedAt: new Date().toISOString(),
        createdAt: new Date('2024-01-15').toISOString(),
        usageCount: 15420,
      },
      {
        id: 'key_2',
        name: 'Testing Key',
        keyPrefix: 'at_e5f6g7h8...',
        permissions: ['products:read', 'search'],
        rateLimit: 100,
        isActive: true,
        createdAt: new Date('2024-03-20').toISOString(),
        usageCount: 856,
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockKeys,
      meta: {
        queriedAt: new Date().toISOString(),
        apiVersion: 'v2',
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch API keys', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/developer/keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, permissions = ['products:read'], rateLimit = 100, allowedIps, expiresAt } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Generate new API key
    const { plainTextKey, hash, prefix } = generateApiKey();
    
    // Mock creation - in production, save to database
    const newKey = {
      id: `key_${Date.now()}`,
      name,
      keyPrefix: prefix,
      permissions,
      rateLimit,
      allowedIps: allowedIps || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || null,
      usageCount: 0,
    };

    // Store the hashed key (in production, use Prisma)
    apiKeysStore.set(newKey.id, { hash, ...newKey });

    return NextResponse.json({
      success: true,
      data: {
        ...newKey,
        // Only return plain text key once!
        plainTextKey,
      },
      meta: {
        queriedAt: new Date().toISOString(),
        apiVersion: 'v2',
        message: 'Save this key securely - it will not be shown again!'
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create API key', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// PUT /api/developer/keys/:id - Update API key settings
// DELETE /api/developer/keys/:id - Revoke/delete API key
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyId, updates } = body;

    if (!keyId) {
      return NextResponse.json(
        { success: false, error: 'keyId is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Mock update - in production, update database
    return NextResponse.json({
      success: true,
      data: { id: keyId, ...updates, updatedAt: new Date().toISOString() },
      meta: { queriedAt: new Date().toISOString(), apiVersion: 'v2' }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update API key', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
