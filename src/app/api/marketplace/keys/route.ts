// API Marketplace Routes - Developer Portal Backend
// Gestion des clés API, quotas et utilisation

import { NextRequest, NextResponse } from 'next/server';
import { apiKeyManager } from '@/lib/api-marketplace/keyManager';

/**
 * GET /api/marketplace/keys - List user's API keys
 */
export async function GET(request: NextRequest) {
  try {
    // In production, authenticate user from session/token
    const userId = request.headers.get('x-user-id') || 'demo-user';
    
    const keys = await apiKeyManager.getUserKeys(userId);
    
    return NextResponse.json({
      success: true,
      keys: keys.map(key => ({
        id: key.id,
        name: key.name,
        keyPreview: key.key.substring(0, 8) + '...' + key.key.substring(key.key.length - 4),
        permissions: key.permissions,
        plan: key.plan,
        status: key.status,
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt,
        usageCount: key.usageCount,
        expiresAt: key.expiresAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace/keys - Create new API key
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, permissions, plan } = body;
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // In production, authenticate user from session/token
    const userId = request.headers.get('x-user-id') || 'demo-user';
    
    const newKey = await apiKeyManager.createKey({
      userId,
      name,
      permissions: permissions || ['products:read', 'search:read'],
      plan: plan || 'free',
      expiresIn: plan === 'enterprise' ? 365 * 24 * 60 * 60 : 30 * 24 * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      key: {
        id: newKey.id,
        name: newKey.name,
        key: newKey.key, // Only show full key once!
        permissions: newKey.permissions,
        plan: newKey.plan,
        expiresAt: newKey.expiresAt,
        message: 'Save this key securely. It will not be shown again.',
      },
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
