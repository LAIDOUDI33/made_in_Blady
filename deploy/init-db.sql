-- =============================================================================
-- PostgreSQL Initialization Script - AlgeriaTrade.dz
-- =============================================================================
-- This script runs on first database initialization (docker-entrypoint-initdb.d)
-- It sets up the database with required extensions and initial configuration.
--
-- Note: Schema is managed by Prisma migrations. This file only handles
--       PostgreSQL-level configuration that Prisma can't manage.
-- =============================================================================

-- Create extensions required by the application
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For trigram-based text search
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- For GIN indexes on arrays

-- =============================================================================
-- Database Configuration
-- =============================================================================

-- Set timezone to Algeria/Algiers
ALTER DATABASE algeriatrade SET timezone TO 'Africa/Algiers';

-- Configure locale for proper Arabic/French text handling
-- (This should match the system locale)

-- =============================================================================
-- Performance Configuration (applied at session level)
-- =============================================================================

-- These settings can be overridden in docker-compose.yml command
-- They are included here as documentation of recommended values

-- Shared buffers (should be ~25% of available RAM)
-- ALTER SYSTEM SET shared_buffers = '256MB';

-- Effective cache size (should be ~75% of available RAM)
-- ALTER SYSTEM SET effective_cache_size = '768MB';

-- Work memory (per operation, for sorts, hashes, etc.)
-- ALTER SYSTEM SET work_mem = '4MB';

-- Maintenance work memory (for VACUUM, CREATE INDEX, etc.)
-- ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Random page cost (lower for SSD storage)
-- ALTER SYSTEM SET random_page_cost = 1.1;

-- Effective I/O concurrency (for SSDs)
-- ALTER SYSTEM SET effective_io_concurrency = 200;

-- WAL configuration
-- ALTER SYSTEM SET min_wal_size = '1GB';
-- ALTER SYSTEM SET max_wal_size = '4GB';
-- ALTER SYSTEM SET checkpoint_completion_target = '0.9';

-- Connection settings
-- ALTER SYSTEM SET max_connections = '200';

-- =============================================================================
-- Logging Configuration (for development/debugging)
-- =============================================================================

-- Log slow queries (>1 second)
-- ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Log DDL statements
-- ALTER SYSTEM SET log_statement = 'ddl';

-- =============================================================================
-- Initial Roles and Permissions (if needed)
-- =============================================================================

-- The application user is created by POSTGRES_USER env var
-- Additional roles can be created here if needed

-- Example: Create read-only user for reporting
-- CREATE ROLE readonly WITH LOGIN PASSWORD 'changeme_readonly';
-- GRANT CONNECT ON DATABASE algeriatrade TO readonly;
-- GRANT USAGE ON SCHEMA public TO readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly;

-- =============================================================================
-- Tablespaces (for advanced deployments)
-- =============================================================================

-- For production with separate disks:
-- CREATE TABLESPACE fast_storage LOCATION '/mnt/fast_storage';
-- CREATE TABLESPACE archive_storage LOCATION '/mnt/archive_storage';

-- =============================================================================
-- Completion Message
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'AlgeriaTrade.dz database initialized successfully!';
    RAISE NOTICE 'Timezone: %', current_setting('timezone');
    RAISE NOTICE 'Extensions: uuid-ossp, pg_trgm, btree_gin';
END $$;
