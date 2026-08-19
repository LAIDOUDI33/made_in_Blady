# =============================================================================
# Fastly VCL Configuration for AlgeriaTrade.dz
# =============================================================================
# Optimized for MENA region with focus on Algeria
# Primary: Algeria (Algiers, Oran, Constantine) <50ms
# Secondary: Tunisia, Morocco, France <100ms
# Global: Rest of world <200ms
# =============================================================================

sub vcl_init {
    # -------------------------------------------------------------------------
    # Backend Definitions - Origin Servers
    # -------------------------------------------------------------------------
    
    # Primary Origin Server (Production)
    backend origin_production {
        .host = "origin.algeriatrade.internal";
        .port = "443";
        .ssl = true;
        .ssl_cert_hostname = "origin.algeriatrade.internal";
        .ssl_sni_hostname = "origin.algeriatrade.internal";
        .connect_timeout = 10s;
        .first_byte_timeout = 30s;
        .between_bytes_timeout = 15s;
        .max_connections = 500;
        .share_key = "algeriatrade-origin-prod";
        .probe = {
            .request = "GET /api/health HTTP/1.1"
                "Host: origin.algeriatrade.internal"
                "Connection: close";
            .expected_response = 200;
            .interval = 15s;
            .timeout = 5s;
            .window = 5;
            .threshold = 3;
            .initial = 2;
        }
    }
    
    # Staging Origin Server
    backend origin_staging {
        .host = "staging-origin.algeriatrade.internal";
        .port = "443";
        .ssl = true;
        .ssl_cert_hostname = "staging-origin.algeriatrade.internal";
        .ssl_sni_hostname = "staging-origin.algeriatrade.internal";
        .connect_timeout = 10s;
        .first_byte_timeout = 30s;
        .between_bytes_timeout = 15s;
        .max_connections = 100;
        .share_key = "algeriatrade-origin-staging";
        .probe = {
            .request = "GET /api/health HTTP/1.1"
                "Host: staging-origin.algeriatrade.internal"
                "Connection: close";
            .expected_response = 200;
            .interval = 30s;
            .timeout = 5s;
            .window = 3;
            .threshold = 2;
        }
    }
    
    # Image Optimization Service
    backend image_optimizer {
        .host = "image-optimizer.algeriatrade.internal";
        .port = "443";
        .ssl = true;
        .connect_timeout = 5s;
        .first_byte_timeout = 20s;
        .between_bytes_timeout = 10s;
        .max_connections = 200;
    }
    
    # API Gateway Service
    backend api_gateway {
        .host = "api-gateway.algeriatrade.internal";
        .port = "443";
        .ssl = true;
        .connect_timeout = 5s;
        .first_byte_timeout = 25s;
        .between_bytes_timeout = 10s;
        .max_connections = 300;
    }
    
    # Fallback / Error Page Server
    backend error_pages {
        .host = "error-pages.algeriatrade.internal";
        .port = "443";
        .ssl = true;
        .connect_timeout = 3s;
        .first_byte_timeout = 5s;
    }
    
    # -------------------------------------------------------------------------
    # Director Definitions - Load Balancing & Geographic Routing
    # -------------------------------------------------------------------------
    
    # Primary Director with Health-Based Load Balancing
    director algeriatrade_origin round-robin {
        { .backend = origin_production; .weight = 100; }
    }
    
    # MENA Region Director - Routes to closest POP
    director mena_pop random {
        { .backend = origin_production; .weight = 80; }  # Algiers POP
        { .backend = origin_production; .weight = 20; }  # Marseille Shield
    }
    
    # Europe Director
    director europe_pop random {
        { .backend = origin_production; .weight = 70; }
        { .backend = origin_production; .weight = 30; }
    }
    
    # -------------------------------------------------------------------------
    # ACL Definitions
    # -------------------------------------------------------------------------
    
    acl internal_networks {
        !"10.0.0.0"/8;
        !"172.16.0.0"/12;
        !"192.168.0.0"/16;
        "localhost";
        !"0.0.0.0"/8;
    }
    
    acl allowed_search_engines {
        "66.249.64.0"/19;   # Google
        "157.55.39.0"/24;   # Bing
        "207.46.13.0"/24;   # Bing
        "40.77.167.0"/24;   # Bing
        "72.14.199.0"/24;   # Google
        "72.14.192.0"/18;   # Google
    }
    
    # -------------------------------------------------------------------------
    # Edge Dictionaries / Tables
    # -------------------------------------------------------------------------
    
    # Feature Flags Dictionary
    table feature_flags {
        "new_ui_design": "true",
        "advanced_search": "true",
        "real_time_chat": "false",
        "ai_recommendations": "true",
        "mobile_app_promo": "true",
        "arabic_locale_default": "true",
        "payment_satim": "true",
        "payment_crypto": "false",
    }
    
    # Country-Specific Cache TTL Table
    table country_cache_ttl {
        "DZ": "180",      # Algeria - Priority, 3 minutes
        "TN": "120",      # Tunisia
        "MA": "120",      # Morocco
        "LY": "90",       # Libya
        "EG": "90",       # Egypt
        "FR": "90",       # France
        "ES": "80",       # Spain
        "IT": "80",       # Italy
        "*": "60",        # Default global
    }
    
    # Path-to-Backend Routing Table
    table path_routing {
        "/api/auth/": "api_gateway",
        "/api/payments/": "api_gateway",
        "/api/webhooks/": "api_gateway",
        "/images/": "image_optimizer",
        "/uploads/": "image_optimizer",
        "/cdn/": "image_optimizer",
    }
    
    # Content-Type to Cache Behavior Mapping
    table cache_behaviors {
        "application/javascript": "static_long",
        "text/css": "static_long",
        "font/woff2": "static_long",
        "font/woff": "static_long",
        "image/png": "images_medium",
        "image/jpeg": "images_medium",
        "image/webp": "images_medium",
        "image/avif": "images_medium",
        "text/html": "html_medium",
        "application/json": "api_short",
        "text/xml": "api_short",
    }
}

# =============================================================================
# REQUEST PROCESSING
# =============================================================================

sub vcl_recv {
    # -------------------------------------------------------------------------
    # Geographic Detection & Logging
    # -------------------------------------------------------------------------
    set req.http.X-Country = client.geo.country_code;
    set req.http.X-Continent = client.geo.continent_code;
    set req.http.X-City = client.geo.city;
    set req.http.X-Region = client.geo.region;
    set req.http.X-ASN = client.geo.as_number;
    set req.http.X-Latitude = tostring(client.geo.latitude);
    set req.http.X-Longitude = tostring(client.geo.longitude);
    set req.http.X-Request-ID = req.http.Fastly-Request-ID;
    set req.http.X-Request-Start = now.sec;
    set req.http.X-CDN-Provider = "Fastly";
    set req.http.X-VCL-Hit = "recv";
    
    # -------------------------------------------------------------------------
    # Bot Detection & Handling
    # -------------------------------------------------------------------------
    
    # Allow legitimate search engine crawlers
    if (client.ip ~ allowed_search_engines) {
        set req.http.X-Bot-Type = "search_engine";
        set req.http.X-Bypass-RateLimit = "1";
    }
    
    # Detect and mark suspicious bots
    if (req.http.User-Agent ~ "(?i)(curl|wget|python|java|go-http|okhttp|axios|scrapy|phantomjs|selenium|puppeteer)") {
        set req.http.X-Bot-Type = "suspected_scraper";
        if (req.url.path ~ "^/(api/|admin/)") {
            error 403 "Bot access denied";
        }
    }
    
    # Block empty user agents on API endpoints
    if (req.http.User-Agent == "" && req.url.path ~ "^/api/") {
        error 403 "Empty User-Agent not allowed";
    }
    
    # -------------------------------------------------------------------------
    # Request Routing Based on Path
    # -------------------------------------------------------------------------
    
    # Route to appropriate backend based on path
    declare local var.backend_name STRING;
    set var.backend_name = table.lookup(path_routing, req.url.path);
    
    if (var.backend_name == "api_gateway") {
        set req.backend = api_gateway;
        # Don't cache POST requests by default
        if (req.request != "GET" && req.request != "HEAD" && req.request != "OPTIONS") {
            return (pass);
        }
    } elsif (var.backend_name == "image_optimizer") {
        set req.backend = image_optimizer;
    }
    
    # -------------------------------------------------------------------------
    # Authentication Endpoints - Never Cache
    # -------------------------------------------------------------------------
    
    if (req.url.path ~ "^/api/auth/" || 
        req.url.path ~ "^/api/payments/" ||
        req.url.path ~ "^/api/webhooks/" ||
        req.url.path ~ "^/api/cart/" ||
        req.url.path ~ "^/api/checkout/" ||
        req.url.path ~ "^/_next/data/") {
        
        set req.http.Cache-Control = "no-store, no-cache, must-revalidate";
        return (pass);
    }
    
    # -------------------------------------------------------------------------
    # Method Filtering
    # -------------------------------------------------------------------------
    
    # Only allow standard methods
    if (req.request != "GET" &&
        req.request != "HEAD" &&
        req.request != "POST" &&
        req.request != "PUT" &&
        req.request != "PATCH" &&
        req.request != "DELETE" &&
        req.request != "OPTIONS") {
        error 405 "Method Not Allowed";
    }
    
    # -------------------------------------------------------------------------
    # CORS Pre-flight Handling
    # -------------------------------------------------------------------------
    
    if (req.request == "OPTIONS") {
        if (req.http.Origin ~ "^(https?://)?([^/]*\.)?algeriatrace\.dz$") {
            error 204 "";
        }
    }
    
    # -------------------------------------------------------------------------
    # Cache Key Normalization
    # -------------------------------------------------------------------------
    
    # Normalize host header (www vs non-www)
    if (req.http.Host ~ "^www\.(.*)") {
        set req.http.Host = re.group.1;
    }
    
    # Strip query string for static assets
    if (req.url.ext ~ "^(js|css|woff2?|ttf|png|jpg|jpeg|gif|webp|avif|svg)$") {
        # Keep versioned query strings only
        if (!req.url.query ~ "^[vV]?=\w+") {
            set req.url.query = "";
        }
    }
    
    # Add device type to cache key for responsive content
    if (req.http.User-Agent ~ "(?i)(mobile|android|iphone|ipod)" && 
        req.url.path ~ "^/(products|companies)/") {
        set req.http.X-Device-Type = "mobile";
    } elsif (req.http.User-Agent ~ "(?i)(tablet|ipad)") {
        set req.http.X-Device-Type = "tablet";
    } else {
        set req.http.X-Device-Type = "desktop";
    }
    
    # -------------------------------------------------------------------------
    # Geographic Cache TTL Selection
    # -------------------------------------------------------------------------
    
    declare local var.cache_ttl STRING;
    set var.cache_ttl = table.lookup(country_cache_ttl, client.geo.country_code);
    set var.cache_ttl = table.lookup(country_cache_ttl, "*");
    set req.http.X-Geo-Cache-TTL = var.cache_ttl;
    
    # -------------------------------------------------------------------------
    # Stale-if-error & Stale-while-revalidate Setup
    # -------------------------------------------------------------------------
    
    # Enable stale content delivery during errors
    set req.http.Stale-If-Error = "86400";  # Serve stale for 24h on origin error
    set req.http.Stale-While-Revalidate = "3600";  # Serve stale while refreshing
    
    # -------------------------------------------------------------------------
    # Header Cleanup Before Forwarding
    # -------------------------------------------------------------------------
    
    # Remove headers that shouldn't go to origin
    unset req.http.Cookie;  # We'll handle cookies selectively below
    
    # Pass session cookie for authenticated endpoints
    if (req.url.path ~ "^/(account|dashboard|checkout|api/user|api/orders)") {
        if (req.http.Cookie ~ "_at_session=") {
            # Extract only the session cookie
            declare local var.session_cookie STRING;
            set var.session_cookie = reg.extract(
                req.http.Cookie,
                regex=(_at_session=[^;]+)
            );
            set req.http.Cookie = var.session_cookie;
        } else {
            unset req.http.Cookie;
        }
    }
    
    # Remove hop-by-hop headers
    unset req.http.Proxy-Authorization;
    unset req.http.Proxy-Authenticate;
    unset req.http.TE;
    unset req.http.Trailer;
    unset req.http.Transfer-Encoding;
    unset req.http.Upgrade;
    unset req.http.Connection;
    
    return (hash);
}

# =============================================================================
# HASH / CACHE KEY GENERATION
# =============================================================================

sub vcl_hash {
    # Include device type in hash for responsive pages
    if (req.http.X-Device-Type) {
        hash_data(req.http.X-Device-Type);
    }
    
    # Include country code for geo-targeted content
    if (req.http.X-Country) {
        hash_data(req.http.X-Country);
    }
    
    # Include accept-encoding for compressed variants
    if (req.http.Accept-Encoding) {
        hash_data(req.http.Accept-Encoding);
    }
    
    # Include authorization header for personalized API responses
    if (req.http.Authorization) {
        hash_data(req.http.Authorization);
    }
    
    return (lookup);
}

# =============================================================================
# HIT PROCESSING (Cache Hit)
# =============================================================================

sub vcl_hit {
    # Check if object is stale but still usable
    if (obj.ttl <= 0s && obj.grace > 0s) {
        # Object is in grace period - serve stale, refresh in background
        set req.http.X-Cache-Status = "HIT-STALE";
        return (deliver);
    }
    
    # Check if we should background fetch
    if (obj.ttl < 300s && obj.grace > 0s) {
        # Object will expire soon, trigger early refresh
        restart;
        set req.http.X-Early-Refresh = "1";
    }
    
    set req.http.X-Cache-Status = "HIT";
    return (deliver);
}

# =============================================================================
# MISS PROCESSING (Cache Miss)
# =============================================================================

sub vcl_miss {
    set req.http.X-Cache-Status = "MISS";
    
    # Set backend fetch timeout based on content type
    if (req.url.ext ~ "^(jpg|jpeg|png|gif|webp|avif)$") {
        set req.http.First-Byte-Timeout = "20s";
    }
    
    return (fetch);
}

# =============================================================================
# FETCH FROM ORIGIN
# =============================================================================

sub vcl_fetch {
    # -------------------------------------------------------------------------
    # Response Processing
    # -------------------------------------------------------------------------
    
    # Set beresp headers for debugging
    set beresp.http.X-Origin-Server = beresp.http.Server;
    set beresp.http.X-Fetch-Time = now.usec_sec;
    set beresp.http.X-Backend = req.backend;
    
    # -------------------------------------------------------------------------
    # Cacheability Determination
    # -------------------------------------------------------------------------
    
    # Don't cache error responses beyond a short time
    if (beresp.status >= 500) {
        set beresp.ttl = 10s;
        set beresp.grace = 300s;
        set beresp.http.X-Cacheable = "NO:Server Error";
        return (deliver);
    }
    
    # Don't cache redirects permanently
    if (beresp.status >= 300 && beresp.status < 400) {
        set beresp.ttl = 0s;
        set beresp.http.X-Cacheable = "NO:Redirect";
        return (deliver);
    }
    
    # -------------------------------------------------------------------------
    # Static Assets - Long Cache (1 Year)
    # -------------------------------------------------------------------------
    
    if (req.url.ext ~ "^(js|css|woff2?|ttf|eot)$" ||
        req.url.path ~ "^/_next/static/" ||
        req.url.path ~ "^/static/") {
        
        set beresp.ttl = 31536000s;  # 1 year
        set beresp.stale_if_error = 2592000s;  # 30 days stale on error
        set beresp.stale_while_revalidate = 2592000s;  # 30 days SWR
        
        # Force immutable caching headers
        set beresp.http.Cache-Control = "public, max-age=31536000, immutable";
        set beresp.http.X-Cache-TTL = "31536000";
        set beresp.http.X-Cacheable = "YES:Static Asset";
        
        # Strip cookies from response
        unset beresp.http.Set-Cookie;
        
        return (deliver);
    }
    
    # -------------------------------------------------------------------------
    # Images - Medium Cache (30 Days)
    # -------------------------------------------------------------------------
    
    if (req.url.ext ~ "^(png|jpg|jpeg|gif|webp|avif|svg)$" ||
        req.url.path ~ "^/(images|uploads|cdn)/") {
        
        # Apply geographic TTL adjustment
        declare local var.img_ttl INTEGER;
        set var.img_ttl = std.integer(req.http.X-Geo-Cache-TTL, 60);
        set var.img_ttl = var.img_ttl * 43200;  # Scale to days equivalent
        
        if (var.img_ttl > 2592000s) {
            set var.img_ttl = 2592000s;
        }
        
        set beresp.ttl = var.img_ttl;
        set beresp.stale_if_error = 604800s;  # 7 days
        set beresp.stale_while_revalidate = 604800s;
        
        set beresp.http.Cache-Control = "public, max-age=2592000, stale-while-revalidate=604800";
        set beresp.http.Vary = "Accept-Encoding, Accept";
        set beresp.http.X-Cache-TTL = tostring(var.img_ttl);
        set beresp.http.X-Cacheable = "YES:Image";
        
        # Image optimization hints
        if (req.http.Accept ~ "image/avif") {
            set beresp.http.X-Preferred-Format = "avif";
        } elsif (req.http.Accept ~ "image/webp") {
            set beresp.http.X-Preferred-Format = "webp";
        }
        
        unset beresp.http.Set-Cookie;
        
        return (deliver);
    }
    
    # -------------------------------------------------------------------------
    # HTML Pages - Medium Cache (5 min)
    # -------------------------------------------------------------------------
    
    if (beresp.http.Content-Type ~ "text/html" && 
        !(req.url.path ~ "^/(account|dashboard|checkout|admin)")) {
        
        # Apply geographic TTL
        declare local var.html_ttl INTEGER;
        set var.html_ttl = std.integer(req.http.X-Geo-Cache-TTL, 60);
        set var.html_ttl = var.html_ttl * 5;  # Scale factor
        
        if (var.html_ttl > 300s) {
            set var.html_ttl = 300s;
        }
        
        set beresp.ttl = var.html_ttl;
        set beresp.stale_if_error = 3600s;  # 1 hour
        set beresp.stale_while_revalidate = 3600s;
        
        set beresp.http.Cache-Control = "public, max-age=" + var.html_ttl + ", s-maxage=" + var.html_ttl + ", stale-while-revalidate=3600";
        set beresp.http.X-Cache-TTL = tostring(var.html_ttl);
        set beresp.http.X-Cacheable = "YES:HTML Page";
        
        return (deliver);
    }
    
    # -------------------------------------------------------------------------
    # API Responses - Short Cache (60s SWR)
    # -------------------------------------------------------------------------
    
    if (req.url.path ~ "^/api/" && 
        req.request == "GET" &&
        !(req.url.path ~ "^/api/(auth|payments|webhooks|cart|checkout)")) {
        
        # Apply geographic TTL
        declare local var.api_ttl INTEGER;
        set var.api_ttl = std.integer(req.http.X-Geo-Cache-TTL, 60);
        
        set beresp.ttl = var.api_ttl s;
        set beresp.stale_if_error = 300s;  # 5 minutes
        set beresp.stale_while_revalidate = 300s;
        
        set beresp.http.Cache-Control = "public, max-age=" + var.api_ttl + ", s-maxage=" + var.api_ttl + ", stale-while-revalidate=300, must-revalidate";
        set beresp.http.Vary = "Authorization, Accept-Language";
        set beresp.http.X-API-Cached = "true";
        set beresp.http.X-Cache-TTL = tostring(var.api_ttl);
        set beresp.http.X-Cacheable = "YES:API Response";
        
        return (deliver);
    }
    
    # -------------------------------------------------------------------------
    # Default - Short Cache or Pass Through
    # -------------------------------------------------------------------------
    
    set beresp.ttl = 60s;
    set beresp.stale_if_error = 120s;
    set beresp.stale_while_revalidate = 120s;
    set beresp.http.X-Cacheable = "YES:Default";
    
    return (deliver);
}

# =============================================================================
# DELIVER TO CLIENT
# =============================================================================

sub vcl_deliver {
    # -------------------------------------------------------------------------
    # Response Headers
    # -------------------------------------------------------------------------
    
    # Standard CDN headers
    resp.http.X-Cache-Provider = "Fastly";
    resp.http.X-Cache = req.http.X-Cache-Status;
    resp.http.X-Cache-Hits = obj.hits;
    resp.http.X-Request-ID = req.http.Fastly-Request-ID;
    resp.http.X-Served-By = server.identity;
    resp.http.X-TTL = req.http.X-Cache-TTL ? req.http.X-Cache-TTL : "-";
    
    # Geographic information
    resp.http.X-Country = req.http.X-Country;
    resp.http.X-Region = req.http.X-Region;
    resp.http.X-POP = server.datacenter;
    resp.http.X-Geo-Priority = req.http.X-Geo-Cache-TTL ? "TTL:" + req.http.X-Geo-Cache-TTL : "default";
    
    # Timing information
    if (req.http.X-Request-Start) {
        declare local var.total_time FLOAT;
        set var.total_time = now.sec - std.real(req.http.X-Request-Start);
        resp.http.X-Response-Time = tostring(var.total_time) + "s";
    }
    
    # Security Headers
    resp.http.Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload";
    resp.http.X-Content-Type-Options = "nosniff";
    resp.http.X-Frame-Options = "SAMEORIGIN";
    resp.http.X-XSS-Protection = "1; mode=block";
    resp.http.Referrer-Policy = "strict-origin-when-cross-origin";
    resp.http.Permissions-Policy = "camera=(), microphone=(), geolocation=(self)";
    
    # CORS headers for API responses
    if (req.url.path ~ "^/api/") {
        resp.http.Access-Control-Allow-Origin = "https://algeriatrade.dz";
        resp.http.Access-Control-Allow-Methods = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
        resp.http.Access-Control-Allow-Headers = "Content-Type, Authorization, X-Requested-With, X-CSRF-Token";
        resp.http.Access-Control-Max-Age = "86400";
        resp.http.Expose-Headers = "X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining, X-Cache-Status";
    }
    
    # Rate limit headers (if available)
    if (req.http.X-RateLimit-Limit) {
        resp.http.X-RateLimit-Limit = req.http.X-RateLimit-Limit;
        resp.http.X-RateLimit-Remaining = req.http.X-RateLimit-Remaining;
        resp.http.X-RateLimit-Reset = req.http.X-RateLimit-Reset;
    }
    
    # Remove internal headers
    unset resp.http.X-Cacheable;
    unset resp.http.X-Origin-Server;
    unset resp.http.X-Fetch-Time;
    unset resp.http.X-Backend;
    unset resp.http.X-Preferred-Format;
    unset resp.http.X-Bot-Type;
    unset resp.http.X-Bypass-RateLimit;
    
    return (deliver);
}

# =============================================================================
# ERROR HANDLING
# =============================================================================

sub vcl_error {
    # -------------------------------------------------------------------------
    # Custom Error Responses
    # -------------------------------------------------------------------------
    
    # CORS preflight response
    if (obj.status == 204) {
        set obj.status = 204;
        set obj.response = "No Content";
        obj.http.Access-Control-Allow-Origin = "https://algeriatrade.dz";
        obj.http.Access-Control-Allow-Methods = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
        obj.http.Access-Control-Allow-Headers = "Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept-Language";
        obj.http.Access-Control-Max-Age = "86400";
        obj.http.Access-Control-Allow-Credentials = "true";
        return (deliver);
    }
    
    # Rate limited
    if (obj.status == 429) {
        set obj.status = 429;
        set obj.response = "Too Many Requests";
        synthetic {"{
    "error": "Too Many Requests",
    "message": "Rate limit exceeded. Please try again later.",
    "retryAfter": "} + obj.http.Retry-After + {""
}"};
        obj.http.Content-Type = "application/json";
        obj.http.Retry-After = obj.http.Retry-After ? obj.http.Retry-After : "60";
        return (deliver);
    }
    
    # Forbidden
    if (obj.status == 403) {
        set obj.status = 403;
        set obj.response = "Forbidden";
        synthetic {"<!DOCTYPE html>
<html lang="en">
<head><title>403 - Access Denied | AlgeriaTrade</title></head>
<body style="font-family: system-ui, sans-serif; text-align: center; padding: 50px;">
<h1>403 - Access Denied</h1>
<p>Your request has been blocked for security reasons.</p>
<p>If you believe this is an error, please contact support@algeriatrade.dz</p>
<p>Request ID: "} + req.http.Fastly-Request-Key + {"</p>
</body>
</html>"};
        obj.http.Content-Type = "text/html; charset=utf-8";
        return (deliver);
    }
    
    # Not Found
    if (obj.status == 404) {
        set obj.status = 404;
        set obj.response = "Not Found";
        synthetic {"<!DOCTYPE html>
<html lang="en">
<head><title>404 - Page Not Found | AlgeriaTrade</title></head>
<body style="font-family: system-ui, sans-serif; text-align: center; padding: 50px;">
<h1>404 - Page Not Found</h1>
<p>The page you are looking for does not exist.</p>
<a href="/">Return to Homepage</a>
</body>
</html>"};
        obj.http.Content-Type = "text/html; charset=utf-8";
        return (deliver);
    }
    
    # Server Errors - Try serving stale content first
    if (obj.status >= 500 && obj.status < 600) {
        set obj.status = 503;
        set obj.response = "Service Unavailable";
        synthetic {"<!DOCTYPE html>
<html lang="en">
<head><title>"} + obj.status + {" - Service Unavailable | AlgeriaTrade</title></head>
<body style="font-family: system-ui, sans-serif; text-align: center; padding: 50px;">
<h1>"} + obj.status + {" - Service Unavailable</h1>
<p>We're experiencing technical difficulties. Please try again shortly.</p>
<p>Our team has been notified.</p>
<p>Request ID: "} + req.http.Fastly-Request-Key + {"</p>
</body>
</html>"};
        obj.http.Content-Type = "text/html; charset=utf-8";
        return (deliver);
    }
    
    return (deliver);
}

# =============================================================================
# LOGGING
# =============================================================================

sub vcl_log {
    # Custom log format for analytics
    log "{" +
        '"timestamp":"' + now.sec + '",' +
        '"client_ip":"' + client.ip + '",' +
        '"country":"' + client.geo.country_code + '",' +
        '"city":"' + client.geo.city + '",' +
        '"asn":"' + client.geo.as_number + '",' +
        '"method":"' + req.request + '",' +
        '"url":"' + req.url.path + '",' +
        '"status":"' + resp.status + '",' +
        '"cache_status":"' + req.http.X-Cache-Status + '",' +
        '"cache_hits":"' + obj.hits + '",' +
        '"content_type":"' + resp.http.Content-Type + '",' +
        '"response_size":"' + resp.content_bytes + '",' +
        '"user_agent":"' + req.http.User-Agent + '",' +
        '"referer":"' + req.http.Referer + '",' +
        '"request_id":"' + req.http.Fastly-Request-ID + '",' +
        '"pop":"' + server.identity + '",' +
        '"backend":"' + req.backend + '",' +
        '"device_type":"' + req.http.X-Device-Type + '"' +
        "}";
}
