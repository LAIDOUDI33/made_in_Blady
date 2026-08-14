// API Route: Send message to chatbot and get response
import { NextRequest, NextResponse } from 'next/server';
import { chatbotEngine } from '@/lib/ai/chatbot';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId: providedSessionId, userId } = body;

    // Validate required fields
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long. Maximum 2000 characters.' },
        { status: 400 }
      );
    }

    // Generate or use existing session ID
    const sessionId = providedSessionId || randomUUID();

    // Process the message
    const result = await chatbotEngine.processMessage(message.trim(), {
      sessionId,
      userId: userId || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        reply: result.reply.message,
        suggestions: result.reply.suggestions || [],
        cards: result.reply.cards || [],
        action: result.reply.action || null,
        intent: result.intent,
        confidence: Math.round(result.confidence * 100) / 100,
        entities: result.entities,
        typingDelay: result.typingDelay,
        sessionId,
      },
    });
  } catch (error) {
    console.error('Error processing chatbot message:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        reply: "Désolé, une erreur s'est produite. Veuillez réessayer ou contacter le support.",
        suggestions: ['Réessayer', 'Contacter le support'],
      },
      { status: 500 }
    );
  }
}
