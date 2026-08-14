// Interaction Tracker - Tracks user actions for recommendation improvement
import { db } from '@/lib/db';
import { InteractionEvent } from './types';

class InteractionTracker {
  private buffer: InteractionEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private isFlushing = false;
  
  // Auto-flush configuration
  private readonly BUFFER_SIZE_LIMIT = 50; // Flush when buffer reaches this size
  private readonly FLUSH_INTERVAL_MS = 30000; // Flush every 30 seconds

  constructor(autoFlush = true) {
    if (autoFlush) {
      this.startAutoFlush();
    }
  }

  /**
   * Track a product view
   */
  async trackView(
    userId: string | undefined,
    productId: string,
    options?: {
      sessionId?: string;
      duration?: number;
      referrer?: string;
      deviceType?: 'mobile' | 'desktop' | 'tablet';
      position?: number;
    }
  ): Promise<void> {
    this.addToBuffer({
      userId,
      sessionId: options?.sessionId,
      type: 'view',
      productId,
      duration: options?.duration,
      referrer: options?.referrer,
      deviceType: options?.deviceType,
      position: options?.position,
    });

    // Also update product view count
    try {
      await db.product.update({
        where: { id: productId },
        data: { viewCount: { increment: 1 } },
      });
    } catch (error) {
      console.error('Error updating view count:', error);
    }
  }

  /**
   * Track a search query
   */
  async trackSearch(
    userId: string | undefined,
    searchTerm: string,
    resultsCount: number,
    options?: {
      sessionId?: string;
      referrer?: string;
      deviceType?: 'mobile' | 'desktop' | 'tablet';
    }
  ): Promise<void> {
    this.addToBuffer({
      userId,
      sessionId: options?.sessionId,
      type: 'search',
      searchTerm,
      metadata: { resultsCount },
      referrer: options?.referrer,
      deviceType: options?.deviceType,
    });

    // Also update search term stats
    try {
      const existingTerm = await db.searchTerm.findUnique({
        where: { term: searchTerm.toLowerCase() },
      });

      if (existingTerm) {
        await db.searchTerm.update({
          where: { term: searchTerm.toLowerCase() },
          data: {
            searchCount: { increment: 1 },
            resultCount: resultsCount,
            lastSearchedAt: new Date(),
          },
        });
      } else {
        await db.searchTerm.create({
          data: {
            term: searchTerm.toLowerCase(),
            searchCount: 1,
            resultCount: resultsCount,
          },
        });
      }
    } catch (error) {
      console.error('Error updating search term:', error);
    }
  }

  /**
   * Track contact with supplier
   */
  async trackContact(
    userId: string | undefined,
    companyId: string,
    options?: {
      sessionId?: string;
      productId?: string;
    }
  ): Promise<void> {
    this.addToBuffer({
      userId,
      sessionId: options?.sessionId,
      type: 'contact',
      companyId,
      productId: options?.productId,
    });
  }

  /**
   * Track favorite action
   */
  async trackFavorite(
    userId: string | undefined,
    itemType: 'product' | 'supplier',
    itemId: string,
    options?: {
      sessionId?: string;
    }
  ): Promise<void> {
    this.addToBuffer({
      userId,
      sessionId: options?.sessionId,
      type: 'favorite',
      ...(itemType === 'product' ? { productId: itemId } : { companyId: itemId }),
    });
  }

  /**
   * Track RFQ creation
   */
  async trackRFQ(
    userId: string | undefined,
    categoryId: string,
    options?: {
      sessionId?: string;
    }
  ): Promise<void> {
    this.addToBuffer({
      userId,
      sessionId: options?.sessionId,
      type: 'rfq',
      categoryId,
    });
  }

  /**
   * Track order/purchase
   */
  async trackPurchase(
    userId: string | undefined,
    orderId: string,
    items: Array<{ productId: string; quantity: number }>,
    options?: {
      sessionId?: string;
    }
  ): Promise<void> {
    // Track order-level interaction
    this.addToBuffer({
      userId,
      sessionId: options?.sessionId,
      type: 'order',
      metadata: { orderId, items },
    });

    // Track individual product interactions (higher weight)
    for (const item of items) {
      this.addToBuffer({
        userId,
        sessionId: options?.sessionId,
        type: 'order',
        productId: item.productId,
        metadata: { orderId, quantity: item.quantity },
      });
    }
  }

  /**
   * Track add to cart
   */
  async trackAddToCart(
    userId: string | undefined,
    productId: string,
    options?: {
      sessionId?: string;
      quantity?: number;
    }
  ): Promise<void> {
    this.addToBuffer({
      userId,
      sessionId: options?.sessionId,
      type: 'add_to_cart',
      productId,
      metadata: { quantity: options?.quantity || 1 },
    });
  }

  /**
   * Track click on recommendation
   */
  async trackClick(
    userId: string | undefined,
    targetId: string,
    targetType: 'product' | 'supplier' | 'category',
    source: string,
    options?: {
      sessionId?: string;
      position?: number;
    }
  ): Promise<void> {
    this.addToBuffer({
      userId,
      sessionId: options?.sessionId,
      type: 'click',
      ...(targetType === 'product' ? { productId: targetId } : 
         targetType === 'supplier' ? { companyId: targetId } : 
         { categoryId: targetId }),
      position: options?.position,
      metadata: { source, targetType },
    });
  }

  /**
   * Add event to buffer and auto-flush if needed
   */
  private addToBuffer(event: InteractionEvent): void {
    this.buffer.push(event);

    if (this.buffer.length >= this.BUFFER_SIZE_LIMIT) {
      this.flush();
    }
  }

  /**
   * Start automatic flushing interval
   */
  private startAutoFlush(): void {
    if (this.flushInterval) return;

    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);

    // Don't prevent process exit
    if (this.flushInterval.unref) {
      this.flushInterval.unref();
    }
  }

  /**
   * Stop automatic flushing
   */
  stopAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Flush all buffered events to database
   */
  async flush(): Promise<{ success: number; failed: number }> {
    if (this.isFlushing || this.buffer.length === 0) {
      return { success: 0, failed: 0 };
    }

    this.isFlushing = true;
    const eventsToProcess = [...this.buffer];
    this.buffer = [];

    let success = 0;
    let failed = 0;

    try {
      // Batch insert all events
      const interactionData = eventsToProcess.map(event => ({
        userId: event.userId || null,
        type: event.type,
        productId: event.productId || null,
        categoryId: event.categoryId || null,
        companyId: event.companyId || null,
        searchTerm: event.searchTerm || null,
        referrer: event.referrer || null,
        deviceType: event.deviceType || null,
        position: event.position || null,
        duration: event.duration || null,
        sessionId: event.sessionId || null,
      }));

      await db.userInteraction.createMany({
        data: interactionData,
        skipDuplicates: true,
      });

      success = eventsToProcess.length;
    } catch (error) {
      console.error('Error flushing interactions:', error);
      failed = eventsToProcess.length;
      
      // Re-add failed events to buffer (up to limit)
      if (failed <= this.BUFFER_SIZE_LIMIT) {
        this.buffer.unshift(...eventsToProcess);
      }
    } finally {
      this.isFlushing = false;
    }

    return { success, failed };
  }

  /**
   * Get user's recent interactions
   */
  async getUserInteractions(
    userId: string,
    limit: number = 50,
    types?: string[]
  ) {
    return db.userInteraction.findMany({
      where: {
        userId,
        ...(types ? { type: { in: types } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get user's viewed products (for "also viewed" features)
   */
  async getViewedProducts(userId: string, limit: number = 20) {
    const interactions = await db.userInteraction.findMany({
      where: {
        userId,
        type: 'view',
        productId: { not: null },
      },
      distinct: ['productId'],
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const productIds = interactions.map(i => i.productId!).filter(Boolean);

    if (productIds.length === 0) return [];

    return db.product.findMany({
      where: { id: { in: productIds } },
      include: {
        company: { select: { name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    });
  }

  /**
   * Get products also viewed by users who viewed a specific product
   */
  async getAlsoViewedProducts(productId: string, limit: number = 10) {
    // Find users who viewed this product
    const viewerUserIds = await db.userInteraction.findMany({
      where: {
        type: 'view',
        productId,
      },
      distinct: ['userId'],
      select: { userId: true },
      take: 100,
    }).then(results => results.map(r => r.userId).filter(Boolean));

    if (viewerUserIds.length === 0) return [];

    // Find other products those users viewed
    const alsoViewed = await db.userInteraction.groupBy({
      by: ['productId'],
      where: {
        userId: { in: viewerUserIds as string[] },
        type: 'view',
        productId: { not: productId },
        productId: { not: null },
      },
      _count: { productId: true },
      take: limit * 3,
      orderBy: { _count: { productId: 'desc' } },
    });

    // Get product details
    const productIds = alsoViewed.map(a => a.productId!).filter(Boolean);

    if (productIds.length === 0) return [];

    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      include: {
        company: { select: { name: true, slug: true, isVerified: true } },
        category: { select: { name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
      take: limit,
    });

    // Sort by view count from alsoViewed
    const viewCounts = new Map(alsoViewed.map(a => [a.productId!, a._count.productId]));
    
    return products.sort((a, b) => 
      (viewCounts.get(b.id) || 0) - (viewCounts.get(a.id) || 0)
    );
  }

  /**
   * Destroy instance and cleanup
   */
  destroy(): void {
    this.stopAutoFlush();
    // Final flush
    this.flush().catch(console.error);
  }
}

// Export singleton instance with auto-flush enabled
export const interactionTracker = new InteractionTracker(true);

// Export class for custom instances
export { InteractionTracker };
export default InteractionTracker;
