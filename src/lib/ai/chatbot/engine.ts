// AI Chatbot Engine - Main orchestrator
import { db } from '@/lib/db';
import { detectIntent, extractEntities, INTENTS, FALLBACK_INTENT } from './intents';
import { getResponse, getTypingDelay, BotResponse } from './responses';

export interface ChatContext {
  sessionId: string;
  userId?: string;
  conversationHistory?: ChatMessageSummary[];
  userInfo?: {
    role?: string;
    location?: string;
    company?: string;
  };
}

export interface ChatMessageSummary {
  role: 'user' | 'bot';
  content: string;
  intent?: string;
  timestamp: Date;
}

export interface ProcessedMessage {
  reply: BotResponse;
  intent: string;
  confidence: number;
  entities: Record<string, string>;
  typingDelay: number;
}

class ChatbotEngine {
  private maxHistoryLength = 20; // Keep last 20 messages for context

  /**
   * Process user message and generate response
   */
  async processMessage(
    message: string,
    context: ChatContext
  ): Promise<ProcessedMessage> {
    const startTime = Date.now();

    // 1. Detect intent
    const { intent, confidence } = detectIntent(message);

    // 2. Extract entities
    const entities = extractEntities(message);

    // 3. Get response based on intent
    const reply = getResponse(intent, entities);

    // 4. Calculate typing delay
    const typingDelay = getTypingDelay(reply.message);

    // 5. Save conversation to database
    await this.saveConversation(context, message, reply, intent.id, confidence);

    return {
      reply,
      intent: intent.id,
      confidence,
      entities,
      typingDelay,
    };
  }

  /**
   * Save conversation to database
   */
  private async saveConversation(
    context: ChatContext,
    userMessage: string,
    botReply: BotResponse,
    intentId: string,
    confidence: number
  ): Promise<void> {
    try {
      // Find or create session
      let session = await db.chatSession.findUnique({
        where: { sessionId: context.sessionId },
      });

      if (!session) {
        session = await db.chatSession.create({
          data: {
            sessionId: context.sessionId,
            userId: context.userId || null,
            startedAt: new Date(),
            lastActiveAt: new Date(),
            messageCount: 0,
          },
        });
      }

      // Update session activity
      await db.chatSession.update({
        where: { id: session.id },
        data: {
          lastActiveAt: new Date(),
          messageCount: { increment: 2 },
          ...(context.userId && !session.userId ? { userId: context.userId } : {}),
        },
      });

      // Save user message
      await db.chatMessage.create({
        data: {
          sessionId: session.id,
          content: userMessage,
          role: 'user',
        },
      });

      // Save bot response
      await db.chatMessage.create({
        data: {
          sessionId: session.id,
          content: botReply.message,
          role: 'bot',
          intent: intentId,
          confidence,
          suggestions: botReply.suggestions ? JSON.stringify(botReply.suggestions) : null,
          cards: botReply.cards ? JSON.stringify(botReply.cards) : null,
        },
      });

      // Track interaction for recommendations
      if (context.userId) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/ai/interactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'search',
              searchTerm: `chatbot: ${intentId}`,
              userId: context.userId,
              metadata: { intent: intentId, confidence, entities },
            }),
          }).catch(() => {}); // Non-critical
        } catch {}
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }

  /**
   * Get chat history for a session
   */
  async getChatHistory(sessionId: string): Promise<{
    messages: Array<{
      id: string;
      role: 'user' | 'bot' | 'system';
      content: string;
      intent?: string;
      suggestions?: string[];
      cards?: any[];
      feedback?: string;
      createdAt: Date;
    }>;
    sessionInfo: {
      startedAt: Date;
      messageCount: number;
      isResolved: boolean;
    } | null;
  }> {
    try {
      const session = await db.chatSession.findUnique({
        where: { sessionId },
      });

      if (!session) {
        return { messages: [], sessionInfo: null };
      }

      const messages = await db.chatMessage.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'asc' },
        take: this.maxHistoryLength * 2,
      });

      return {
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'bot' | 'system',
          content: msg.content,
          intent: msg.intent || undefined,
          suggestions: msg.suggestions ? JSON.parse(msg.suggestions) : undefined,
          cards: msg.cards ? JSON.parse(msg.cards) : undefined,
          feedback: msg.feedback || undefined,
          createdAt: msg.createdAt,
        })),
        sessionInfo: {
          startedAt: session.startedAt,
          messageCount: session.messageCount,
          isResolved: session.isResolved,
        },
      };
    } catch (error) {
      console.error('Error getting chat history:', error);
      return { messages: [], sessionInfo: null };
    }
  }

  /**
   * Clear chat history for a session
   */
  async clearChatHistory(sessionId: string): Promise<boolean> {
    try {
      const session = await db.chatSession.findUnique({
        where: { sessionId },
      });

      if (session) {
        await db.chatMessage.deleteMany({
          where: { sessionId: session.id },
        });

        await db.chatSession.update({
          where: { id: session.id },
          data: {
            messageCount: 0,
            isResolved: false,
            context: null,
          },
        });
      }

      return true;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      return false;
    }
  }

  /**
   * Record feedback on a bot response
   */
  async recordFeedback(
    messageId: string,
    sessionId: string,
    rating: 'positive' | 'negative' | 'neutral',
    comment?: string,
    category?: string,
    userId?: string
  ): Promise<void> {
    try {
      // Update message with feedback
      await db.chatMessage.update({
        where: { id: messageId },
        data: {
          feedback: rating,
          feedbackAt: new Date(),
        },
      });

      // Create separate feedback record
      await db.chatFeedback.create({
        data: {
          messageId,
          sessionId,
          userId: userId || null,
          rating,
          comment: comment || null,
          category: category || null,
        },
      });
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  }

  /**
   * Record that user is typing (for future live chat handoff)
   */
  async recordTypingIndicator(
    sessionId: string,
    userId?: string
  ): Promise<void> {
    try {
      await db.chatSession.update({
        where: { sessionId },
        data: { lastActiveAt: new Date() },
      });
    } catch (error) {
      // Session might not exist yet
    }
  }

  /**
   * Get available intents (for admin/debug)
   */
  getIntents(): typeof INTENTS {
    return INTENTS;
  }

  /**
   * Get chat statistics (for admin dashboard)
   */
  async getStats(): Promise<{
    totalSessions: number;
    activeSessionsToday: number;
    totalMessages: number;
    averageMessagesPerSession: number;
    topIntents: Array<{ intent: string; count: number }>;
    feedbackStats: { positive: number; negative: number; neutral: number };
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalSessions, activeToday, totalMessages, intentCounts, feedbackCounts] =
        await Promise.all([
          db.chatSession.count(),
          db.chatSession.count({ where: { lastActiveAt: { gte: today } } }),
          db.chatMessage.count(),
          db.chatMessage.groupBy({
            by: ['intent'],
            where: { intent: { not: null }, role: 'bot' },
            _count: { intent: true },
            take: 10,
            orderBy: { _count: { intent: 'desc' } },
          }),
          db.chatFeedback.groupBy({
            by: ['rating'],
            _count: { rating: true },
          }),
        ]);

      const avgMessages = totalSessions > 0 
        ? Math.round((totalMessages / totalSessions) * 10) / 10 
        : 0;

      const feedbackMap = Object.fromEntries(
        feedbackCounts.map(f => [f.rating, f._count.rating])
      );

      return {
        totalSessions,
        activeSessionsToday: activeToday,
        totalMessages,
        averageMessagesPerSession: avgMessages,
        topIntents: intentCounts.map(i => ({ intent: i.intent!, count: i._count.intent })),
        feedbackStats: {
          positive: feedbackMap.positive || 0,
          negative: feedbackMap.negative || 0,
          neutral: feedbackMap.neutral || 0,
        },
      };
    } catch (error) {
      console.error('Error getting chat stats:', error);
      return {
        totalSessions: 0,
        activeSessionsToday: 0,
        totalMessages: 0,
        averageMessagesPerSession: 0,
        topIntents: [],
        feedbackStats: { positive: 0, negative: 0, neutral: 0 },
      };
    }
  }
}

// Export singleton instance
export const chatbotEngine = new ChatbotEngine();

// Export class for custom instances
export { ChatbotEngine };
export default ChatbotEngine;
