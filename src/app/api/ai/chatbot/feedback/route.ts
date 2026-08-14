// API Route: Record feedback on bot response
import { NextRequest, NextResponse } from 'next/server';
import { chatbotEngine } from '@/lib/ai/chatbot';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, sessionId, rating, comment, category, userId } = body;

    // Validate required fields
    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId is required' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Validate rating
    const validRatings = ['positive', 'negative', 'neutral'];
    if (!rating || !validRatings.includes(rating)) {
      return NextResponse.json(
        { error: `Invalid rating. Must be one of: ${validRatings.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate category if provided
    const validCategories = ['accuracy', 'helpfulness', 'clarity', 'relevance'];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be one of: accuracy, helpfulness, clarity, relevance' },
        { status: 400 }
      );
    }

    await chatbotEngine.recordFeedback(
      messageId,
      sessionId,
      rating,
      comment,
      category,
      userId || undefined
    );

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully',
    });
  } catch (error) {
    console.error('Error recording feedback:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}

// GET: Get feedback statistics (admin)
export async function GET() {
  try {
    // This would typically require admin authentication
    // For now, returning basic stats
    const stats = await chatbotEngine.getStats();
    
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting feedback stats:', error);
    return NextResponse.json(
      { error: 'Failed to get feedback statistics' },
      { status: 500 }
    );
  }
}
