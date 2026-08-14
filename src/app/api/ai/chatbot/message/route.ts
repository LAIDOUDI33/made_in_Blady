// API Route: Envoyer un message au chatbot et obtenir une réponse
// API Route: Send message to chatbot and get response
// Supporte le streaming et les providers AI multiples
// Supports streaming and multiple AI providers

import { NextRequest, NextResponse } from 'next/server';
import { chatbotEngine } from '@/lib/ai/chatbot';
import { getAIProvider, getProviderInfo } from '@/lib/ai/providers/factory';
import { randomUUID } from 'crypto';

/**
 * POST /api/ai/chatbot/message
 * 
 * Corps de la requête / Request body:
 * - message: string (requis)
 * - sessionId?: string
 * - userId?: string
 * - stream?: boolean (pour le streaming SSE / for SSE streaming)
 * - context?: object (informations utilisateur additionnelles)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      message, 
      sessionId: providedSessionId, 
      userId, 
      stream = false,
      context,
    } = body;

    // Valider les champs requis / Validate required fields
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message requis et doit être une chaîne non vide' },
        { status: 400 }
      );
    }

    // Valider la longueur du message / Validate message length
    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message trop long. Maximum 2000 caractères.' },
        { status: 400 }
      );
    }

    // Générer ou utiliser l'ID de session existant / Generate or use existing session ID
    const sessionId = providedSessionId || randomUUID();

    // Vérifier si le streaming est demandé / Check if streaming is requested
    if (stream) {
      return handleStreamingRequest(message, sessionId, userId, context);
    }

    // Requête standard (non-streaming) / Standard request (non-streaming)
    return await handleStandardRequest(message, sessionId, userId, context);

  } catch (error) {
    console.error('Erreur lors du traitement du message chatbot:', error);
    
    return NextResponse.json(
      { 
        error: "Échec du traitement du message",
        reply: "Désolé, une erreur s'est produite. Veuillez réessayer ou contacter le support.",
        suggestions: ['Réessayer', 'Contacter le support'],
      },
      { status: 500 }
    );
  }
}

/**
 * Gérer une requête standard (non-streaming)
 * Handle standard request (non-streaming)
 */
async function handleStandardRequest(
  message: string,
  sessionId: string,
  userId?: string,
  context?: Record<string, unknown>
): Promise<NextResponse> {
  // Traiter le message avec le moteur de chatbot / Process message with chatbot engine
  const result = await chatbotEngine.processMessage(message.trim(), {
    sessionId,
    userId: userId || undefined,
    userInfo: context ? {
      role: context.role as string | undefined,
      location: context.location as string | undefined,
      company: context.company as string | undefined,
    } : undefined,
  });

  // Obtenir les informations du provider pour la réponse / Get provider info for response
  const providerInfo = getProviderInfo();

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
      // Informations sur le provider IA utilisé / Info about AI provider used
      aiProvider: {
        name: providerInfo.name,
        isCloudProvider: providerInfo.isConfigured,
      },
    },
  });
}

/**
 * Gérer une requête de streaming (SSE)
 * Handle streaming request (Server-Sent Events)
 */
function handleStreamingRequest(
  message: string,
  sessionId: string,
  userId?: string,
  _context?: Record<string, unknown>
): NextResponse {
  const aiProvider = getAIProvider();

  // Si le provider est local, retourner une erreur pour le streaming
  // If provider is local, return error for streaming
  if (aiProvider.name === 'local') {
    return NextResponse.json(
      { 
        error: 'Streaming non disponible en mode local. Utilisez stream=false ou configurez un provider cloud.',
        suggestion: 'Set AI_PROVIDER=openai or AI_PROVIDER=anthropic in environment',
      },
      { status: 400 }
    );
  }

  // Créer un flux SSE / Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Envoyer les métadonnées d'abord / Send metadata first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'meta',
          sessionId,
          provider: aiProvider.name,
          timestamp: new Date().toISOString(),
        })}\n\n`));

        // Streamer la réponse de l'IA / Stream AI response
        let fullContent = '';
        
        for await (const chunk of aiProvider.chatStream({
          messages: [{ role: 'user', content: message.trim() }],
        })) {
          if (chunk.type === 'error') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: chunk.error,
            })}\n\n`));
            break;
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));

          if (chunk.type === 'content' && chunk.content) {
            fullContent += chunk.content;
          }
        }

        // Signal de fin / End signal
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        consoleErreur('[Streaming] Erreur:', error);
        const errorMsg = error instanceof Error ? error.message : 'Erreur de streaming inconnue';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          error: errorMsg,
        })}\n\n`));
        controller.close();
      }
    },
  });

  // Retourner la réponse SSE / Return SSE response
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Désactiver le buffering nginx / Disable nginx buffering
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * GET /api/ai/chatbot/message
 * Retourne des informations sur le provider AI actuel
 * Returns info about current AI provider
 */
export async function GET() {
  try {
    const providerInfo = getProviderInfo();
    
    return NextResponse.json({
      success: true,
      data: {
        provider: providerInfo.name,
        isConfigured: providerInfo.isConfigured,
        hasApiKey: providerInfo.hasApiKey,
        streamingSupported: providerInfo.name !== 'local',
        availableProviders: ['local', 'openai', 'anthropic'],
        endpoints: {
          chat: '/api/ai/chatbot/message',
          chatStream: '/api/ai/chatbot/message?stream=true',
          history: '/api/ai/chatbot/history',
          feedback: '/api/ai/chatbot/feedback',
        },
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des infos provider:', error);
    return NextResponse.json(
      { error: 'Failed to get provider info' },
      { status: 500 }
    );
  }
}

// Helper pour logger dans le streaming context / Helper for logging in streaming context
function consoleErreur(...args: unknown[]): void {
  console.error(...args);
}
