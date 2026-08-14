// API Route: Indicate user is typing (for future live chat handoff)
import { NextRequest, NextResponse } from 'next/server';
import { chatbotEngine } from '@/lib/ai/chatbot';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    await chatbotEngine.recordTypingIndicator(sessionId, userId || undefined);

    return NextResponse.json({
      success: true,
      message: 'Typing indicator recorded',
    });
  } catch (error) {
    console.error('Error recording typing indicator:', error);
    return NextResponse.json(
      { error: 'Failed to record typing indicator' },
      { status: 500 }
    );
  }
}
