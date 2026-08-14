// API Route: Record feedback on recommendation (clicked/dismissed/converted)
import { NextRequest, NextResponse } from 'next/server';
import { recommendationEngine } from '@/lib/ai/recommendations';

export async function POST(
  request: NextResponse,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, userId } = body;
    const recommendationId = params.id;

    if (!recommendationId) {
      return NextResponse.json(
        { error: 'Recommendation ID is required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required (clicked/dismissed/converted/viewed)' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ['clicked', 'dismissed', 'converted', 'viewed'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    await recommendationEngine.recordFeedback(
      recommendationId,
      action,
      userId || undefined
    );

    return NextResponse.json({
      success: true,
      message: `Feedback recorded: ${action}`,
    });
  } catch (error) {
    console.error('Error recording feedback:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}
