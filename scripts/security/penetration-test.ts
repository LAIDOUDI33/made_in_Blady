/**
 * AlgeriaTrade.dz - Security Penetration Testing Suite
 * 
 * Comprehensive automated penetration testing for:
 * - OWASP Top 10 vulnerabilities
 * - API endpoint security testing
 * - Authentication bypass attempts
 * - Injection attacks (SQL, XSS, NoSQL, Command)
 * - Rate limiting effectiveness
 * - CSRF protection validation
 * - Security header verification
 * 
 * @version 2.0.0
 * @security CRITICAL - Run in staging/development only
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';

// ===========================================
// Types & Interfaces
// ===========================================

export interface PenTestResult {
  testId: string;
  testName: string;
  category: SecurityCategory;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  status: 'passed' | 'failed' | 'warning' | 'error' | 'skipped';
  target: string;
  details: string;
  recommendation?: string;
  evidence?: string;
  timestamp: Date;
  durationMs: number;
}

export interface PenTestReport {
  meta: {
    runId: string;
    startTime: Date;
    endTime?: Date;
    totalDuration?: number;
    targetHost: string;
    testEnvironment: string;
    version: string;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    errors: number;
    skipped: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  results: PenTestResult[];
  endpoints: EndpointSecurityStatus[];
}

export interface EndpointSecurityStatus {
  path: string;
  method: string;
  authenticated: boolean;
  rateLimited: boolean;
  hasCSRFProtection: boolean;
  hasInputValidation: boolean;
  vulnerabilities: string[];
  lastTested: Date;
}

export type SecurityCategory = 
  | 'injection'
  | 'auth'
  | 'crypto'
  | 'access-control'
  | 'misconfiguration'
  | 'sensitive-data'
  | 'xss'
  | 'csrf'
  | 'rate-limiting'
  | 'headers'
  | 'api-security'
  | 'business-logic'
  | 'ddos';

export interface PenTestConfig {
  targetUrl: string;
  timeout?: number;
  maxConcurrent?: number;
  skipCategories?: SecurityCategory[];
  onlyCategories?: SecurityCategory[];
  customHeaders?: Record<string, string>;
  authCredentials?: {
    username: string;
    password: string;
  };
  rateLimitThreshold?: number; // Max requests before expecting 429
  outputFormat?: 'json' | 'html' | 'junit';
  outputFile?: string;
  verbose?: boolean;
  stopOnCritical?: boolean;
}

// ===========================================
// Default Configuration
// ===========================================

const DEFAULT_CONFIG: Required<Omit<PenTestConfig, 'skipCategories' | 'onlyCategories' | 'authCredentials'>> = {
  targetUrl: process.env.TARGET_URL || 'http://localhost:3000',
  timeout: 30000,
  maxConcurrent: 5,
  customHeaders: {
    'User-Agent': 'AlgeriaTrade-SecurityScanner/2.0',
  },
  rateLimitThreshold: 10,
  outputFormat: 'json',
  outputFile: `pentest-report-${new Date().toISOString().split('T')[0]}.json`,
  verbose: false,
  stopOnCritical: true,
};

// ===========================================
// Test Payloads (OWASP Based)
// ===========================================

const PAYLOADS = {
  // SQL Injection payloads
  sqli: [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "'; DROP TABLE users; --",
    "' UNION SELECT username,password FROM users --",
    "1' AND '1'='1",
    "admin'--",
    "' OR 1=1#",
    "1; EXEC xp_cmdshell('dir')--",
    "1' ORDER BY 1--",
    "1' HAVING 1=1--",
  ],

  // XSS payloads
  xss: [
    '<script>alert("XSS")</script>',
    '<img src=x onerror="alert(\'XSS\')">',
    '<svg onload="alert(\'XSS\')">',
    'javascript:alert("XSS")',
    '<body onload="alert(\'XSS\')">',
    '" onclick="alert(\'XSS\')"',
    '<iframe src="javascript:alert(\'XSS\')">',
    '${alert("XSS")}',
    '{{constructor.constructor("return this")()}}', // Prototype pollution
  ],

  // Path traversal payloads
  pathTraversal: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '....//....//....//etc/passwd',
    '%2e%2e%2fetc%2fpasswd',
    '..%252f..%252f..%252fetc%252fpasswd',
  ],

  // Command injection payloads
  commandInjection: [
    '; ls -la',
    '| cat /etc/passwd',
    '$(whoami)',
    '`id`',
    '; rm -rf /',
    '&& whoami',
    '|| whoami',
    '; sleep 5',
  ],

  // NoSQL injection payloads
  nosql: [
    '{"$gt": ""}',
    '{"$ne": null}',
    '{"$where": "true"}',
    '{"$regex": ".*"}',
    '{"$gt": undefined}',
  ],

  // SSRF payloads
  ssrf: [
    'http://localhost:3000',
    'http://127.0.0.1:22',
    'http://169.254.169.254/latest/meta-data/', // AWS metadata
    'http://[::1]:8080',
  ],
};

// ===========================================
// HTTP Client Utilities
// ===========================================

interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  durationMs: number;
}

async function makeRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
    followRedirects?: boolean;
  } = {}
): Promise<HttpResponse> {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const reqOptions: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        ...DEFAULT_CONFIG.customHeaders,
        ...options.headers,
        ...(options.body ? { 'Content-Length': Buffer.byteLength(options.body) } : {}),
      },
      timeout: options.timeout || DEFAULT_CONFIG.timeout,
    };

    const req = client.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          headers: res.headers as Record<string, string>,
          body: data,
          durationMs: Date.now() - startTime,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// ===========================================
// Test Runner Framework
// ===========================================

class PenTestRunner {
  private results: PenTestResult[] = [];
  private config: PenTestConfig;
  private runId: string;

  constructor(config: PenTestConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.runId = `pentest-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  async runAll(): Promise<PenTestReport> {
    const startTime = new Date();
    console.log(`🔒 Starting penetration test suite`);
    console.log(`   Target: ${this.config.targetUrl}`);
    console.log(`   Run ID: ${this.runId}`);

    try {
      // Run test categories in order of importance
      await this.runSecurityHeaderTests();
      await this.runRateLimitTests();
      await this.runAuthenticationTests();
      await this.runInjectionTests();
      await this.runXSSTests();
      await this.runCSRFTests();
      await this.runAccessControlTests();
      await this.runInformationDisclosureTests();
      await this.runAPISecurityTests();

      const endTime = new Date();
      
      const report: PenTestReport = {
        meta: {
          runId: this.runId,
          startTime,
          endTime,
          totalDuration: endTime.getTime() - startTime.getTime(),
          targetHost: this.config.targetUrl,
          testEnvironment: process.env.NODE_ENV || 'unknown',
          version: '2.0.0',
        },
        summary: this.calculateSummary(),
        results: this.results,
        endpoints: [],
      };

      // Save report
      if (this.config.outputFile) {
        const outputPath = path.resolve(this.config.outputFile);
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Report saved to: ${outputPath}`);
      }

      return report;
    } catch (error) {
      console.error('❌ Penetration test suite failed:', error);
      throw error;
    }
  }

  private calculateSummary() {
    const summary = {
      total: this.results.length,
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: 0,
      skipped: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    };

    for (const result of this.results) {
      switch (result.status) {
        case 'passed': summary.passed++; break;
        case 'failed': summary.failed++; break;
        case 'warning': summary.warnings++; break;
        case 'error': summary.errors++; break;
        case 'skipped': summary.skipped++; break;
      }

      switch (result.severity) {
        case 'critical': summary.criticalCount++; break;
        case 'high': summary.highCount++; break;
        case 'medium': summary.mediumCount++; break;
        case 'low': summary.lowCount++; break;
      }
    }

    return summary;
  }

  private addResult(result: Omit<PenTestResult, 'timestamp'>): void {
    const fullResult: PenTestResult = {
      ...result,
      timestamp: new Date(),
    };

    this.results.push(fullResult);

    const icon = {
      passed: '✅',
      failed: '❌',
      warning: '⚠️',
      error: '💥',
      skipped: '⏭️',
    }[fullResult.status];

    console.log(`${icon} [${fullResult.severity.toUpperCase()}] ${fullResult.testName}: ${fullResult.status}`);

    if (this.config.stopOnCritical && fullResult.status === 'failed' && fullResult.severity === 'critical') {
      console.error('\n🚨 CRITICAL VULNERABILITY DETECTED! Stopping tests.');
      process.exit(1);
    }
  }

  // ===========================================
  // Test Categories
  // ===========================================

  private async runSecurityHeaderTests(): Promise<void> {
    console.log('\n📋 Testing Security Headers...');

    try {
      const response = await makeRequest(this.config.targetUrl);

      // Test security headers
      const securityHeaders = {
        'Strict-Transport-Security': {
          present: response.headers['strict-transport-security'],
          recommendation: 'Add HSTS header with max-age of at least 31536000 and includeSubDomains',
        },
        'X-Content-Type-Options': {
          present: response.headers['x-content-type-options'],
          recommendation: 'Set X-Content-Type-Options to nosniff',
        },
        'X-Frame-Options': {
          present: response.headers['x-frame-options'],
          recommendation: 'Set X-Frame-Options to DENY or SAMEORIGIN',
        },
        'X-XSS-Protection': {
          present: response.headers['x-xss-protection'],
          recommendation: 'Enable X-XSS-Protection with mode=block',
        },
        'Content-Security-Policy': {
          present: response.headers['content-security-policy'],
          recommendation: 'Implement a strict Content-Security-Policy',
        },
        'Referrer-Policy': {
          present: response.headers['referrer-policy'],
          recommendation: 'Set Referrer-Policy to strict-origin-when-cross-origin or stricter',
        },
        'Permissions-Policy': {
          present: response.headers['permissions-policy'],
          recommendation: 'Implement Permissions-Policy for feature control',
        },
        'Cache-Control': {
          present: response.headers['cache-control']?.includes('no-store'),
          recommendation: 'Set Cache-Control to no-store for sensitive pages',
        },
      };

      for (const [header, config] of Object.entries(securityHeaders)) {
        this.addResult({
          testId: `header-${header.toLowerCase().replace(/-/g, '-')}`,
          testName: `${header} Header Present`,
          category: 'headers',
          severity: config.present ? 'info' : 'medium',
          status: config.present ? 'passed' : 'warning',
          target: this.config.targetUrl,
          details: config.present ? `Header found: ${config.present}` : `Missing security header`,
          recommendation: config.recommendation,
        });
      }

      // Check for information disclosure in Server header
      const serverHeader = response.headers['server'];
      if (serverHeader && serverHeader.length > 20) {
        this.addResult({
          testId: 'header-server-info-disclosure',
          testName: 'Server Information Disclosure',
          category: 'information-disclosure',
          severity: 'low',
          status: 'warning',
          target: this.config.targetUrl,
          details: `Server header reveals: ${serverHeader}`,
          recommendation: 'Minimize Server header information',
          evidence: serverHeader,
        });
      } else {
        this.addResult({
          testId: 'header-server-info-disclosure',
          testName: 'Server Information Disclosure',
          category: 'information-disclosure',
          severity: 'info',
          status: 'passed',
          target: this.config.targetUrl,
          details: 'Server header is minimal or not present',
        });
      }

    } catch (error) {
      this.addResult({
        testId: 'header-test-error',
        testName: 'Security Headers Test Error',
        category: 'headers',
        severity: 'medium',
        status: 'error',
        target: this.config.targetUrl,
        details: `Failed to fetch headers: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  private async runRateLimitTests(): Promise<void> {
    console.log('\n⚡ Testing Rate Limiting...');

    const endpointsToTest = [
      { path: '/api/auth/login', method: 'POST', threshold: 5 },
      { path: '/api/search', method: 'GET', threshold: 30 },
      { path: '/api/products', method: 'GET', threshold: 100 },
    ];

    for (const endpoint of endpointsToTest) {
      try {
        const url = `${this.config.targetUrl}${endpoint.path}`;
        let rateLimited = false;
        let requestCount = 0;
        const maxRequests = endpoint.threshold + 3;

        for (let i = 0; i < maxRequests; i++) {
          const body = endpoint.method === 'POST' ? JSON.stringify({ email: 'test@test.com', password: 'test123' }) : undefined;
          
          const response = await makeRequest(url, {
            method: endpoint.method,
            headers: body ? { 'Content-Type': 'application/json' } : {},
            body,
            timeout: 5000,
          });

          requestCount++;

          if (response.status === 429) {
            rateLimited = true;
            
            this.addResult({
              testId: `ratelimit-${endpoint.path.replace(/\//g, '-')}`,
              testName: `Rate Limiting on ${endpoint.method} ${endpoint.path}`,
              category: 'rate-limiting',
              severity: 'info',
              status: 'passed',
              target: url,
              details: `Rate limit triggered after ${requestCount} requests`,
              evidence: `Status: ${response.status}, Headers: ${JSON.stringify(response.headers)}`,
            });
            break;
          }
        }

        if (!rateLimited) {
          this.addResult({
            testId: `ratelimit-${endpoint.path.replace(/\//g, '-')}`,
            testName: `Rate Limiting on ${endpoint.method} ${endpoint.path}`,
            category: 'rate-limiting',
            severity: 'high',
            status: 'failed',
            target: url,
            details: `No rate limiting detected after ${requestCount} requests`,
            recommendation: 'Implement rate limiting on all authentication and API endpoints',
          });
        }

      } catch (error) {
        this.addResult({
          testId: `ratelimit-${endpoint.path.replace(/\//g, '-')}-error`,
          testName: `Rate Limit Test Error for ${endpoint.path}`,
          category: 'rate-limiting',
          severity: 'low',
          status: 'error',
          target: `${this.config.targetUrl}${endpoint.path}`,
          details: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }
  }

  private async runAuthenticationTests(): Promise<void> {
    console.log('\n🔐 Testing Authentication Security...');

    // Test 1: Login with invalid credentials (should not reveal user existence)
    try {
      const loginUrl = `${this.config.targetUrl}/api/auth/login`;
      
      // Test with non-existent user
      const nonexistentResponse = await makeRequest(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent12345@example.com', password: 'wrongpassword' }),
      });

      // Test with valid format but wrong password (if we had a real user)
      const wrongPassResponse = await makeRequest(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@algeriatrade.dz', password: 'wrongpassword' }),
      });

      // Check if responses are identical (they should be)
      const responsesDiffer = 
        nonexistentResponse.status !== wrongPassResponse.status ||
        nonexistentResponse.body.includes('not exist') ||
        nonexistentResponse.body.includes('not found');

      this.addResult({
        testId: 'auth-user-enumeration',
        testName: 'User Enumeration Prevention',
        category: 'auth',
        severity: responsesDiffer ? 'high' : 'info',
        status: responsesDiffer ? 'failed' : 'passed',
        target: loginUrl,
        details: responsesDiffer 
          ? 'Responses differ between existing/non-existing users (possible enumeration)'
          : 'Login responses are consistent (good)',
        recommendation: responsesDiffer 
          ? 'Return generic error messages for both invalid user and invalid password'
          : undefined,
      });

    } catch (error) {
      // Login endpoint might not exist or have different structure
      this.addResult({
        testId: 'auth-user-enumeration',
        testName: 'User Enumeration Prevention',
        category: 'auth',
        severity: 'low',
        status: 'skipped',
        target: `${this.config.targetUrl}/api/auth/login`,
        details: 'Could not test login endpoint',
      });
    }

    // Test 2: Password strength requirements check
    this.addResult({
      testId: 'auth-password-policy',
      testName: 'Password Policy Enforcement',
      category: 'auth',
      severity: 'medium',
      status: 'info', // Manual verification needed
      target: this.config.targetUrl,
      details: 'Verify that passwords require: min 8 chars, uppercase, lowercase, numbers, special chars',
      recommendation: 'Enforce strong password policy with minimum complexity requirements',
    });

    // Test 3: Account lockout after failed attempts
    try {
      const loginUrl = `${this.config.targetUrl}/api/auth/login`;
      let lockedOut = false;

      for (let i = 0; i < 12; i++) {
        const response = await makeRequest(loginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: `lockout-test-${i}@example.com`, 
            password: 'wrongpassword' 
          }),
          timeout: 3000,
        });

        // Look for account lockout indicators
        if (
          response.status === 423 || // Locked
          response.body.toLowerCase().includes('locked') ||
          response.body.toLowerCase().includes('temporarily disabled')
        ) {
          lockedOut = true;
          break;
        }
      }

      this.addResult({
        testId: 'auth-account-lockout',
        testName: 'Account Lockout Mechanism',
        category: 'auth',
        severity: lockedOut ? 'info' : 'high',
        status: lockedOut ? 'passed' : 'failed',
        target: loginUrl,
        details: lockedOut 
          ? 'Account locks out after multiple failed attempts'
          : 'No account lockout detected after 12 failed attempts',
        recommendation: !lockedOut 
          ? 'Implement account lockout after 5-10 failed login attempts'
          : undefined,
      });

    } catch (error) {
      this.addResult({
        testId: 'auth-account-lockout',
        testName: 'Account Lockout Mechanism',
        category: 'auth',
        severity: 'low',
        status: 'skipped',
        target: `${this.config.targetUrl}/api/auth/login`,
        details: 'Could not test account lockout',
      });
    }

    // Test 4: Session management
    this.addResult({
      testId: 'auth-session-management',
      testName: 'Secure Session Management',
      category: 'auth',
      severity: 'medium',
      status: 'info', // Requires manual verification
      target: this.config.targetUrl,
      details: 'Verify sessions: HttpOnly cookies, Secure flag, SameSite attribute, proper expiration',
      recommendation: 'Ensure session cookies have all security flags set correctly',
    });
  }

  private async runInjectionTests(): Promise<void> {
    console.log('\n💉 Testing Injection Vulnerabilities...');

    // SQL Injection Tests
    const searchEndpoint = `${this.config.targetUrl}/api/search?q=`;
    
    for (const payload of PAYLOADS.sqli.slice(0, 3)) { // Test first 3 payloads
      try {
        const encodedPayload = encodeURIComponent(payload);
        const response = await makeRequest(`${searchEndpoint}${encodedPayload}`, {
          timeout: 10000,
        });

        // Check for SQL error messages or anomalous behavior
        const sqlErrorIndicators = [
          'sql syntax', 'mysql', 'postgresql', 'oracle', 'sqlite',
          'unclosed quotation', 'sql state', 'odbc', 'jdbc',
          'query failed', 'database error', 'syntax error',
        ];

        const hasSQLError = sqlErrorIndicators.some(indicator =>
          response.body.toLowerCase().includes(indicator)
        );

        const unusualBehavior = response.status === 500 && response.body.length < 200;

        if (hasSQLError || unusualBehavior) {
          this.addResult({
            testId: `sqli-${payload.substring(0, 20).replace(/[^a-z0-9]/gi, '')}`,
            testName: `SQL Injection: ${payload.substring(0, 30)}...`,
            category: 'injection',
            severity: 'critical',
            status: 'failed',
            target: `${searchEndpoint}${encodedPayload}`,
            details: 'Potential SQL injection vulnerability detected',
            evidence: `Status: ${response.status}, Body snippet: ${response.body.substring(0, 200)}`,
            recommendation: 'Use parameterized queries/prepared statements for all database operations',
          });
        }
      } catch (error) {
        // Continue testing other payloads
      }
    }

    // Command Injection Tests
    const apiEndpoints = [
      '/api/search',
      '/api/products',
    ];

    for (const endpoint of apiEndpoints) {
      for (const payload of PAYLOADS.commandInjection.slice(0, 2)) {
        try {
          const url = `${this.config.targetUrl}${endpoint}?q=${encodeURIComponent(payload)}`;
          const startTime = Date.now();
          
          const response = await makeRequest(url, { timeout: 15000 });
          const responseTime = Date.now() - startTime;

          // Time-based detection (sleep command would cause delay)
          if (responseTime > 10000) {
            this.addResult({
              testId: `cmdi-${Date.now()}`,
              testName: `Command Injection: ${payload}`,
              category: 'injection',
              severity: 'critical',
              status: 'failed',
              target: url,
              details: `Slow response (${responseTime}ms) suggests command execution`,
              recommendation: 'Validate and sanitize all user inputs; avoid system calls with user data',
            });
          }
        } catch (error) {
          // Continue
        }
      }
    }

    // NoSQL Injection Tests (if MongoDB backend suspected)
    this.addResult({
      testId: 'nosql-injection-check',
      testName: 'NoSQL Injection Resistance',
      category: 'injection',
      severity: 'medium',
      status: 'info', // Manual code review needed
      target: this.config.targetUrl,
      details: 'Review code for NoSQL injection vulnerabilities in query construction',
      recommendation: 'Use Mongoose schemas/ODM validation; sanitize object query inputs',
    });
  }

  private async runXSSTests(): Promise<void> {
    console.log('\n🎯 Testing XSS Vulnerabilities...');

    const vulnerableParams = ['q', 'search', 'query', 'term', 'name', 'message'];

    for (const param of vulnerableParams) {
      for (const payload of PAYLOADS.xss.slice(0, 3)) {
        try {
          const url = `${this.config.targetUrl}/api/search?${param}=${encodeURIComponent(payload)}`;
          const response = await makeRequest(url);

          // Check if payload is reflected without encoding
          const escapedPayload = payload.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const reflectedInBody = new RegExp(escapedPayload, 'i').test(response.body);
          const reflectedInJSON = response.body.includes(payload);

          if (reflectedInBody || reflectedInJSON) {
            this.addResult({
              testId: `xss-${param}-${Date.now()}`,
              testName: `XSS in parameter: ${param}`,
              category: 'xss',
              severity: 'high',
              status: 'failed',
              target: url,
              details: 'XSS payload reflected in response without proper encoding',
              evidence: `Payload: ${payload.substring(0, 50)}`,
              recommendation: 'Encode all user input before rendering; implement CSP headers',
            });
          }
        } catch (error) {
          // Continue testing
        }
      }
    }

    // DOM-based XSS check
    this.addResult({
      testId: 'dom-xss-check',
      testName: 'DOM-Based XSS Prevention',
      category: 'xss',
      severity: 'medium',
      status: 'info',
      target: this.config.targetUrl,
      details: 'Review JavaScript for unsafe use of innerHTML, eval(), document.write()',
      recommendation: 'Use textContent instead of innerHTML; implement DOMPurify sanitization',
    });
  }

  private async runCSRFTests(): Promise<void> {
    console.log('\n🛡️ Testing CSRF Protection...');

    try {
      // Try POST request without CSRF token
      const formUrl = `${this.config.targetUrl}/api/auth/login`;
      
      const responseWithoutToken = await makeRequest(formUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'email=test@test.com&password=test123',
      });

      // Check for CSRF token requirement
      const csrfProtected = 
        responseWithoutToken.status === 403 ||
        responseWithoutToken.body.toLowerCase().includes('csrf') ||
        responseWithoutToken.body.toLowerCase().includes('token') ||
        responseWithoutToken.body.toLowerCase().includes('invalid origin');

      this.addResult({
        testId: 'csrf-protection',
        testName: 'CSRF Token Protection',
        category: 'csrf',
        severity: csrfProtected ? 'info' : 'high',
        status: csrfProtected ? 'passed' : 'failed',
        target: formUrl,
        details: csrfProtected 
          ? 'CSRF protection appears to be implemented'
          : 'No CSRF protection detected on form submission',
        recommendation: !csrfProtected 
          ? 'Implement CSRF tokens for all state-changing requests; validate Origin/Referer headers'
          : undefined,
      });

    } catch (error) {
      this.addResult({
        testId: 'csrf-protection',
        testName: 'CSRF Token Protection',
        category: 'csrf',
        severity: 'low',
        status: 'skipped',
        target: this.config.targetUrl,
        details: 'Could not test CSRF protection',
      });
    }

    // Check SameSite cookie attribute
    this.addResult({
      testId: 'csrf-samesite-cookies',
      testName: 'SameSite Cookie Attribute',
      category: 'csrf',
      severity: 'medium',
      status: 'info',
      target: this.config.targetUrl,
      details: 'Verify that session cookies have SameSite=Strict or Lax attribute',
      recommendation: 'Set SameSite attribute on all session cookies',
    });
  }

  private async runAccessControlTests(): Promise<void> {
    console.log('\n🚪 Testing Access Control...');

    // Test IDOR (Insecure Direct Object Reference)
    const idorEndpoints = [
      { path: '/api/users/1', method: 'GET' },
      { path: '/api/orders/1', method: 'GET' },
      { path: '/api/admin/users', method: 'GET' },
    ];

    for (const endpoint of idorEndpoints) {
      try {
        const url = `${this.config.targetUrl}${endpoint.path}`;
        const response = await makeRequest(url, {
          method: endpoint.method,
          timeout: 10000,
        });

        // Unauthorized access to admin/private resources
        if (response.status === 200 && endpoint.path.includes('/admin')) {
          this.addResult({
            testId: `idor-${endpoint.path.replace(/\//g, '-')}`,
            testName: `Broken Access Control: ${endpoint.path}`,
            category: 'access-control',
            severity: 'critical',
            status: 'failed',
            target: url,
            details: 'Admin endpoint accessible without authentication',
            recommendation: 'Implement proper authorization checks on all admin/sensitive endpoints',
          });
        } else if (response.status === 401 || response.status === 403) {
          this.addResult({
            testId: `idor-${endpoint.path.replace(/\//g, '-')}`,
            testName: `Access Control: ${endpoint.path}`,
            category: 'access-control',
            severity: 'info',
            status: 'passed',
            target: url,
            details: 'Properly requires authentication/authorization',
          });
        }
      } catch (error) {
        // Continue
      }
    }

    // Directory traversal prevention
    for (const payload of PAYLOADS.pathTraversal.slice(0, 2)) {
      try {
        const url = `${this.config.targetUrl}/api/files?path=${encodeURIComponent(payload)}`;
        const response = await makeRequest(url, { timeout: 5000 });

        if (response.status === 200 && response.body.includes('root:')) {
          this.addResult({
            testId: `path-traversal-${Date.now()}`,
            testName: `Path Traversal: ${payload}`,
            category: 'access-control',
            severity: 'critical',
            status: 'failed',
            target: url,
            details: 'Path traversal vulnerability allows file read',
            evidence: response.body.substring(0, 200),
            recommendation: 'Validate file paths; use allowlists; never concatenate user input directly',
          });
        }
      } catch (error) {
        // Continue
      }
    }
  }

  private async runInformationDisclosureTests(): Promise<void> {
    console.log('\n🔍 Testing Information Disclosure...');

    // Test common sensitive paths
    const sensitivePaths = [
      '/.env',
      '/.git/config',
      '/.svn/entries',
      '/web.config',
      '/package.json',
      '/composer.json',
      '/server-status',
      '/phpinfo.php',
      '/debug',
      '/api/debug',
      '/health',
      '/api/status',
      '/swagger.json',
      '/api-docs',
    ];

    for (const sensitivePath of sensitivePaths) {
      try {
        const url = `${this.config.targetUrl}${sensitivePath}`;
        const response = await makeRequest(url, { timeout: 5000 });

        // Check if sensitive info was exposed
        const shouldNotExpose = 
          (sensitivePath.includes('.env') && response.body.includes('=')) ||
          (sensitivePath.includes('.git') && response.body.includes('git')) ||
          (sensitivePath.includes('swagger') && response.status === 200) ||
          (sensitivePath.includes('status') && response.body.includes('version'));

        if (shouldNotExpose && response.status !== 404) {
          this.addResult({
            testId: `info-disclosure-${sensitivePath.replace(/\//g, '-').replace(/^-/, '')}`,
            testName: `Information Disclosure: ${sensitivePath}`,
            category: 'misconfiguration',
            severity: sensitivePath.includes('.env') ? 'critical' : 'medium',
            status: 'failed',
            target: url,
            details: `Sensitive path accessible: ${sensitivePath}`,
            evidence: response.body.substring(0, 150),
            recommendation: `Block access to ${sensitivePath}; remove from production builds`,
          });
        }
      } catch (error) {
        // Continue
      }
    }

    // Check for stack traces in error responses
    try {
      const url = `${this.config.targetUrl}/api/nonexistent-endpoint-12345`;
      const response = await makeRequest(url, { timeout: 5000 });

      const stackTraceIndicators = [
        'stack trace', 'exception', 'error in', 'at line',
        'node_modules', '.ts:', '.js:', 'internal/',
      ];

      const hasStackTrace = stackTraceIndicators.some(indicator =>
        response.body.toLowerCase().includes(indicator)
      );

      if (hasStackTrace) {
        this.addResult({
          testId: 'stack-trace-disclosure',
          testName: 'Stack Trace Disclosure',
          category: 'information-disclosure',
          severity: 'medium',
          status: 'failed',
          target: url,
          details: 'Error response contains stack trace information',
          evidence: response.body.substring(0, 250),
          recommendation: 'Implement custom error pages; disable detailed errors in production',
        });
      }
    } catch (error) {
      // Continue
    }
  }

  private async runAPISecurityTests(): Promise<void> {
    console.log('\n🔌 Testing API Security...');

    // Test HTTP methods
    const methodsToTest = ['OPTIONS', 'PUT', 'DELETE', 'PATCH', 'TRACE'];
    
    for (const method of methodsToTest) {
      try {
        const response = await makeRequest(this.config.targetUrl, {
          method,
          timeout: 5000,
        });

        // TRACE method can enable XST attacks
        if (method === 'TRACE' && response.status === 200) {
          this.addResult({
            testId: 'http-trace-enabled',
            testName: 'HTTP TRACE Method Enabled',
            category: 'api-security',
            severity: 'medium',
            status: 'failed',
            target: this.config.targetUrl,
            details: 'TRACE method is enabled, potentially allowing cross-site tracing (XST)',
            recommendation: 'Disable HTTP TRACE method on web server',
          });
        }

        // OPTIONS should show allowed methods properly
        if (method === 'OPTIONS') {
          const allowHeader = response.headers['allow'];
          if (!allowHeader) {
            this.addResult({
              testId: 'options-header-missing',
              testName: 'OPTIONS Response Missing Allow Header',
              category: 'api-security',
              severity: 'low',
              status: 'warning',
              target: this.config.targetUrl,
              details: 'OPTIONS response does not include Allow header',
              recommendation: 'Properly implement CORS preflight handling',
            });
          }
        }
      } catch (error) {
        // Continue
      }
    }

    // Test API versioning consistency
    this.addResult({
      testId: 'api-versioning',
      testName: 'API Versioning Consistency',
      category: 'api-security',
      severity: 'low',
      status: 'info',
      target: this.config.targetUrl,
      details: 'Verify consistent API versioning across all endpoints',
      recommendation: 'Implement proper API versioning (e.g., /api/v1/, /api/v2/)',
    });

    // Test request size limits
    try {
      const largeBody = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const response = await makeRequest(`${this.config.targetUrl}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: largeBody }),
        timeout: 15000,
      });

      if (response.status === 413) {
        this.addResult({
          testId: 'request-size-limit',
          testName: 'Request Size Limit Enforced',
          category: 'api-security',
          severity: 'info',
          status: 'passed',
          target: this.config.targetUrl,
          details: 'Server rejects oversized requests (413 Payload Too Large)',
        });
      } else if (response.status === 200) {
        this.addResult({
          testId: 'request-size-limit',
          testName: 'Request Size Limit Not Enforced',
          category: 'api-security',
          severity: 'medium',
          status: 'warning',
          target: this.config.targetUrl,
          details: 'Server accepted very large request body',
          recommendation: 'Implement request size limits to prevent DoS attacks',
        });
      }
    } catch (error) {
      // Timeout might indicate size limit working
    }
  }
}

// ===========================================
// CLI Interface
// ===========================================

async function main() {
  const args = process.argv.slice(2);
  
  const config: PenTestConfig = {
    targetUrl: args.find(a => a.startsWith('--target='))?.split('=')[1] || DEFAULT_CONFIG.targetUrl,
    outputFormat: (args.find(a => a.startsWith('--format='))?.split('=')[1] as any) || DEFAULT_CONFIG.outputFormat,
    outputFile: args.find(a => a.startsWith('--output='))?.split('=')[1],
    verbose: args.includes('--verbose'),
    stopOnCritical: !args.includes('--no-stop-on-critical'),
  };

  const runner = new PenTestRunner(config);
  
  try {
    const report = await runner.runAll();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 PENETRATION TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Target:         ${report.meta.targetHost}`);
    console.log(`Duration:       ${report.meta.totalDuration}ms`);
    console.log(`Run ID:         ${report.meta.runId}`);
    console.log('-'.repeat(60));
    console.log(`Total Tests:    ${report.summary.total}`);
    console.log(`✅ Passed:      ${report.summary.passed}`);
    console.log(`❌ Failed:      ${report.summary.failed}`);
    console.log(`⚠️  Warnings:    ${report.summary.warnings}`);
    console.log(`💥 Errors:      ${report.summary.errors}`);
    console.log(`⏭️  Skipped:     ${report.summary.skipped}`);
    console.log('-'.repeat(60));
    console.log(`🔴 Critical:    ${report.summary.criticalCount}`);
    console.log(`🟠 High:        ${report.summary.highCount}`);
    console.log(`🟡 Medium:      ${report.summary.mediumCount}`);
    console.log(`🟢 Low:         ${report.summary.lowCount}`);
    console.log('='.repeat(60));

    // Exit with appropriate code
    const hasCriticalOrHigh = report.summary.criticalCount > 0 || report.summary.highCount > 0;
    process.exit(hasCriticalOrHigh ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Penetration test failed:', error);
    process.exit(2);
  }
}

// Export for programmatic usage
export { PenTestRunner };

// Run if called directly
if (require.main === module) {
  main();
}
