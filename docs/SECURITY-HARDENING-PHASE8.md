# AlgeriaTrade.dz Security Hardening Checklist - Phase 8

**Production Security Configuration Guide**
**Version:** 8.0.0
**Last Updated:** $(date +%Y-%m-%d)
**Classification:** Internal - Security Team

---

## Overview

This document provides a comprehensive security hardening checklist specifically for Phase 8 features of AlgeriaTrade.dz. Each item must be verified and signed off before production deployment.

### Phase 8 Security Scope

| Feature Area | Security Considerations | Risk Level |
|--------------|------------------------|------------|
| SATIM Integration | API key management, transaction signing | **CRITICAL** |
| Stripe Payments | Webhook security, PCI compliance scope | **CRITICAL** |
| Crypto Payments | Wallet security, key management | **CRITICAL** |
| DPA (Bank Guarantee) | Document authenticity, access control | HIGH |
| WebRTC Calls | TURN server authentication, media encryption | MEDIUM |
| ERP Connectors | Credential encryption, data validation | HIGH |
| Multi-Currency | Rate manipulation prevention | MEDIUM |
| Invoicing | Tax data protection, PDF security | MEDIUM |
| CRM Pipeline | Data access controls, PII handling | MEDIUM |
| Contracts | Digital signature verification, tamper-proofing | HIGH |
| AR Showroom | Model integrity, content validation | LOW |

---

## Security Hardening Checklist

### 1. SATIM API Security

- [ ] **1.1 SATIM API keys stored in secrets manager**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Implementation:**
  ```bash
  # Verify secrets are NOT in code or environment files
  grep -r "SATIM_API" .env* src/ 2>/dev/null && echo "FAIL: Keys found in code!" || echo "PASS"
  
  # Should be in AWS Secrets Manager, HashiCorp Vault, or equivalent
  aws secrets-manager get-secret-value --secret-id algeriatrade/prod/satim
  ```
  
  **Requirements:**
  - [ ] Keys accessible only to application service account
  - [ ] Audit logging enabled for all secret accesses
  - [ ] Automatic rotation configured (90-day max)
  - [ ] No hardcoded values in source control history

- [ ] **1.2 SATIM transaction request signing implemented**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Implementation:**
  ```typescript
  // All SATIM requests must include HMAC signature
  import crypto from 'crypto';

  function signSatimRequest(params: Record<string, string>, secret: string): string {
    const sortedParams = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
    return crypto.createHmac('sha256', secret).update(sortedParams).digest('hex');
  }
  ```
  
  **Verification:**
  ```bash
  # Test that unsigned requests are rejected
  curl -X POST https://algeriatrade.dz/api/payments/satim/init \
    -H "Content-Type: application/json" \
    -d '{"amount": 1000}' \
    | jq '.error // .status'
  # Expected: 401 Unauthorized or error about missing signature
  ```

- [ ] **1.3 SATIM callback URL validation (IP whitelist)**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Configuration:**
  ```typescript
  // CIB callback IP ranges (obtain from CIB documentation)
  const SATIM_ALLOWED_IPS = [
    '196.203.0.0/16',  // Example CIB network
    // Add all authorized CIB/SATIM IPs
  ];

  function validateCallbackIp(ip: string): boolean {
    return SATIM_ALLOWED_IPS.some(allowed => ipInCidr(ip, allowed));
  }
  ```

- [ ] **1.4 SATIM 3D Secure enforcement for amounts > threshold**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Thresholds:**
  - Domestic transactions (DZD): > 20,000 DZD requires 3DS
  - International transactions: > $50 USD requires 3DS
  - First-time buyers: Always require 3DS

---

### 2. Stripe Security

- [ ] **2.1 Stripe webhook signature verification enabled**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Implementation:**
  ```typescript
  import Stripe from 'stripe';
  
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
  });

  export async function verifyStripeWebhook(
    payload: string | Buffer,
    signature: string
  ): Promise<Stripe.Event> {
    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      throw new Error(`Invalid webhook signature: ${err.message}`);
    }
  }

  // Usage in webhook handler
  export async function POST(request: Request) {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature')!;
    
    let event: Stripe.Event;
    try {
      event = await verifyStripeWebhook(payload, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    
    // Process valid event...
  }
  ```

  **Test Command:**
  ```bash
  # Test with invalid signature (should fail)
  stripe trigger payment_intent.succeeded --add webhook_signature_header=invalid
  ```

- [ ] **2.2 Stripe webhook endpoint TLS and authentication**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Requirements:**
  - [ ] Endpoint uses HTTPS with valid certificate
  - [ ] Basic auth or bearer token required (additional layer)
  - [ ] Rate limiting applied (100 req/min per IP)
  - [ ] Request size limit (max 1MB)

- [ ] **2.3 PCI DSS scope minimization**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Checklist:**
  - [ ] Card data NEVER touches our servers (uses Stripe Elements/Hosted fields)
  - [ ] No card numbers logged anywhere
  - [ ] iframe isolation for payment forms
  - [ ] Content Security Policy prevents card data leakage
  - [ ] Regular PCI self-assessment completed (SAQ A)

  **Verify no card data exposure:**
  ```bash
  # Search for potential card number patterns in logs/code
  grep -rE "[0-9]{13,19}" /var/log/algeriatrade/ 2>/dev/null | head -5
  grep -rE "cardNumber|card_number|cvv|cvc" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
  ```

- [ ] **2.4 Stripe Radar fraud rules configured**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Recommended Rules:**
  ```
  Rule 1: Block if > 3 declined cards from same email in 1 hour
  Rule 2: Review if billing/shipping country mismatch (Algeria focus)
  Rule 3: Review if amount > 500,000 DZD for new accounts (< 7 days)
  Rule 4: Block known high-risk BIN ranges
  Rule 5: Require 3DS for all international cards
  ```

---

### 3. Cryptocurrency Security

- [ ] **3.1 Crypto wallet cold storage configured**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Architecture:**
  ```
  ┌─────────────────────────────────────────────────────┐
  │                  Cold Storage (Offline)              │
  │  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐ │
  │  │ Hardware│  │ Paper   │  │ Multisig (2-of-3)   │ │
  │  │ Wallet  │  │ Backup  │  │                     │ │
  │  │ (Trezor)│  │ (Enc.)  │  │ Director + Ops + CFO│ │
  │  └─────────┘  └─────────┘  └─────────────────────┘ │
  └──────────────────────────┬──────────────────────────┘
                             │ Settlement (daily)
  ┌──────────────────────────▼──────────────────────────┐
  │                Hot Wallet (Online)                   │
  │         Receiving addresses only (watch-only)        │
  └─────────────────────────────────────────────────────┘
  ```
  
  **Requirements:**
  - [ ] Hot wallet contains < 24 hours of expected volume
  - [ ] Automatic transfer to cold storage every 24 hours
  - [ ] Hot wallet private key encrypted at rest (AES-256)
  - [ ] Cold wallet accessed via air-gapped machine only
  - [ ] Recovery procedure documented and tested quarterly

- [ ] **3.2 Wallet address validation and whitelisting**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Implementation:**
  ```typescript
  import { validate } from 'bitcoin-address-validation';
  import { isAddress } from 'ethers';

  function validateCryptoAddress(address: string, currency: string): boolean {
    switch (currency.toLowerCase()) {
      case 'btc':
        return validate(address);
      case 'eth':
      case 'usdt_erc20':
        return isAddress(address);
      case 'usdt_trc20':
        return validateTronAddress(address); // T-address format
      default:
        return false;
    }
  }

  // Only allow deposits to OUR addresses (not withdrawals)
  const DEPOSIT_ADDRESSES = new Set([
    process.env.BTC_DEPOSIT_ADDRESS,
    process.env.ETH_DEPOSIT_ADDRESS,
    process.env.USDT_TRC20_DEPOSIT_ADDRESS,
  ]);

  function isOurDepositAddress(address: string): boolean {
    return DEPOSIT_ADDRESSES.has(address.toLowerCase());
  }
  ```

- [ ] **3.3 Confirmation threshold enforcement**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Minimum Confirmations:**
  | Currency | Minimum | High Value (>50k DZD) |
  |----------|---------|----------------------|
  | BTC | 3 confirmations (~30 min) | 6 confirmations |
  | ETH | 12 confirmations (~3 min) | 24 confirmations |
  | USDT (TRC20) | 20 confirmations (~3 min) | 40 confirmations |
  | USDT (ERC20) | 12 confirmations (~3 min) | 24 confirmations |

- [ ] **3.4 Exchange rate manipulation prevention**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Controls:**
  - [ ] Rates fetched from multiple sources (CoinGecko + CoinMarketCap)
  - [ ] Outlier detection (reject rates deviating > 2% from average)
  - [ ] Maximum rate change per update cycle (5% cap)
  - [ ] Manual override capability for extreme market conditions
  - [ ] Audit log for all rate updates

---

### 4. WebRTC / TURN Server Security

- [ ] **4.1 TURN server authentication enabled**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Configuration (coturn):**
  ```conf
  # /etc/turnserver.conf
  listening-port=3478
  tls-listening-port=5349

  # Authentication
  use-auth-secret
  static-auth-secret=${TURN_SHARED_SECRET}
  realm=algeriatrade.dz

  # Only allow long-term credentials
  lt-cred-mech

  # Limit usage
  user-quota=12
  total-quota=1200

  # Security headers
  response-origin-only-with-rfc5780

  # Disable CLI for security
  no-cli

  # Log
  log-file=/var/log/turnserver.log
  verbose
  ```

- [ ] **4.2 Credential generation with TTL**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Implementation:**
  ```typescript
  import crypto from 'crypto';

  interface TurnCredentials {
    username: string;
    credential: string;
    ttl: number;
  }

  function generateTurnCredentials(userId: string, ttlSeconds = 86400): TurnCredentials {
    const username = `${userId}:${Math.floor(Date.now() / 1000 + ttlSeconds)}`;
    const credential = crypto
      .createHmac('sha1', process.env.TURN_SHARED_SECRET!)
      .update(username)
      .digest('base64');
    
    return { username, credential, ttl: ttlSeconds };
  }
  ```

- [ ] **4.3 Media encryption enforced (DTLS-SRTP)**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **WebRTC Configuration:**
  ```typescript
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      {
        urls: 'turn:turn.algeriatrade.dz:3478',
        username: turnCredentials.username,
        credential: turnCredentials.credential,
      },
    ],
    // Force encryption
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    // Certificate
    certificates: [await RTCPeerConnection.generateCertificate({
      name: 'ECDSA',
      namedCurve: 'P-256',
    })],
  };
  ```

- [ ] **4.4 TURN server rate limiting**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Limits:**
  - Max sessions per user: 3 concurrent
  - Max session duration: 2 hours
  - Bandwidth per session: 5 Mbps up/down
  - Total bandwidth per user per day: 2 GB

---

### 5. ERP Connector Security

- [ ] **5.1 ERP connector credentials encrypted at rest**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Schema Design:**
  ```sql
  CREATE TABLE erp_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    integration_type VARCHAR(50) NOT NULL, -- 'sap', 'odoo', 'rest_api'
    
    -- Encrypted credentials (AES-256-GCM)
    credentials_encrypted BYTEA NOT NULL,
    credentials_iv BYTEA NOT NULL,
    credentials_tag BYTEA NOT NULL,
    
    -- Metadata (not sensitive)
    config JSONB DEFAULT '{}',
    last_sync_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Index for lookups
  CREATE INDEX idx_erp_integrations_company ON erp_integrations(company_id);
  ```

  **Encryption Implementation:**
  ```typescript
  import crypto from 'crypto';

  const ALGORITHM = 'aes-256-gcm';
  const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // Must be 32 bytes

  interface EncryptedData {
    encrypted: Buffer;
    iv: Buffer;
    tag: Buffer;
  }

  function encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return {
      encrypted,
      iv,
      tag: cipher.getAuthTag(),
    };
  }

  function decrypt(data: EncryptedData): string {
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, data.iv);
    decipher.setAuthTag(data.tag);
    
    let decrypted = decipher.update(data.encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  }
  ```

- [ ] **5.2 ERP webhook signature verification**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **For each ERP type:**
  ```typescript
  // Odoo webhook verification
  function verifyOdooWebhook(payload: string, signature: string, token: string): boolean {
    const expectedSig = crypto
      .createHmac('sha256', token)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  }

  // SAP OData CSRF protection
  function validateSapRequest(headers: Headers): boolean {
    const csrfToken = headers.get('x-csrf-token');
    const cookie = headers.get('cookie') || '';
    // Validate against session
    return validateCsrf(csrfToken, extractSessionCookie(cookie));
  }
  ```

- [ ] **5.3 ERP data sanitization on sync**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Sanitization Rules:**
  - [ ] Strip HTML/script tags from text fields
  - [ ] Validate numeric ranges (prices, quantities)
  - [ ] Truncate oversized fields to DB limits
  - [ ] Normalize encodings (UTF-8)
  - [ ] Remove PII unless explicitly mapped

---

### 6. API Security (All New Endpoints)

- [ ] **6.1 Rate limiting on all new endpoints**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Recommended Limits:**
  | Endpoint Category | Rate Limit | Burst |
  |------------------|------------|-------|
  | Payment initiation | 10/min | 3 |
  | Payment callback | 100/min | 20 |
  | Crypto deposit check | 30/min | 10 |
  | ERP sync trigger | 6/min | 2 |
  | AR model upload | 5/min | 2 |
  | Invoice generation | 20/min | 5 |
  | Negotiation offer | 30/min | 10 |
  | Contract creation | 10/min | 3 |
  | WebRTC signaling | 60/min | 20 |
  | Currency conversion | 120/min | 30 |
  | CRM query | 60/min | 20 |

  **Implementation (middleware):**
  ```typescript
  // src/lib/rate-limit.ts
  import Redis from 'ioredis';
  import { RateLimiterRedis } from 'rate-limiter-flexible';

  const redisClient = new Redis(process.env.REDIS_URL!);

  const rateLimiters = {
    paymentInit: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:payment_init',
      points: 10,
      duration: 60,
    }),
    // ... other limiters
  };

  export async function checkRateLimit(
    identifier: string,
    type: keyof typeof rateLimiters
  ): Promise<{ success: boolean; remaining: number }> {
    try {
      const result = await rateLimiters[type].consume(identifier);
      return { success: true, remaining: result.remainingPoints || 0 };
    } catch (rejRes: any) {
      return { 
        success: false, 
        remaining: rejRes.msBeforeNext ? 0 : 0 
      };
    }
  }
  ```

- [ ] **6.2 CORS configuration for new services**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Configuration:**
  ```typescript
  // next.config.ts or middleware
  const corsConfig = {
    // Main application
    origin: ['https://algeriatrade.dz', 'https://www.algeriatrade.dz'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-IDEMPOTENCY-Key',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
    
    // Additional origins for integrations
    additionalOrigins: {
      erp_webhooks: [], // Empty = server-side only
      payment_callbacks: [], // No CORS needed for webhooks
      ar_viewer: ['https://algeriatrade.dz'], // Same origin
    },
  };
  ```

- [ ] **6.3 Input validation on all endpoints**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Validation Library Setup:**
  ```typescript
  // src/lib/validation.ts
  import { z } from 'zod';

  // Payment schemas
  const satimPaymentSchema = z.object({
    amount: z.number().positive().max(10000000), // Max 10M DZD
    currency: z.enum(['DZD']),
    orderId: z.string().uuid(),
    returnUrl: z.url(),
    cancelUrl: z.url(),
    customerEmail: z.email().optional(),
    customerPhone: z.string().regex(/^[0-9+]{10,15}$/).optional(),
  });

  // ERP connection schema
  const erpConnectionSchema = z.object({
    type: z.enum(['sap', 'odoo', 'rest_api']),
    host: z.string().min(3).max(253), // Valid hostname
    port: z.number().int().min(1).max(65535).default(443),
    username: z.string().min(1).max(255),
    password: z.string().min(1).max(255), // Will be encrypted
    apiPath: z.string().startsWith('/').max(500),
  });

  // Export validators
  export const validators = {
    satimPayment: satimPaymentSchema,
    erpConnection: erpConnectionSchema,
    // ... more validators
  };
  ```

- [ ] **6.4 SQL Injection Prevention**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Verification:**
  ```bash
  # Run SQL injection test suite
  bun run test:security-sql-injection
  
  # Or manual test with sqlmap (authorized testing only!)
  # sqlmap -u "https://staging.algeriatrade.dz/api/products?id=1" --batch
  ```

  **Required Controls:**
  - [ ] All queries use parameterized bindings (Prisma ORM handles this)
  - [ ] No raw SQL without explicit security review
  - [ ] Input length limits on all string parameters
  - [ ] WAF rules for SQL injection patterns

---

### 7. Content Security Policy (CSP)

- [ ] **7.1 CSP headers updated for Phase 8 features**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Recommended CSP:**
  ```
  Content-Security-Policy: 
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https://*.algeriatrade.dz https://cdn.algeriatrade.dz https://*.stripe.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' 
      https://api.stripe.com 
      https://api.cib.dz 
      wss://signaling.algeriatrade.dz 
      wss://turn.algeriatrade.dz;
    frame-src https://js.stripe.com https://hooks.stripe.com;
    media-src 'self' blob:;
    worker-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  ```

- [ ] **7.2 Additional security headers**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Headers:**
  ```typescript
  // middleware.ts or next.config.ts
  const securityHeaders = {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(self), geolocation=()',
    'Cache-Control': 'no-store, no-cache, must-revalidate', // For sensitive pages
  };
  ```

---

### 8. DDoS Protection for Payment Endpoints

- [ ] **8.1 DDoS mitigation service active (Cloudflare/Akamai)**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Configuration:**
  ```
  Payment Endpoints Protection:
  - WAF Mode: Active (block known attacks)
  - Bot Fight Mode: Enabled
  - Rate Limiting Rules:
    * /api/payments/* : 50 req/10 sec per IP
    * /api/webhooks/* : 200 req/10 sec per IP (higher for providers)
  - Super Bot Fight Mode: Enabled
  - Challenge Passage: 30 minutes
  ```

- [ ] **8.2 Payment-specific DDoS rules**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Rules:**
  | Trigger | Action | Reason |
 ---------|--------|--------|
  > 100 req/sec to /payments JS Challenge | Challenge | Potential bot attack |
  Known bad User-Agent blocklist | Block | Automated tools |
  Country restriction (non-Algeria for SATIM) | Challenge | Geographic anomaly |
  > 5 failed payments same IP/hour | Rate Limit | Possible fraud |
  > 10 different cards same IP/day | Flag | Stolen card testing |

- [ ] **8.3 Circuit breaker pattern for external services**
  
  **Status:** ☐ Pending | ✅ Complete | ⚠️ At Risk
  
  **Implementation:**
  ```typescript
  // src/lib/circuit-breaker.ts
  enum CircuitState {
    CLOSED = 'closed',     // Normal operation
    OPEN = 'open',         // Failing, reject immediately
    HALF_OPEN = 'half-open', // Testing if recovered
  }

  class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount = 0;
    private lastFailureTime = 0;
    private successCount = 0;

    constructor(
      private name: string,
      private options = {
        failureThreshold: 5,
        resetTimeout: 30000, // 30 seconds
        halfOpenMaxAttempts: 3,
      }
    ) {}

    async execute<T>(fn: () => Promise<T>): Promise<T> {
      if (this.state === CircuitState.OPEN) {
        if (Date.now() - this.lastFailureTime > this.options.resetTimeout) {
          this.state = CircuitState.HALF_OPEN;
          this.successCount = 0;
        } else {
          throw new Error(`Circuit ${this.name} is open`);
        }
      }

      try {
        const result = await fn();
        this.onSuccess();
        return result;
      } catch (error) {
        this.onFailure();
        throw error;
      }
    }

    private onSuccess() {
      this.failureCount = 0;
      if (this.state === CircuitState.HALF_OPEN) {
        this.successCount++;
        if (this.successCount >= this.options.halfOpenMaxAttempts) {
          this.state = CircuitState.CLOSED;
        }
      }
    }

    private onFailure() {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.state === CircuitState.HALF_OPEN) {
        this.state = CircuitState.OPEN;
      } else if (this.failureCount >= this.options.failureThreshold) {
        this.state = CircuitState.OPEN;
      }
    }
  }

  // Create circuit breakers for critical services
  export const circuitBreakers = {
    satim: new CircuitBreaker('satim-payment'),
    stripe: new CircuitBreaker('stripe-api'),
    crypto: new CircuitBreaker('crypto-service'),
    erpSap: new CircuitBreaker('erp-sap'),
    erpOdoo: new CircuitBreaker('erp-odoo'),
  };
  ```

---

## Security Testing Requirements

### Pre-Deployment Security Tests

- [ ] **Automated Security Scanning**
  - [ ] npm audit (no HIGH or CRITICAL vulnerabilities)
  - [ ] SAST scan (SonarQube/Semgrep)
  - [ ] Dependency check (OWASP Dependency-Check)
  - [ ] Secrets scanning (git-secrets/trufflehog)

- [ ] **Dynamic Application Security Testing (DAST)**
  - [ ] OWASP ZAP baseline scan
  - [ ] Payment flow penetration testing
  - [ ] API fuzz testing for new endpoints

- [ ] **Manual Security Review**
  - [ ] Code review by security team member
  - [ ] Architecture threat modeling update
  - [ ] Data flow diagram for PII handling

### Security Test Commands

```bash
# Run automated security checks
bun run security:audit

# OWASP ZAP baseline scan
zap-cli quick-scan --self-contained https://staging.algeriatrade.dz

# Check for secrets in git history
trufflehog git file://. --only-verified

# Run Semgrep rules
semgrep --config auto src/
```

---

## Sign-off

### Security Deployment Approval

| Check Item | Verifier | Date | Status |
|------------|----------|------|--------|
| SATIM Security | | | ☐ |
| Stripe Security | | | ☐ |
| Crypto Security | | | ☐ |
| WebRTC Security | | | ☐ |
| ERP Connector Security | | | ☐ |
| API Security | | | ☐ |
| CSP & Headers | | | ☐ |
| DDoS Protection | | | ☐ |
| Security Tests Passed | | | ☐ |
| Penetration Test Approved | | | ☐ |

**Security Lead Signature:** _________________________ **Date:** ___________

**CTO Approval:** _________________________ **Date:** ___________

---

## Appendix: Quick Reference

### Environment Variables Security Matrix

| Variable | Type | Required | Rotation Frequency | Storage |
|----------|------|----------|-------------------|---------|
| `SATIM_API_KEY` | Secret | Yes | 90 days | Secrets Manager |
| `SATIM_API_SECRET` | Secret | Yes | 90 days | Secrets Manager |
| `STRIPE_SECRET_KEY` | Secret | Yes | Annual | Secrets Manager |
| `STRIPE_WEBHOOK_SECRET` | Secret | Yes | On compromise | Secrets Manager |
| `ENCRYPTION_KEY` | Key | Yes | Never (or migrate) | HSM/Secrets Manager |
| `TURN_SHARED_SECRET` | Secret | Yes | 90 days | Secrets Manager |
| `NEXTAUTH_SECRET` | Secret | Yes | On compromise | Secrets Manager |
| `CRYPTO_WALLET_HOT_KEY` | Private Key | Yes | 30 days | HSM |
| `CRYPTO_WALLET_COLD_KEY` | Private Key | Yes | Never | Offline/HSM |

### Incident Response Contacts

| Role | Name | Phone | Response SLA |
|------|------|-------|--------------|
| Security On-Call | | | 15 min |
| CISO | | | 1 hour |
| Legal Counsel | | | 4 hours |
| PR/Communications | | | 2 hours |

---

*This checklist must be completed and approved before any Phase 8 feature goes to production.*
