// API Route: Get chat history for session
import { NextRequest, NextResponse } from 'next/server';
import { chatbotEngine } from '@/lib/ai/chatbot';

// GET: Get chat history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const { messages, sessionInfo } = await chatbotEngine.getChatHistory(sessionId);

    return NextResponse.json({
      success: true,
      data: {
        messages,
        sessionInfo,
        count: messages.length,
      },
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    return NextResponse.json(
      { error: 'Failed to get chat history' },
      { status: 500 }
    );
  }
}

// DELETE: Clear chat history
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const success = await chatbotEngine.clearChatHistory(sessionId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Chat history cleared successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to clear chat history' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return NextResponse.json(
      { error: 'Failed to clear chat history' },
      { status: 500 }
    );
  }
}
