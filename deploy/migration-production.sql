-- =============================================
-- AlgeriaTrade.dz - Production Database Migration
-- Migration de la base de données pour la production (PostgreSQL)
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text similarity search
CREATE INDEX IF NOT EXISTS idx_products_search_gin ON products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_search_gin ON companies USING gin(name gin_trgm_ops);

-- =============================================
-- 1. Add missing composite indexes for performance
-- =============================================

-- Orders: frequently filtered by status + date range
CREATE INDEX IF NOT EXISTS idx_orders_status_createdat 
ON orders(status, "createdAt" DESC);

-- Orders: company queries
CREATE INDEX IF NOT EXISTS idx_orders_companyid_status 
ON orders("companyId", status);

-- Products: listing queries
CREATE INDEX IF NOT EXISTS idx_products_status_createdat 
ON products(status, "createdAt" DESC);

-- Products: company product management
CREATE INDEX IF NOT EXISTS idx_products_companyid_status 
ON products("companyId", status);

-- Payments: reconciliation queries
CREATE INDEX IF NOT EXISTS idx_payments_status_createdat 
ON payments(status, "createdAt" DESC);

-- Invoices: aging reports
CREATE INDEX IF NOT EXISTS idx_invoices_status_issuedate 
ON invoices(status, "issueDate" DESC);

-- Users: login queries
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

-- Companies: verification queries
CREATE INDEX IF NOT EXISTS idx_companies_verification_status 
ON companies("verificationStatus", "createdAt" DESC);

-- RFQs: supplier queries
CREATE INDEX IF NOT EXISTS idx_rfqs_status_createdat 
ON rfqs(status, "createdAt" DESC);

-- Negotiations: active negotiations
CREATE INDEX IF NOT EXISTS idx_negotiations_status 
ON negotiations(status, "updatedAt" DESC);

-- =============================================
-- 2. Add soft-delete columns (GDPR compliance)
-- =============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz;
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz;
ALTER TABLE negotiations ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz;

-- Create partial indexes for soft-deleted records exclusion
CREATE INDEX IF NOT EXISTS idx_users_not_deleted ON users(id) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_companies_not_deleted ON companies(id) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_not_deleted ON products(id) WHERE "deletedAt" IS NULL;

-- =============================================
-- 3. Create audit log table
-- =============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    "createdAt" timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_userId ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON "audit_logs"(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_createdAt ON "audit_logs"("createdAt" DESC);

-- =============================================
-- 4. Create session table for Redis fallback / DB sessions
-- =============================================

CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES users(id),
    data JSONB NOT NULL DEFAULT '{}',
    "expiresAt" timestamptz NOT NULL,
    "createdAt" timestamptz DEFAULT NOW(),
    "updatedAt" timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_expiresAt ON sessions("expiresAt");

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions WHERE "expiresAt" < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. Create rate limiting table (fallback when Redis unavailable)
-- =============================================

CREATE TABLE IF NOT EXISTS rate_limits (
    key VARCHAR(255) PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    "windowStart" timestamptz NOT NULL DEFAULT NOW(),
    "expiresAt" timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_expiresAt ON rate_limits("expiresAt");

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_key VARCHAR,
    p_window_seconds INTEGER,
    p_max_requests INTEGER
) RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ) AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMPTZ;
    expires_at TIMESTAMPTZ;
BEGIN
    -- Clean up expired entries first
    DELETE FROM rate_limits WHERE "expiresAt" < NOW();
    
    -- Get or create rate limit entry
    SELECT count, "windowStart", "expiresAt"
    INTO current_count, window_start, expires_at
    FROM rate_limits WHERE key = p_key;
    
    IF current_count IS NULL THEN
        -- First request in window
        INSERT INTO rate_limits (key, count, "windowStart", "expiresAt")
        VALUES (p_key, 1, NOW(), NOW() + (p_window_seconds || ' seconds')::INTERVAL);
        
        RETURN QUERY SELECT TRUE, p_max_requests - 1, NOW() + (p_window_seconds || ' seconds')::INTERVAL;
        RETURN;
    ELSIF current_count >= p_max_requests THEN
        -- Rate limit exceeded
        RETURN QUERY SELECT FALSE, 0, expires_at;
        RETURN;
    ELSE
        -- Increment counter
        UPDATE rate_limits SET count = count + 1 WHERE key = p_key;
        
        RETURN QUERY SELECT TRUE, p_max_requests - current_count - 1, expires_at;
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. Add full-text search configuration for French & Arabic
-- =============================================

-- French text search configuration
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS french_simple (COPY=simple);
ALTER TEXT SEARCH CONFIGURATION french_simple ALTER MAPPING FOR word, numword, asciiword, hword, hword_asciword WITH french_stem;

-- Create materialized view for product search (refresh as needed)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_search AS
SELECT 
    p.id,
    p.name,
    p.description,
    p."companyId",
    c.name AS "companyName",
    p.category,
    p."subCategory",
    p.price,
    p.status,
    p."createdAt",
    tsvector('french_simple', COALESCE(p.name, '') || ' ' || COALESCE(p.description, '')) AS search_vector
FROM products p
LEFT JOIN companies c ON p."companyId" = c.id
WHERE p."deletedAt" IS NULL AND p.status = 'ACTIVE';

-- Index for full-text search
CREATE INDEX IF NOT EXISTS idx_mv_product_search_vector 
ON mv_product_search USING gin(search_vector);

-- =============================================
-- 7. Create notifications table
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'system',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    channels VARCHAR(100)[] NOT NULL ARRAY['in-app'],
    data JSONB,
    "readAt" timestamptz,
    "actionUrl" VARCHAR(500),
    "actionLabel" VARCHAR(100),
    icon VARCHAR(50),
    "imageUrl" VARCHAR(500),
    "createdAt" timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_readAt ON notifications("readAt") WHERE "readAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_createdAt ON notifications("createdAt" DESC);

-- =============================================
-- 8. Performance optimization: Partitioning strategy (for large tables)
-- Note: Uncomment for high-volume deployments
-- =============================================

/*
-- Example: Partition orders by year
CREATE TABLE orders_2024 PARTITION OF orders
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE orders_2025 PARTITION OF orders
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Example: Partition audit_logs by month
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
*/

-- =============================================
-- 9. Security: Row-Level Security (optional)
-- Enable for multi-tenant isolation if needed
-- =============================================

-- Example RLS policy (uncomment to enable)
/*
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_can_view_own_orders ON orders
    FOR SELECT USING ("buyerId" = current_setting('app.current_user_id', true)::UUID OR "sellerId" = current_setting('app.current_user_id', true)::UUID);

CREATE POLICY users_can_insert_own_orders ON orders
    FOR INSERT WITH CHECK ("buyerId" = current_setting('app.current_user_id', true)::UUID);
*/

-- =============================================
-- 10. Final: Update statistics for query optimizer
-- =============================================

ANALYZE;

-- Log migration completion
INSERT INTO audit_logs (action, entity_type, entity_id, new_values)
VALUES (
    'MIGRATION_COMPLETE',
    'database',
    'production_migration_v1',
    '{"version": "1.0", "timestamp": "' || NOW() || '"}'::jsonb
) ON CONFLICT DO NOTHING;

-- Output summary
SELECT 'Migration completed successfully!' AS status,
       (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('orders', 'products', 'payments')) AS "indexesCreated",
       (SELECT COUNT(*) FROM information_schema.columns WHERE column_name = 'deletedAt') AS "softDeleteColumnsAdded";
