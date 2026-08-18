-- =============================================
-- AlgeriaTrade.dz - Phase 6 Database Index Optimization
-- Optimisation des index de base de données pour la Phase 6
-- =============================================
-- 
-- This script contains recommended indexes for optimizing
-- Phase 6 API performance including:
-- - Search & Full-text search with accents (Arabic, French)
-- - Products pagination and filtering
-- - Trending algorithm queries
-- - Analytics aggregation
-- - Videos, Exhibitions, Shipping, Verification tables
--
-- Run this script after applying Phase 6 schema migrations.
-- =============================================

-- =============================================
-- 1. PRODUCTS TABLE INDEXES
-- =============================================

-- Core product listing index (covers most common queries)
CREATE INDEX IF NOT EXISTS idx_products_status_category_price 
ON products(status, category_id, price DESC) 
WHERE status = 'active';

-- Product search optimization with text search support
CREATE INDEX IF NOT EXISTS idx_products_name_search 
ON products USING gin(to_tsvector('simple', name));

-- French accent-insensitive search (using unaccent extension)
-- Note: Requires CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE INDEX IF NOT EXISTS idx_products_name_fr_unaccent 
ON products USING gin(to_tsvector('french', unaccent(name)));

-- Arabic text search support
CREATE INDEX IF NOT EXISTS idx_products_name_ar_search 
ON products USING gin(to_tsvector('arabic', name));

-- Supplier filtering for product listings
CREATE INDEX IF NOT EXISTS idx_products_supplier_verified 
ON products(supplier_id) 
WHERE status = 'active' AND supplier_id IS NOT NULL;

-- Price range queries for filtering
CREATE INDEX IF NOT EXISTS idx_products_price_range 
ON products(price) 
WHERE status = 'active';

-- Created_at for sorting (newest first)
CREATE INDEX IF NOT EXISTS idx_products_created_desc 
ON products(created_at DESC) 
WHERE status = 'active';

-- Composite index for category + price pagination
CREATE INDEX IF NOT EXISTS idx_products_category_price_pagination 
ON products(category_id, price ASC, id) 
WHERE status = 'active';

-- Wilaya-based filtering (Algeria-specific)
CREATE INDEX IF NOT EXISTS idx_products_wilaya 
ON products(wilaya_code) 
WHERE status = 'active' AND wilaya_code IS NOT NULL;

-- Certification filter index
CREATE INDEX IF NOT EXISTS idx_products_certified 
ON products(is_certified) 
WHERE is_certified = true AND status = 'active';

-- Export-ready products index
CREATE INDEX IF NOT EXISTS idx_products_export_ready 
ON products(export_ready) 
WHERE export_ready = true AND status = 'active';

-- MOQ (Minimum Order Quantity) filtering
CREATE INDEX IF NOT EXISTS idx_products_moq 
ON products(min_order_quantity) 
WHERE min_order_quantity > 0 AND status = 'active';

-- Updated_at for cache invalidation queries
CREATE INDEX IF NOT EXISTS idx_products_updated_at 
ON products(updated_at);

-- =============================================
-- 2. TRENDING/POPULARITY INDEXES
-- =============================================

-- Trending score calculation (composite for ranking algorithm)
CREATE INDEX IF NOT EXISTS idx_product_stats_trending_score 
ON product_stats(
  view_count_24h DESC, 
  inquiry_count_24h DESC,
  conversion_rate DESC,
  last_interaction_at DESC
)
WHERE view_count_24h > 0;

-- Category trending (for category-specific trending pages)
CREATE INDEX IF NOT EXISTS idx_product_stats_category_trending 
ON product_stats(category_id, trend_score DESC)
WHERE trend_score > 0;

-- Velocity index (for "rising products" detection)
CREATE INDEX IF NOT EXISTS idx_product_stats_velocity 
ON product_stats(score_velocity DESC)
WHERE score_velocity > 0;

-- Time-based decay for trending algorithm
CREATE INDEX IF NOT EXISTS idx_product_stats_recent_activity 
ON product_stats(last_interaction_at DESC)
WHERE last_interaction_at > NOW() - INTERVAL '7 days';

-- =============================================
-- 3. SEARCH LOG & ANALYTICS INDEXES
-- =============================================

-- Search query analytics (for popular searches)
CREATE INDEX IF NOT EXISTS idx_search_logs_query_date 
ON search_logs(query_text, created_at DESC);

-- Search query frequency analysis
CREATE INDEX IF NOT EXISTS idx_search_logs_query_count 
ON search_logs(query_hash, result_count);

-- User search history for personalization
CREATE INDEX IF NOT EXISTS idx_search_logs_user_history 
ON search_logs(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- No-result searches (for content gap analysis)
CREATE INDEX IF NOT EXISTS idx_search_logs_no_results 
ON search_logs(query_text)
WHERE result_count = 0;

-- =============================================
-- 4. VIDEOS TABLE INDEXES
-- =============================================

-- Video listings by product
CREATE INDEX IF NOT EXISTS idx_videos_product 
ON videos(product_id, status) 
WHERE status = 'processed';

-- Video processing queue
CREATE INDEX IF NOT EXISTS idx_videos_processing_queue 
ON videos(status, created_at ASC)
WHERE status IN ('uploading', 'processing');

-- Public video listings
CREATE INDEX IF NOT EXISTS idx_videos_public 
ON videos(status, created_at DESC)
WHERE status = 'processed' AND is_public = true;

-- Video by uploader
CREATE INDEX IF NOT EXISTS idx_videos_uploader 
ON videos(uploaded_by, created_at DESC);

-- Video type filtering
CREATE INDEX IF NOT EXISTS idx_videos_type 
ON videos(video_type, status)
WHERE status = 'processed';

-- =============================================
-- 5. EXHIBITIONS TABLE INDEXES
// =============================================

-- Upcoming exhibitions (most common query)
CREATE INDEX IF NOT EXISTS idx_exhibitions_upcoming 
ON exhibitions(start_date ASC, status)
WHERE status = 'published' AND start_date >= CURRENT_DATE;

-- Exhibitions by location/country
CREATE INDEX IF NOT EXISTS idx_exhibitions_location 
ON exhibitions(country, city, start_date)
WHERE status = 'published';

-- Exhibition categories
CREATE INDEX IF NOT EXISTS idx_exhibitions_category 
ON exhibitions(category, start_date)
WHERE status = 'published';

-- Organizer's exhibitions
CREATE INDEX IF NOT EXISTS idx_exhibitions_organizer 
ON exhibitions(organizer_id, status);

-- Past exhibitions archive
CREATE INDEX IF NOT EXISTS idx_exhibitions_past 
ON exhibitions(end_date DESC)
WHERE end_date < CURRENT_DATE;

-- Featured exhibitions
CREATE INDEX IF NOT EXISTS idx_exhibitions_featured 
ON exhibitions(is_featured, start_date)
WHERE is_featured = true AND status = 'published';

-- Exhibition registration lookup
CREATE INDEX IF NOT EXISTS idx_exhibition_registrations_lookup 
ON exhibition_registrations(exhibition_id, company_id, status);

-- =============================================
-- 6. SHIPPING TABLE INDEXES
// =============================================

-- Shipping rate origin-destination lookup (critical path)
CREATE INDEX IF NOT EXISTS idx_shipping_rates_route 
ON shipping_rates(origin_wilaya, destination_wilaya, shipping_method, weight_min, weight_max)
WHERE is_active = true;

-- Shipping rates by provider
CREATE INDEX IF NOT EXISTS idx_shipping_rates_provider 
ON shipping_rates(provider_id, is_active)
WHERE is_active = true;

-- Shipment tracking (by tracking number)
CREATE INDEX IF NOT EXISTS idx_shipments_tracking 
ON shipments(tracking_number)
WHERE tracking_number IS NOT NULL;

-- Shipments by status (for dashboard queries)
CREATE INDEX IF NOT EXISTS idx_shipments_status 
ON shipments(status, created_at DESC);

-- Shipments by customer
CREATE INDEX IF NOT EXISTS idx_shipments_customer 
ON shipments(customer_id, created_at DESC);

-- Shipments by supplier
CREATE INDEX IF NOT EXISTS idx_shipments_supplier 
ON shipments(supplier_id, created_at DESC);

-- Active deliveries (for real-time tracking)
CREATE INDEX IF NOT EXISTS idx_shipments_active 
ON shipments(status, estimated_delivery)
WHERE status IN ('shipped', 'in_transit', 'out_for_delivery');

-- Delivery zones lookup
CREATE INDEX IF NOT EXISTS idx_delivery_zones_wilaya 
ON delivery_zones(wilaya_code, delivery_type)
WHERE is_active = true;

-- =============================================
-- 7. VERIFICATION TABLE INDEXES
// =============================================

-- Verification status lookup (high frequency)
CREATE INDEX IF NOT EXISTS idx_verifications_company 
ON verifications(company_id, status, created_at DESC);

-- Pending verifications queue (for admin review)
CREATE INDEX IF NOT EXISTS idx_verifications_pending 
ON verifications(status, submitted_at ASC)
WHERE status = 'pending';

-- Verification by document type
CREATE INDEX IF NOT EXISTS idx_verifications_doc_type 
ON verifications(document_type, status);

-- Verification documents storage lookup
CREATE INDEX IF NOT EXISTS idx_verification_documents_ref 
ON verification_documents(verification_id, document_type);

-- Company verified badge lookup
CREATE INDEX IF NOT EXISTS idx_companies_verified 
ON companies(is_verified, verification_date)
WHERE is_verified = true;

-- =============================================
-- 8. ESCROW TABLE INDEXES
// =============================================

-- Active escrow transactions (real-time queries)
CREATE INDEX IF NOT EXISTS idx_escrow_active 
ON escrow_transactions(status, created_at DESC)
WHERE status IN ('pending_payment', 'funded', 'in_escrow', 'disputed');

-- Escrow by buyer
CREATE INDEX IF NOT EXISTS idx_escrow_buyer 
ON escrow_transactions(buyer_id, status, created_at DESC);

-- Escrow by seller
CREATE INDEX IF NOT EXISTS idx_escrow_seller 
ON escrow_transactions(seller_id, status, created_at DESC);

-- Escrow by order reference
CREATE INDEX IF NOT EXISTS idx_escrow_order 
ON escrow_transactions(order_id);

-- Disputed transactions (priority handling)
CREATE INDEX IF NOT EXISTS idx_escrow_disputed 
ON escrow_transactions(status, dispute_created_at ASC)
WHERE status = 'disputed';

-- Escrow milestones for active transactions
CREATE INDEX IF NOT EXISTS idx_escrow_milestones 
ON escrow_milestones(transaction_id, status)
WHERE transaction_id IS NOT NULL;

-- =============================================
-- 9. INSPECTION TABLE INDEXES
// =============================================

-- Inspection requests by status
CREATE INDEX IF NOT EXISTS idx_inspections_status 
ON inspections(status, requested_at DESC);

-- Inspections by inspector assignment
CREATE INDEX IF NOT EXISTS idx_inspections_inspector 
ON inspections(inspector_id, status)
WHERE inspector_id IS NOT NULL;

-- Inspections by product/order
CREATE INDEX IF NOT EXISTS idx_inspections_order 
ON inspections(order_id, product_id);

-- Scheduled inspections (upcoming)
CREATE INDEX IF NOT EXISTS idx_inspections_scheduled 
ON inspections(scheduled_date ASC, status)
WHERE status = 'scheduled' AND scheduled_date >= CURRENT_DATE;

-- Inspection reports lookup
CREATE INDEX IF NOT EXISTS idx_inspection_reports_ref 
ON inspection_reports(inspection_id);

-- =============================================
-- 10. ANALYTICS AGGREGATION INDEXES
// =============================================

-- Daily metrics time-series (for 7d/30d/90d/1y queries)
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date 
ON analytics_daily(date DESC, metric_type);

-- Daily metrics by entity
CREATE INDEX IF NOT EXISTS idx_analytics_daily_entity 
ON analytics_daily(entity_type, entity_id, date DESC);

-- Hourly real-time metrics (last 24 hours)
CREATE INDEX IF NOT EXISTS idx_analytics_hourly_recent 
ON analytics_hourly(recorded_at DESC)
WHERE recorded_at > NOW() - INTERVAL '25 hours';

-- Event tracking (user activity)
CREATE INDEX IF NOT EXISTS idx_analytics_events_user 
ON analytics_events(user_id, event_type, created_at DESC)
WHERE user_id IS NOT NULL;

-- Event tracking by session
CREATE INDEX IF NOT EXISTS idx_analytics_events_session 
ON analytics_events(session_id, created_at DESC);

-- Conversion funnel events
CREATE INDEX IF NOT EXISTS idx_analytics_events_conversion 
ON analytics_events(event_type, created_at DESC)
WHERE event_type IN ('view_product', 'add_to_cart', 'start_checkout', 'purchase');

-- Aggregated counters (pre-computed)
CREATE INDEX IF NOT EXISTS idx_analytics_counters 
ON analytics_counters(counter_key, date)
WHERE date >= CURRENT_DATE - INTERVAL '1 year';

-- =============================================
-- 11. DISCOVERY/RECOMMENDATION INDEXES
// =============================================

-- User preference profile lookup
CREATE INDEX IF NOT EXISTS idx_user_preferences 
ON user_preferences(user_id, preference_type)
WHERE user_id IS NOT NULL;

-- Collaborative filtering: user-item interactions
CREATE INDEX IF NOT EXISTS idx_user_interactions 
ON user_interactions(user_id, interaction_type, created_at DESC);

-- Item similarity pre-computation
CREATE INDEX IF NOT EXISTS idx_item_similarity 
ON item_similarities(item_a_id, similarity_score DESC)
WHERE similarity_score > 0.3;

-- Category affinity
CREATE INDEX IF NOT EXISTS idx_user_category_affinity 
ON user_category_affinity(user_id, affinity_score DESC)
WHERE affinity_score > 0.5;

-- =============================================
-- 12. COMPOSITE INDEXES FOR COMMON API QUERIES
// =============================================

-- Product search with filters (main search API)
CREATE INDEX IF NOT EXISTS idx_products_search_main 
ON products(status, category_id, wilaya_code, price, created_at DESC)
INCLUDE (id, name, slug, thumbnail_url, price, currency)
WHERE status = 'active';

-- Admin product management
CREATE INDEX IF NOT EXISTS idx_products_admin_list 
ON products(supplier_id, status, updated_at DESC);

-- Order history with details
CREATE INDEX IF NOT EXISTS idx_orders_customer_history 
ON orders(customer_id, created_at DESC)
WHERE customer_id IS NOT NULL;

-- RFQ responses for suppliers
CREATE INDEX IF NOT EXISTS idx_rfqs_supplier_pending 
ON rfq_responses(rfq_id, supplier_id, status)
WHERE status = 'pending';

-- Messages threading (chat functionality)
CREATE INDEX IF NOT EXISTS idx_messages_thread 
ON messages(thread_id, created_at DESC);

-- Notifications for users
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, is_read, created_at DESC)
WHERE is_read = false;

-- =============================================
-- 13. PARTIAL INDEXES FOR SPECIFIC USE CASES
// =============================================

-- Products on sale
CREATE INDEX IF NOT EXISTS idx_products_on_sale 
ON products(discount_percentage DESC, original_price)
WHERE discount_percentage > 0 AND status = 'active';

-- New products (last 30 days)
CREATE INDEX IF NOT EXISTS idx_products_new_arrivals 
ON products(created_at DESC)
WHERE status = 'active' AND created_at > NOW() - INTERVAL '30 days';

-- Premium/featured products
CREATE INDEX IF NOT EXISTS idx_products_premium 
ON products(is_premium, featured_rank)
WHERE is_premium = true AND status = 'active';

-- Low stock alerts
CREATE INDEX IF NOT EXISTS idx_products_low_stock 
ON products(stock_quantity, reorder_point)
WHERE stock_quantity <= reorder_point AND track_inventory = true;

-- High-rated products
CREATE INDEX IF NOT EXISTS idx_products_high_rated 
ON products(rating_avg DESC, review_count)
WHERE rating_avg >= 4.0 AND review_count >= 10 AND status = 'active';

-- =============================================
-- 14. MAINTENANCE VIEWS FOR MONITORING
// =============================================

-- View for slow query monitoring
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan,
  CASE 
    WHEN idx_scan = 0 THEN 'UNUSED'
    WHEN idx_tup_read / GREATEST(idx_tup_fetch, 1) > 1000 => 'INEFFICIENT'
    ELSE 'OK'
  END as efficiency_status
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC NULLS LAST;

-- View for table sizes (identify large tables needing optimization)
CREATE OR REPLACE VIEW v_table_sizes AS
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as data_size,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View for cache hit ratios
CREATE OR REPLACE VIEW v_cache_hit_ratios AS
SELECT 
  schemaname,
  tablename,
  heap_blks_read,
  heap_blks_hit,
  CASE 
    WHEN heap_blks_read + heap_blks_hit = 0 THEN 0
    ELSE ROUND(100 * heap_blks_hit::numeric / (heap_blks_read + heap_blks_hit), 2)
  END as cache_hit_ratio_percent
FROM pg_statio_user_tables
ORDER BY (heap_blks_read + heap_blks_hit) DESC;

-- =============================================
-- 15. CLEANUP & MAINTENANCE
// =============================================

-- Function to update statistics (run after major data changes)
-- SELECT analyze_phase6_tables();

CREATE OR REPLACE FUNCTION analyze_phase6_tables()
RETURNS void AS $$
BEGIN
  -- Analyze frequently modified tables
  ANALYZE products;
  ANALYZE product_stats;
  ANALYZE search_logs;
  ANALYZE videos;
  ANALYZE exhibitions;
  ANALYZE exhibition_registrations;
  ANALYZE shipping_rates;
  ANALYZE shipments;
  ANALYZE verifications;
  ANALYZE escrow_transactions;
  ANALYZE inspections;
  ANALYZE analytics_daily;
  ANALYZE analytics_hourly;
  ANALYZE analytics_events;
  ANALYZE user_interactions;
  
  RAISE NOTICE 'Phase 6 tables analyzed successfully';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- END OF PHASE 6 INDEX OPTIMIZATION
// =============================================

-- Usage notes:
-- 1. Run this script during maintenance window
-- 2. Monitor query performance before/after using EXPLAIN ANALYZE
-- 3. Use v_slow_queries view to identify unused or inefficient indexes
-- 4. Run ANALYZE regularly after bulk operations
-- 5. Consider partitioning for very large tables (>10M rows)
