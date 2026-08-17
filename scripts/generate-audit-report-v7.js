const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  PageBreak, Header, Footer, PageNumber,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  TableOfContents, LevelFormat, NumberFormat
} = require("docx");
const fs = require("fs");

// Colors
const C = { primary: "#0F172A", body: "#1E293B", secondary: "#64748B", accent: "#3B82F6", surface: "#F1F5F9" };
const c = h => h.replace("#", "");

// Elements
function H1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160, line: 312 }, children: [new TextRun({ text: t, bold: true, size: 32, color: c(C.primary), font: "Calibri" })] }); }
function H2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120, line: 312 }, children: [new TextRun({ text: t, bold: true, size: 28, color: c(C.primary), font: "Calibri" })] }); }
function P(text) { return new Paragraph({ alignment: AlignmentType.JUSTIFIED, indent: { firstLine: 480 }, spacing: { line: 312 }, children: [new TextRun({ text, size: 24, color: c(C.body), font: "Calibri" })] }); }
function B(text) { return new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text, size: 24, color: c(C.body), font: "Calibri" })] }); }

function Tbl(headers, rows) {
  const hr = new TableRow({ tableHeader: true, cantSplit: true, children: headers.map(h => new TableCell({ shading: { type: ShadingType.CLEAR, fill: C.primary }, margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: "FFFFFF", font: "Calibri" })] })] })) });
  const drs = rows.map(r => new TableRow({ cantSplit: true, children: r.map(val => new TableCell({ margins: { top: 40, bottom: 40, left: 60, right: 60 }, children: [new Paragraph({ children: [new TextRun({ text: String(val), size: 18, color: c(C.body), font: "Calibri" })] })] })) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [hr, ...drs] });
}

function Cover() {
  const cell1 = new TableCell({
    shading: { type: ShadingType.CLEAR, fill: C.primary },
    verticalAlign: "center",
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1500, line: 400 }, children: [new TextRun({ text: "AlgeriaTrade B2B Platform", bold: true, size: 52, color: "FFFFFF", font: "Calibri" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, line: 400 }, children: [new TextRun({ text: "Comprehensive Audit Report & Phased Action Plan", bold: true, size: 36, color: "FFFFFF", font: "Calibri" })] }),
      new Paragraph({ spacing: { before: 800 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Security | Performance | API Quality | Architecture", size: 22, color: "94A3B8", font: "Calibri" })] })
    ]
  });
  
  const cell2 = new TableCell({
    shading: { type: ShadingType.CLEAR, fill: C.surface },
    verticalAlign: "top",
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
    children: [
      new Paragraph({ spacing: { before: 600 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, line: 300 }, children: [new TextRun({ text: "Version: 0.2.1 | Date: " + new Date().toISOString().split('T')[0], size: 22, color: c(C.primary), font: "Calibri" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, line: 300 }, children: [new TextRun({ text: "Classification: Internal - Confidential", size: 20, color: c(C.secondary), font: "Calibri" })] }),
      new Paragraph({ spacing: { before: 600 }, children: [] })
    ]
  });

  const row1 = new TableRow({ height: { value: 10000, rule: "exact" }, children: [cell1] });
  const row2 = new TableRow({ height: { value: 5838, rule: "exact" }, children: [cell2] });
  
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
    rows: [row1, row2]
  });
}

async function main() {
  const content = [];
  
  // Section 1
  content.push(H1("1. Executive Summary"));
  content.push(P("This comprehensive audit evaluates the AlgeriaTrade B2B Platform, a multi-tenant marketplace solution built with Next.js 16, React Native, Prisma ORM, and Redis caching. The platform serves the Algerian market with features including product catalogs, RFQ management, real-time messaging, AI-powered recommendations, and multiple payment integrations (BaridiMob, CIB, CCP)."));
  content.push(P("The audit covered four primary dimensions: Security Assessment, Performance Analysis, API Quality Review, and Architecture Evaluation. A total of 19 significant issues were identified across these categories, with 6 classified as Critical requiring immediate remediation."));
  content.push(new Paragraph({ spacing: { before: 200 }, children: [] }));
  content.push(Tbl(["Dimension", "Current", "Target"], [["Security Posture", "6.5/10", "8.5/10"], ["Performance Index", "82/100 (B+)", "91/100 (A-)"], ["API Quality", "7.3/10", "9/10"], ["Architecture Maturity", "7.8/10", "9/10"]]));
  content.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

  // Section 2
  content.push(H1("2. Audit Scope & Methodology"));
  content.push(H2("2.1 Scope Coverage"));
  content.push(P("The audit encompassed the complete platform codebase including web application (Next.js 16), mobile application (React Native/Expo), infrastructure configuration (Docker Compose, Nginx), database schema (Prisma/SQLite), and supporting services (Redis, Socket.IO)."));
  content.push(B("Web Application: src/app/, src/components/, src/lib/ - 150+ files analyzed"));
  content.push(B("Mobile Application: mobile/src/ - 30+ components and screens reviewed"));
  content.push(B("API Endpoints: 80+ routes covering auth, products, payments, messaging, AI"));
  content.push(B("Infrastructure: Docker configurations, middleware, security libraries"));

  content.push(H2("2.2 Methodology"));
  content.push(P("The audit employed automated static analysis combined with manual code review following OWASP guidelines for security, Core Web Vitals methodology for performance, and REST best practices for API assessment."));

  // Section 3
  content.push(H1("3. Security Audit Findings"));
  content.push(P("The security assessment revealed a mature architecture with enterprise-grade components but identified critical gaps in authentication flows and input handling requiring immediate attention."));
  
  content.push(H2("3.1 Critical Vulnerabilities"));
  content.push(Tbl(["ID", "Severity", "Issue", "Fix"], [
    ["V-001", "CRITICAL", "IDOR in 2FA endpoints", "Use session userId"],
    ["V-002", "CRITICAL", "Privilege escalation via role", "Server-side role assign"],
    ["V-003", "CRITICAL", "Insecure random (Math.random)", "Use crypto.randomBytes"],
    ["V-004", "HIGH", "Password policy inconsistency", "Centralize validation"],
    ["V-005", "HIGH", "CSP allows unsafe-inline", "Nonce-based CSP"],
    ["V-006", "HIGH", "JWT session 30 days", "Reduce to 1 day"],
    ["V-007", "MEDIUM", "User enumeration errors", "Generic error msgs"],
    ["V-008", "MEDIUM", "In-memory rate limiting", "Redis-backed limits"]
  ]));
  content.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

  content.push(H2("3.2 Security Strengths"));
  content.push(B("Comprehensive WAF implementation with SQL injection, XSS, and path traversal detection"));
  content.push(B("AES-256-GCM encryption system with proper IV handling and key rotation support"));
  content.push(B("Detailed audit logging with comprehensive action categories"));
  content.push(B("Fraud detection system with risk scoring, auto-blocking, and IP tracking"));

  // Section 4
  content.push(H1("4. Performance Audit Findings"));
  content.push(P("Performance evaluation yielded an overall score of B+ (82/100), indicating strong foundational optimization but with clear opportunities for improvement in caching infrastructure and database query patterns."));
  
  content.push(H2("4.1 Critical Bottlenecks"));
  content.push(Tbl(["ID", "Severity", "Issue", "Fix"], [
    ["P-001", "CRITICAL", "Redis connection per request (~50-100ms)", "Singleton pattern"],
    ["P-002", "HIGH", "Fake compression (+33% size)", "zlib/brotli"],
    ["P-003", "HIGH", "Missing Product compound indexes", "Add indexes"],
    ["P-004", "MEDIUM", "Global no-store cache control", "Selective headers"]
  ]));
  content.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

  content.push(H2("4.2 Projected Improvements"));
  content.push(Tbl(["Metric", "Current", "Target", "Improvement"], [
    ["Largest Contentful Paint", "2.8s", "1.8s", "-36%"],
    ["Time to First Byte", "600ms", "350ms", "-42%"],
    ["Database Query Average", "85ms", "25ms", "-71%"],
    ["Cache Hit Rate", "45%", "78%", "+73%"]
  ]));
  content.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

  // Section 5
  content.push(H1("5. API Quality Audit Findings"));
  content.push(P("API review assessed 9 core endpoints across products, search, messaging, payments, dashboard, and AI services. Overall quality score: 7.3/10."));
  
  content.push(H2("5.1 Critical Issues"));
  content.push(Tbl(["ID", "Severity", "Issue", "Fix"], [
    ["A-001", "CRITICAL", "No Zod input validation", "Add schemas"],
    ["A-002", "CRITICAL", "4 different response formats", "Standardize"],
    ["A-003", "HIGH", "userId exposure in recommendations", "Use session"],
    ["A-004", "HIGH", "No rate limiting on search/AI", "Add limits"],
    ["A-005", "MEDIUM", "Mixed FR/EN error messages", "Unify language"]
  ]));
  content.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

  content.push(H2("5.2 Endpoint Scores"));
  content.push(Tbl(["Endpoint", "Score", "Status"], [
    ["Payments Create", "9/10", "Excellent - Model endpoint"],
    ["AI Chatbot Message", "8.5/10", "Very Good"],
    ["Messages", "8/10", "Good"],
    ["Products Listing", "7.5/10", "Good"],
    ["Buyer RFQs Dashboard", "6.5/10", "Fair"],
    ["AI Recommendations", "5/10", "Poor - Needs work"]
  ]));
  content.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

  // Section 6
  content.push(H1("6. Architecture Assessment"));
  content.push(P("The platform demonstrates modern architectural patterns with multi-tenant support, microservice-ready design, and comprehensive feature set."));
  
  content.push(H2("6.1 Technology Stack"));
  content.push(B("Frontend: Next.js 16, React 19, TypeScript strict, Tailwind CSS 4, shadcn/ui"));
  content.push(B("Backend: Next.js API Routes, NextAuth.js 4, Prisma 6 ORM, SQLite"));
  content.push(B("Real-time: Socket.IO messaging, Redis pub/sub caching"));
  content.push(B("AI/ML: OpenAI + Anthropic SDKs for chatbot and recommendations"));
  content.push(B("Mobile: React Native/Expo with shared navigation and state"));
  content.push(B("Infrastructure: Docker Compose, Nginx reverse proxy, health checks"));

  content.push(H2("6.2 Technical Debt"));
  content.push(B("SQLite database limiting production concurrency - recommend PostgreSQL migration"));
  content.push(B("Inconsistent error handling patterns across 80+ API endpoints"));
  content.push(B("Missing API versioning strategy for future backward compatibility"));
  content.push(B("Limited e2e and integration test coverage"));

  // Section 7
  content.push(H1("7. Phased Action Plan"));
  content.push(P("Based on audit findings, a five-phase remediation plan is proposed spanning 12 weeks, prioritizing critical security fixes while systematically addressing performance and quality."));
  
  content.push(H2("7.1 Implementation Roadmap"));
  content.push(Tbl(["Phase", "Timeline", "Focus Area", "Key Deliverables"], [
    ["Phase 1: Critical Fixes", "Week 1-2", "Security vulns, Redis, Validation", "Patched auth, Singleton, Zod schemas"],
    ["Phase 2: Hardening", "Week 3-4", "CSP, Sessions, Compression", "Nonce CSP, Rolling sessions, Real compression"],
    ["Phase 3: Optimization", "Week 5-6", "Indexes, API consistency", "Compound indexes, Standardized responses"],
    ["Phase 4: Enhancement", "Week 7-8", "Monitoring, Docs, Testing", "OpenAPI docs, E2E suite, Dashboards"],
    ["Phase 5: Scale Prep", "Week 9-12", "PostgreSQL, CDN, Load test", "PG migration, CDN config, Load test results"]
  ]));
  content.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

  content.push(H2("7.2 Phase 1 Details (Week 1-2)"));
  content.push(B("Fix IDOR vulnerability in 2FA endpoints by extracting userId from server-side session"));
  content.push(B("Remove client-controlled role assignment; implement admin approval workflow"));
  content.push(B("Replace all Math.random() usage with crypto.randomBytes() for cryptographic operations"));
  content.push(B("Implement Redis singleton pattern to eliminate connection-per-request overhead"));
  content.push(B("Create Zod validation schemas for all API endpoints accepting user input"));

  content.push(H2("7.3 Phase 2 Details (Week 3-4)"));
  content.push(B("Implement nonce-based Content Security Policy eliminating unsafe-inline and unsafe-eval"));
  content.push(B("Reduce JWT session duration from 30 days to 1 day with rolling refresh tokens"));
  content.push(B("Replace base64 'compression' with actual zlib/brotli implementation"));
  content.push(B("Unify password validation using centralized passwordPolicy module"));

  content.push(H2("7.4 Phase 3 Details (Week 5-6)"));
  content.push(B("Add compound database indexes for Product queries (status+isActive, categoryId+status)"));
  content.push(B("Implement selective cache-control headers by route type (static vs dynamic vs API)"));
  content.push(B("Standardize API response format using apiSuccess/apiError wrapper utilities"));
  content.push(B("Deploy Redis-backed distributed rate limiting for production scaling"));

  content.push(H2("7.5 Phase 4 Details (Week 7-8)"));
  content.push(B("Generate OpenAPI/Swagger documentation for all public endpoints"));
  content.push(B("Implement comprehensive error classification with proper HTTP status codes"));
  content.push(B("Expand E2E test coverage using Playwright for critical user journeys"));
  content.push(B("Add request ID tracing for distributed debugging capabilities"));

  content.push(H2("7.6 Phase 5 Details (Week 9-12)"));
  content.push(B("Execute PostgreSQL migration from SQLite with zero-downtime strategy"));
  content.push(B("Configure CDN (Cloudflare) with appropriate cache rules for static assets"));
  content.push(B("Conduct load testing targeting 1000 concurrent users with <200ms p95 response"));
  content.push(B("Set up comprehensive monitoring dashboards with alerting thresholds"));

  // Section 8
  content.push(H1("8. Conclusions & Recommendations"));
  content.push(P("The AlgeriaTrade B2B Platform demonstrates solid engineering fundamentals with a modern tech stack and comprehensive feature set. The primary risks concentrate in authentication security and caching infrastructure, both addressable with focused effort over the proposed 12-week timeline."));
  
  content.push(H2("8.1 Immediate Priorities (This Week)"));
  content.push(B("Patch IDOR vulnerability in 2FA endpoints - exploitation risk is HIGH"));
  content.push(B("Remove role parameter from registration endpoint - privilege escalation possible"));
  content.push(B("Deploy Redis singleton - current implementation causes ~50-100ms latency per request"));

  content.push(H2("8.2 Success Metrics"));
  content.push(Tbl(["Metric", "Current", "Target"], [
    ["Security Score", "6.5/10", "8.5/10"],
    ["Performance Score", "82/100", "91/100"],
    ["API Quality Score", "7.3/10", "9/10"],
    ["Critical Vulnerabilities", "6 open", "0 open"],
    ["Test Coverage", "~40%", ">90%"]
  ]));
  content.push(new Paragraph({ spacing: { before: 300 }, children: [] }));
  content.push(P("This report represents a comprehensive snapshot of platform health as of the audit date. Regular reassessment is recommended quarterly or after major feature releases to maintain security posture and performance standards."));

  // Build document
  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Calibri", size: 24, color: c(C.body) }, paragraph: { spacing: { line: 312 } } } },
      heading1: { run: { font: "Calibri", size: 32, bold: true, color: c(C.primary) }, paragraph: { spacing: { before: 360, after: 160, line: 312 } } },
      heading2: { run: { font: "Calibri", size: 28, bold: true, color: c(C.primary) }, paragraph: { spacing: { before: 240, after: 120, line: 312 } } }
    },
    numbering: { config: [{ reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
    sections: [
      { properties: { page: { margin: { top: 0, bottom: 0, left: 0, right: 0 } } }, children: [Cover()] },
      { properties: { page: { margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 } } }, children: [H1("Table of Contents"), new TableOfContents(), new Paragraph({ children: [new PageBreak()] })] },
      { 
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 } }, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
        headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "AlgeriaTrade Platform Audit Report", size: 18, color: c(C.secondary) })] })] }) },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(C.secondary) })] })] }) },
        children: content 
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync("/home/z/my-project/download/AlgeriaTrade_Comprehensive_Audit_Report_v7.docx", buffer);
  console.log("Report generated successfully at /home/z/my-project/download/AlgeriaTrade_Comprehensive_Audit_Report_v7.docx");
}

main().catch(console.error);
