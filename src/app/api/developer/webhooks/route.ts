import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Mock webhook storage
const webhooksStore = new Map();

// Available event types
const VALID_EVENTS = [
  'order.created',
  'order.updated',
  'order.shipped',
  'order.delivered',
  'order.cancelled',
  'rfq.created',
  'rfq.quotation_received',
  'rfq.expired',
  'product.created',
  'product.updated',
  'product.deleted',
  'message.received',
  'company.verified',
];

// GET /api/developer/webhooks - List webhook subscriptions
export async function GET(request: NextRequest) {
  try {
    // Mock data
    const mockWebhooks = [
      {
        id: 'wh_1',
        url: 'https://myapp.com/webhooks/algeriatrade',
        events: ['order.created', 'order.updated', 'order.shipped'],
        secret: 'whsec_a1b2c3d4e5f6g7h8i9j0',
        isActive: true,
        lastTriggeredAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        successCount: 1245,
        failureCount: 12,
        createdAt: new Date('2024-02-15').toISOString(),
        retryPolicy: { maxRetries: 3, retryDelay: 60, backoffMultiplier: 2 },
      },
      {
        id: 'wh_2',
        url: 'https://erp.example.com/api/events',
        events: ['rfq.created', 'rfq.quotation_received', 'product.created'],
        secret: 'whsec_z9y8x7w6v5u4t3s2r1q0',
        isActive: true,
        lastTriggeredAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        successCount: 892,
        failureCount: 3,
        createdAt: new Date('2024-03-01').toISOString(),
        retryPolicy: { maxRetries: 5, retryDelay: 30, backoffMultiplier: 1.5 },
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockWebhooks,
      meta: {
        queriedAt: new Date().toISOString(),
        apiVersion: 'v2',
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch webhooks', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/developer/webhooks - Create new webhook subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, events = [], secret, retryPolicy = {} } = body;

    // Validate required fields
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
      if (!url.startsWith('https://')) {
        return NextResponse.json(
          { success: false, error: 'URL must use HTTPS', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate events
    const invalidEvents = events.filter((e: string) => !VALID_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid events: ${invalidEvents.join(', ')}`, 
          code: 'VALIDATION_ERROR',
          validEvents: VALID_EVENTS 
        },
        { status: 400 }
      );
    }

    if (events.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one event is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Generate secret if not provided
    const webhookSecret = secret || `whsec_${randomBytes(20).toString('hex')}`;

    // Create webhook
    const newWebhook = {
      id: `wh_${Date.now()}`,
      url,
      events,
      secret: webhookSecret,
      isActive: true,
      createdAt: new Date().toISOString(),
      successCount: 0,
      failureCount: 0,
      retryPolicy: {
        maxRetries: retryPolicy.maxRetries || 3,
        retryDelay: retryPolicy.retryDelay || 60,
        backoffMultiplier: retryPolicy.backoffMultiplier || 2,
      },
    };

    // Store in memory (use database in production)
    webhooksStore.set(newWebhook.id, newWebhook);

    return NextResponse.json({
      success: true,
      data: newWebhook,
      meta: {
        queriedAt: new Date().toISOString(),
        apiVersion: 'v2',
        message: 'Webhook created successfully. Save your signing secret securely.',
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create webhook', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// DELETE /api/developer/webhooks/:id - Delete webhook subscription
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get('id');

    if (!webhookId) {
      return NextResponse.json(
        { success: false, error: 'Webhook ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Mock deletion - in production, delete from database
    const existed = webhooksStore.delete(webhookId);

    if (!existed) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: webhookId, deleted: true },
      meta: { queriedAt: new Date().toISOString(), apiVersion: 'v2' }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete webhook', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// PATCH /api/developer/webhooks/:id - Update webhook (toggle active, update events, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookId, updates } = body;

    if (!webhookId) {
      return NextResponse.json(
        { success: false, error: 'Webhook ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Mock update
    return NextResponse.json({
      success: true,
      data: { id: webhookId, ...updates, updatedAt: new Date().toISOString() },
      meta: { queriedAt: new Date().toISOString(), apiVersion: 'v2' }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update webhook', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
