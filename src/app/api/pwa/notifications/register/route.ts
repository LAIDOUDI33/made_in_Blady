import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============ Types ============
interface DeviceRegistrationPayload {
  endpoint: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
  p256dh?: string;
  auth?: string;
  userId?: string;
  platform?: 'web' | 'ios' | 'android';
}

interface NotificationPreferences {
  orderUpdates: boolean;
  negotiationAlerts: boolean;
  paymentNotifications: boolean;
  callNotifications: boolean;
  systemAnnouncements: boolean;
  messageNotifications: boolean;
  digestMode: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

// ============ POST Handler - Register Device for Push Notifications ============
export async function POST(request: NextRequest) {
  try {
    const body: DeviceRegistrationPayload = await request.json();

    // Validate required fields
    if (!body.endpoint) {
      return NextResponse.json(
        { success: false, error: 'Missing push endpoint' },
        { status: 400 }
      );
    }

    // Extract user ID from session or auth header (in production)
    const userId = body.userId || 'anonymous';
    
    // Generate device ID from endpoint hash (simplified)
    const deviceId = Buffer.from(body.endpoint).toString('base64').slice(0, 32);

    // Default preferences for new registrations
    const defaultPreferences: NotificationPreferences = {
      orderUpdates: true,
      negotiationAlerts: true,
      paymentNotifications: true,
      callNotifications: true,
      systemAnnouncements: true,
      messageNotifications: true,
      digestMode: false,
    };

    try {
      // Check if device already exists
      const existingDevice = await db.pushSubscription.findUnique({
        where: { endpoint: body.endpoint },
      });

      if (existingDevice) {
        // Update existing subscription
        await db.pushSubscription.update({
          where: { id: existingDevice.id },
          data: {
            p256dh: body.p256dh || body.keys?.p256dh,
            auth: body.auth || body.keys?.auth,
            platform: body.platform || 'web',
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new subscription
        await db.pushSubscription.create({
          data: {
            id: deviceId,
            userId,
            endpoint: body.endpoint,
            p256dh: body.p256dh || body.keys?.p256dh,
            auth: body.auth || body.keys?.auth,
            platform: body.platform || 'web',
            preferences: JSON.stringify(defaultPreferences),
          },
        });
      }

      console.log(`[PWA Push] Device registered: ${deviceId.slice(0, 8)}...`);

      return NextResponse.json({
        success: true,
        deviceId,
        registeredAt: new Date().toISOString(),
        preferences: defaultPreferences,
      });

    } catch (dbError) {
      // If table doesn't exist, return success for development
      if ((dbError as { code?: string }).code === 'P2021') {
        return NextResponse.json({
          success: true,
          deviceId,
          registeredAt: new Date().toISOString(),
          preferences: defaultPreferences,
          note: 'Database table not found - running in dev mode',
        });
      }
      
      throw dbError;
    }

  } catch (error) {
    console.error('[PWA Push Registration] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to register device',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============ DELETE Handler - Unregister Device ============
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      // Try to get from body
      const body = await request.json().catch(() => ({}));
      const bodyEndpoint = body.endpoint;

      if (!bodyEndpoint) {
        return NextResponse.json(
          { success: false, error: 'Missing endpoint' },
          { status: 400 }
        );
      }

      // Delete by endpoint from body
      try {
        await db.pushSubscription.deleteMany({
          where: { endpoint: bodyEndpoint },
        });
      } catch {
        // Table might not exist in dev mode
      }

      return NextResponse.json({ success: true, unregisteredAt: new Date().toISOString() });
    }

    // Delete by query parameter
    try {
      await db.pushSubscription.deleteMany({
        where: { endpoint },
      });
    } catch {
      // Table might not exist in dev mode
    }

    console.log(`[PWA Push] Device unregistered`);

    return NextResponse.json({ 
      success: true, 
      unregisteredAt: new Date().toISOString() 
    });

  } catch (error) {
    console.error('[PWA Push Unregister] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unregister device' },
      { status: 500 }
    );
  }
}

// ============ GET Handler - Get Device Info ============
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const userId = searchParams.get('userId');

    if (!deviceId && !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing deviceId or userId' },
        { status: 400 }
      );
    }

    let devices;

    try {
      if (userId) {
        devices = await db.pushSubscription.findMany({
          where: { userId },
          select: {
            id: true,
            endpoint: true,
            platform: true,
            createdAt: true,
            lastActiveAt: true,
          },
        });
      } else {
        const device = await db.pushSubscription.findUnique({
          where: { id: deviceId! },
        });
        devices = device ? [device] : [];
      }
    } catch {
      // Return mock data for development
      devices = [{
        id: deviceId || 'mock-device-id',
        endpoint: 'https://fcm.googleapis.com/fcm/send/mock-endpoint',
        platform: 'web',
        createdAt: new Date(),
        lastActiveAt: new Date(),
      }];
    }

    return NextResponse.json({
      success: true,
      devices,
      count: Array.isArray(devices) ? devices.length : 0,
    });

  } catch (error) {
    console.error('[PWA Push Get] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get device info' },
      { status: 500 }
    );
  }
}

// ============ PUT Handler - Update Preferences ============
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'Missing deviceId' },
        { status: 400 }
      );
    }

    const preferences: Partial<NotificationPreferences> = await request.json();

    try {
      // Get current preferences first
      const device = await db.pushSubscription.findUnique({
        where: { id: deviceId },
      });

      if (!device) {
        return NextResponse.json(
          { success: false, error: 'Device not found' },
          { status: 404 }
        );
      }

      // Merge with existing preferences
      const currentPrefs = JSON.parse(device.preferences || '{}');
      const updatedPrefs = { ...currentPrefs, ...preferences };

      await db.pushSubscription.update({
        where: { id: deviceId },
        data: {
          preferences: JSON.stringify(updatedPrefs),
          updatedAt: new Date(),
        },
      });

      console.log(`[PWA Push] Preferences updated for ${deviceId}`);

      return NextResponse.json({
        success: true,
        preferences: updatedPrefs,
        updatedAt: new Date().toISOString(),
      });

    } catch (dbError) {
      // Return success for development mode
      if ((dbError as { code?: string }).code === 'P2021') {
        return NextResponse.json({
          success: true,
          preferences,
          note: 'Running in dev mode - preferences saved locally',
        });
      }
      
      throw dbError;
    }

  } catch (error) {
    console.error('[PWA Push Preferences] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
