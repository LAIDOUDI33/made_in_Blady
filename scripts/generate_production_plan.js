const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, AlignmentType, HeadingLevel, WidthType,
  BorderStyle, ShadingType, LevelFormat
} = require("docx");
const fs = require("fs");

// Palette - Professional project plan theme
const P = {
  primary: "#1E3A5F",    // Deep navy blue
  body: "#2D3748",       // Dark gray for body text
  secondary: "#718096",  // Medium gray
  accent: "#38A169",     // Green for success/phases
  warning: "#DD6B20",    // Orange for risks/warnings
  surface: "#F7FAFC",   // Light background
};

const c = (hex) => hex.replace("#", "");

// Font constants
const F = {
  heading: { ascii: "Calibri", eastAsia: "SimHei" },
  body: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
};

// Helper functions
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200, line: 312 },
    children: [new TextRun({ text, bold: true, color: c(P.primary), font: F.heading, size: 32 })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, color: c(P.primary), font: F.heading, size: 28 })],
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, color: c(P.body), font: F.heading, size: 24 })],
  });
}

function bodyPara(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312, after: 120 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: F.body })],
  });
}

function bodyParaNoIndent(text) {
  return new Paragraph({
    spacing: { line: 312, after: 100 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: F.body })],
  });
}

function accentBox(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200, line: 312 },
    shading: { type: ShadingType.CLEAR, fill: P.surface },
    children: [new TextRun({ text, bold: true, size: 26, color: c(P.primary), font: F.heading })],
  });
}

// Phase data
const phases = [
  {
    phase: "Phase 1",
    name: "Foundation & MVP",
    duration: "Months 1-3",
    budget: "$45,000-65,000",
    status: "Critical Path",
    objectives: ["Core platform infrastructure", "Basic product catalog (10 categories)", "User authentication (FR/AR)", "Supplier registration", "Basic search functionality"],
    deliverables: ["Production server setup", "Database architecture", "Authentication system", "Product CRUD operations", "Basic UI/UX (responsive)", "Admin panel v1"],
    techStack: ["Next.js 14/React", "Node.js/Express", "PostgreSQL", "Redis (caching)", "AWS/Azure hosting", "Docker containers"],
  },
  {
    phase: "Phase 2",
    name: "Core Trading Features",
    duration: "Months 4-6",
    budget: "$55,000-80,000",
    status: "High Priority",
    objectives: ["RFQ (Request for Quotation) system", "Messaging system", "Supplier verification workflow", "Product categories expansion (28+)", "Basic analytics dashboard"],
    deliverables: ["RFQ form & workflow", "Real-time messaging", "Document upload system", "Verification badges", "Search with filters", "Email notifications"],
    techStack: ["Socket.io (real-time)", "AWS S3 (files)", "Elasticsearch (search)", "SendGrid/Mailgun", "WebSocket integration"],
  },
  {
    phase: "Phase 3",
    name: "Transaction & Trust System",
    duration: "Months 7-9",
    budget: "$70,000-95,000",
    status: "High Priority",
    objectives: ["Secure payment integration", "Escrow system", "Algerian payment methods (CIB, CCP)", "Order management", "Dispute resolution"],
    deliverables: ["Payment gateway integration", "Escrow account system", "CIB card processing", "CCP bank transfer", "Order tracking system", "Review/rating system"],
    techStack: ["Stripe/Payment API", "Encryption (AES-256)", "Audit logging", "Webhooks handling", "PDF generation"],
  },
  {
    phase: "Phase 4",
    name: "Logistics & Localization",
    duration: "Months 10-12",
    budget: "$60,000-85,000",
    status: "Medium Priority",
    objectives: ["Algerian port integrations", "Customs documentation tools", "Shipping calculator", "Multi-currency (DZD/USD/EUR)", "Advanced localization"],
    deliverables: ["Port API integrations", "HS code lookup tool", "Duty calculator", "Shipping tracking", "Wilaya-based delivery", "Full FR/AR interface"],
    techStack: ["Shipping APIs (DHL/FedEx)", "Currency conversion APIs", "Geolocation services", "i18n framework", "Rate limiters"],
  },
  {
    phase: "Phase 5",
    name: "Growth & Scale",
    duration: "Months 13-18",
    budget: "$80,000-120,000",
    status: "Strategic",
    objectives: ["Mobile apps (iOS/Android)", "Advanced AI recommendations", "Marketing automation", "API for partners", "Advanced analytics"],
    deliverables: ["React Native mobile app", "AI sourcing engine", "Marketing automation", "Public API portal", "Business intelligence", "Affiliate program"],
    techStack: ["React Native", "Python/TensorFlow (AI)", "Apache Kafka", "GraphQL API", "Tableau/PowerBI"],
  },
];

const teamStructure = [
  { role: "Project Manager", count: "1", phase: "All", responsibility: "Overall coordination, timeline, stakeholder management" },
  { role: "Tech Lead/Architect", count: "1", phase: "All", responsibility: "System design, code review, technical decisions" },
  { role: "Full-stack Developers", count: "3-4", phase: "1-5", responsibility: "Frontend/backend development, API creation" },
  { role: "UI/UX Designer", count: "1-2", phase: "1-4", responsibility: "Interface design, user flows, usability testing" },
  { role: "DevOps Engineer", count: "1", phase: "1-5", responsibility: "Infrastructure, CI/CD, security, scaling" },
  { role: "QA Engineer", count: "1-2", phase: "2-5", responsibility: "Testing strategy, automation, quality assurance" },
  { role: "Content Manager (FR/AR)", count: "1", phase: "2-5", responsibility: "Bilingual content, translations, copywriting" },
  { role: "Security Specialist", count: "0.5", phase: "3-4", responsibility: "Payment security, compliance, penetration testing" },
];

const risks = [
  { risk: "Payment Integration Complexity", probability: "High", impact: "High", mitigation: "Early engagement with Algerian banks; fallback to manual verification Phase 1" },
  { risk: "Regulatory Compliance Changes", probability: "Medium", impact: "High", mitigation: "Legal counsel on retainer; modular compliance layer for quick updates" },
  { risk: "Talent Acquisition (Algeria)", probability: "Medium", impact: "Medium", mitigation: "Remote team option; partnership with Algerian universities; competitive packages" },
  { risk: "Supplier Adoption Resistance", probability: "Medium", impact: "Medium", mitigation: "Free tier for early adopters; onboarding support; success stories marketing" },
  { risk: "Infrastructure Reliability", probability: "Low", impact: "High", mitigation: "Multi-region backup; CDN implementation; 99.9% uptime SLA with provider" },
  { risk: "Currency Exchange Volatility", probability: "Medium", impact: "Medium", mitigation: "Real-time rate updates; DZD-focused pricing; hedging strategies" },
];

const kpis = [
  { metric: "Registered Suppliers", "Month 3": "50+", "Month 6": "200+", "Month 12": "500+", "Month 18": "1500+" },
  { metric: "Active Buyers", "Month 3": "100+", "Month 6": "500+", "Month 12": "2000+", "Month 18": "5000+" },
  { metric: "Listed Products", "Month 3": "1,000+", "Month 6": "10,000+", "Month 12": "50,000+", "Month 18": "200,000+" },
  { metric: "RFQs Completed", "Month 3": "50/mo", "Month 6": "300/mo", "Month 12": "1500/mo", "Month 18": "5000/mo" },
  { metric: "Transaction Volume", "Month 3": "N/A", "Month 6": "$100K/mo", "Month 12": "$1M/mo", "Month 18": "$5M/mo" },
  { metric: "Platform Uptime", "Month 3": "99%", "Month 6": "99.5%", "Month 12": "99.9%", "Month 18": "99.95%" },
];

// Create table helper functions
function createPhasesTable() {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      createHeaderCell("Phase", 15),
      createHeaderCell("Name & Duration", 20),
      createHeaderCell("Budget Range", 15),
      createHeaderCell("Key Objectives", 35),
      createHeaderCell("Status", 15),
    ],
  });

  const dataRows = phases.map(phase => new TableRow({
    cantSplit: true,
    children: [
      createDataCell(phase.phase, 15),
      createDataCell(`${phase.name}\n${phase.duration}`, 20),
      createDataCell(phase.budget, 15),
      createDataCell(phase.objectives.slice(0, 3).join("\n"), 35),
      createStatusCell(phase.status, 15),
    ],
  }));

  return [headerRow, ...dataRows];
}

function createTeamTable() {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      createHeaderCell("Role", 25),
      createHeaderCell("Count", 10),
      createHeaderCell("Phases", 15),
      createHeaderCell("Primary Responsibilities", 50),
    ],
  });

  const dataRows = teamStructure.map(member => new TableRow({
    cantSplit: true,
    children: [
      createDataCell(member.role, 25),
      createDataCell(member.count, 10, true),
      createDataCell(member.phase, 15),
      createDataCell(member.responsibility, 50),
    ],
  }));

  return [headerRow, ...dataRows];
}

function createRisksTable() {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      createHeaderCell("Risk Factor", 25),
      createHeaderCell("Probability", 12),
      createHeaderCell("Impact", 12),
      createHeaderCell("Mitigation Strategy", 51),
    ],
  });

  const dataRows = risks.map(risk => new TableRow({
    cantSplit: true,
    children: [
      createDataCell(risk.risk, 25),
      createRiskCell(risk.probability, 12),
      createRiskCell(risk.impact, 12),
      createDataCell(risk.mitigation, 51),
    ],
  }));

  return [headerRow, ...dataRows];
}

function createKPITable() {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      createHeaderCell("Key Metric", 30),
      createHeaderCell("Month 3", 17),
      createHeaderCell("Month 6", 17),
      createHeaderCell("Month 12", 18),
      createHeaderCell("Month 18", 18),
    ],
  });

  const dataRows = kpis.map(kpi => new TableRow({
    cantSplit: true,
    children: [
      createDataCell(kpi.metric, 30),
      createDataCell(kpi["Month 3"], 17, true),
      createDataCell(kpi["Month 6"], 17, true),
      createDataCell(kpi["Month 12"], 18, true),
      createDataCell(kpi["Month 18"], 18, true),
    ],
  }));

  return [headerRow, ...dataRows];
}

function createHeaderCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: P.primary },
    children: [new Paragraph({ 
      children: [new TextRun({ text, bold: true, size: 21, color: "FFFFFF", font: F.body })] 
    })],
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
  });
}

function createDataCell(text, width, center = false) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ 
      alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text, size: 20, font: F.body })] 
    })],
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

function createStatusCell(text, width) {
  const color = text === "Critical Path" ? c(P.warning) : 
                text === "High Priority" ? c(P.accent) : c(P.secondary);
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ 
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, size: 20, color, font: F.body })] 
    })],
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

function createRiskCell(text, width) {
  const color = text === "High" ? c(P.warning) : 
                text === "Medium" ? c(P.secondary) : c(P.accent);
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ 
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, size: 20, color, font: F.body })] 
    })],
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

// Create the document
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: F.body, size: 24, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
    },
    heading1: {
      run: { font: F.heading, size: 32, bold: true, color: c(P.primary) },
      paragraph: { spacing: { before: 400, after: 200, line: 312 } },
    },
    heading2: {
      run: { font: F.heading, size: 28, bold: true, color: c(P.primary) },
      paragraph: { spacing: { before: 300, after: 160, line: 312 } },
    },
    heading3: {
      run: { font: F.heading, size: 24, bold: true, color: c(P.body) },
      paragraph: { spacing: { before: 240, after: 120, line: 312 } },
    },
  },
  sections: [
    // Cover Section
    {
      properties: {
        page: { margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { 
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, 
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, 
            insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } 
          },
          rows: [
            new TableRow({
              height: { value: 16838, rule: "exact" },
              children: [
                new TableCell({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.primary },
                  verticalAlign: "center",
                  children: [
                    new Paragraph({ spacing: { before: 1500 } }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { line: 828, lineRule: "atLeast" },
                      children: [new TextRun({ text: "ALGERIATRADE.DZ", bold: true, size: 64, color: "FFFFFF", font: F.heading })],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 200, line: 400 },
                      children: [new TextRun({ text: "PRODUCTION PLATFORM", size: 40, color: "#E2E8F0", font: F.heading })],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 100, line: 400 },
                      children: [new TextRun({ text: "PHASED IMPLEMENTATION PLAN", size: 32, color: "#CBD5E0", font: F.body })],
                    }),
                    new Paragraph({ spacing: { before: 800 } }),
                    new Table({
                      width: { size: 60, type: WidthType.PERCENTAGE },
                      alignment: AlignmentType.CENTER,
                      borders: { 
                        top: { style: BorderStyle.SINGLE, size: 1, color: "#4A5568" },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: "#4A5568" },
                        left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                        insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }
                      },
                      rows: [
                        new TableRow({
                          children: [
                            new TableCell({
                              width: { size: 100, type: WidthType.PERCENTAGE },
                              shading: { type: ShadingType.CLEAR, fill: "FFFFFF" },
                              children: [
                                new Paragraph({ 
                                  alignment: AlignmentType.CENTER, 
                                  spacing: { before: 150, after: 150 },
                                  children: [
                                    new TextRun({ text: "Total Duration: 18 Months | Total Investment: $310K - $445K", size: 22, color: "#E2E8F0", font: F.body })
                                  ] 
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    new Paragraph({ spacing: { before: 600 } }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "Prepared: August 2026 | Version 1.0 | Confidential", size: 18, italics: true, color: "#A0AEC0", font: F.body })],
                    }),
                    new Paragraph({ spacing: { before: 1000 } }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    },
    // Main Content
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "AlgeriaTrade.dz - Production Plan", size: 18, color: c(P.secondary), font: F.body })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })],
          })],
        }),
      },
      children: [
        // EXECUTIVE SUMMARY
        heading1("Executive Summary"),
        
        accentBox("B2B E-Commerce Platform for the Algerian Market | 18-Month Roadmap to Production"),
        
        bodyPara("This production plan outlines a comprehensive five-phase approach to building AlgeriaTrade.dz, a B2B e-commerce platform specifically designed for the Algerian market. Drawing inspiration from established platforms like Made-in-China.com while addressing the unique requirements of North African trade dynamics, this plan delivers a fully functional, scalable platform within 18 months with an estimated total investment of $310,000 to $445,000."),
        
        bodyPara("The phased approach prioritizes rapid time-to-market through a Minimum Viable Product (MVP) strategy while building toward a feature-complete platform capable of handling thousands of concurrent users and millions in monthly transaction volume. Each phase delivers tangible business value while establishing the foundation for subsequent enhancements, ensuring continuous stakeholder engagement and revenue generation opportunities throughout the development lifecycle."),
        
        bodyPara("Key differentiators of this platform include native French/Arabic bilingual support, integration with Algerian banking systems (CIB cards, CCP payments), logistics optimization for major Algerian ports (Algiers, Oran, Skikda, Annaba), and compliance with local regulatory frameworks including customs procedures and commercial registry validation. The technical architecture emphasizes security, scalability, and maintainability using modern web technologies with containerized deployment pipelines."),
        
        heading2("Strategic Objectives"),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: [
                createHeaderCell("Objective", 35),
                createHeaderCell("Target Metric", 25),
                createHeaderCell("Timeline", 20),
                createHeaderCell("Priority", 20),
              ],
            }),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Establish market presence as leading Algerian B2B platform", 35),
              createDataCell("#1 in Algeria by transaction volume", 25),
              createDataCell("Month 18", 20),
              createStatusCell("Critical", 20),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Build verified supplier network across key industries", 35),
              createDataCell("1,500+ verified suppliers", 25),
              createDataCell("Month 18", 20),
              createStatusCell("Critical", 20),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Achieve sustainable revenue from commission/subscription model", 35),
              createDataCell("$5M+ monthly GMV", 25),
              createDataCell("Month 18", 20),
              createStatusCell("High", 20),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Deliver seamless bilingual user experience (French/Arabic)", 35),
              createDataCell("<2s page load, 99.9% uptime", 25),
              createDataCell("Month 12", 20),
              createStatusCell("High", 20),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Integrate with Algerian financial and logistics ecosystem", 35),
              createDataCell("5+ payment methods, all major ports", 25),
              createDataCell("Month 12", 20),
              createStatusCell("High", 20),
            ]}),
          ],
        }),
        
        new Paragraph({ spacing: { before: 300 } }),
        
        // PHASE BREAKDOWN
        heading1("Phase-by-Phase Implementation Plan"),
        
        bodyPara("The following detailed breakdown presents each development phase with specific objectives, deliverables, resource requirements, and success criteria. This phased approach allows for iterative development, continuous feedback incorporation, and risk mitigation through incremental value delivery. Each phase builds upon the previous one while maintaining clear scope boundaries to prevent scope creep and ensure on-time delivery."),
        
        // PHASES TABLE
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          rows: createPhasesTable(),
        }),
        
        new Paragraph({ spacing: { before: 300 } }),
        
        // PHASE 1 DETAIL
        heading2("Phase 1: Foundation & MVP (Months 1-3)"),
        accentBox("Budget: $45,000-$65,000 | Status: CRITICAL PATH | Team: 6-8 people"),
        
        heading3("Phase 1 Objectives"),
        bodyPara("The foundation phase establishes the core technical infrastructure and delivers a functional MVP suitable for initial user testing and market validation. This phase focuses on proving the concept with real users while building the architectural foundation that will support future scale. The MVP will include essential features that demonstrate value to both buyers and sellers without the complexity of full transaction capabilities."),
        
        bodyPara("Primary objectives include deploying a production-ready cloud infrastructure with appropriate security measures, implementing a robust authentication system supporting both French and Arabic interfaces, creating the initial product catalog covering the ten highest-demand categories for Algerian importers, and developing supplier registration workflows that include basic verification checks against Algerian commercial registries."),
        
        heading3("Technical Architecture Decisions"),
        bodyPara("Frontend Architecture: Next.js 14 with React 18 for server-side rendering optimization, critical for SEO performance in a competitive B2B market. TypeScript throughout for type safety and developer productivity. Tailwind CSS for responsive design ensuring mobile-first approach given high mobile usage rates in Algeria. Internationalization (i18n) framework from day one to support seamless French/Arabic switching."),
        
        bodyPara("Backend Architecture: Node.js with Express.js for RESTful API development, chosen for JavaScript full-stack consistency and available talent pool in North Africa. PostgreSQL as primary database for complex queries and relational data integrity requirements. Redis for session management, caching frequently accessed product data, and rate limiting. Docker containerization from development through production for environment consistency."),
        
        bodyPara("Infrastructure: AWS (or Azure) as primary cloud provider with multi-AZ deployment for high availability. CloudFront CDN for static asset delivery reducing latency for Algeria-based users. RDS for managed database with automated backups and point-in-time recovery. ECS Fargate or Kubernetes for container orchestration enabling elastic scaling based on traffic patterns."),
        
        heading3("Phase 1 Deliverables Checklist"),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: [
                createHeaderCell("Deliverable", 50),
                createHeaderCell("Acceptance Criteria", 35),
                createHeaderCell("Owner", 15),
              ],
            }),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Production Infrastructure Setup", 50),
              createDataCell("SSL, DNS, CI/CD pipeline, monitoring dashboards operational", 35),
              createDataCell("DevOps", 15),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Authentication System (FR/AR)", 50),
              createDataCell("Email/password, social login, password reset, 2FA ready", 35),
              createDataCell("Backend Lead", 15),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Product Catalog (10 categories)", 50),
              createDataCell("CRUD operations, image upload, search basic, category browsing", 35),
              createDataCell("Full-stack Dev", 15),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Supplier Registration Portal", 50),
              createDataCell("Company profile, document upload, RC/NIF validation", 35),
              createDataCell("Full-stack Dev", 15),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Buyer Dashboard (Read-only)", 50),
              createDataCell("Browse products, view supplier profiles, save favorites", 35),
              createDataCell("Frontend Dev", 15),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Admin Panel v1", 50),
              createDataCell("User management, content moderation, basic analytics", 35),
              createDataCell("Full-stack Dev", 15),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Responsive Web Application", 50),
              createDataCell("Mobile-friendly, <3s load time, Chrome/Safari/Firefox tested", 35),
              createDataCell("UI/UX Designer", 15),
            ]}),
          ],
        }),
        
        new Paragraph({ spacing: { before: 300 } }),
        
        // PHASE 2 DETAIL
        heading2("Phase 2: Core Trading Features (Months 4-6)"),
        accentBox("Budget: $55,000-$80,000 | Status: HIGH PRIORITY | Team: 8-10 people"),
        
        heading3("Phase 2 Objectives"),
        bodyPara("Phase 2 transforms the MVP into a functional trading platform by implementing core B2B commerce features. This phase introduces the Request for Quotation (RFQ) system that forms the backbone of buyer-supplier interactions, real-time messaging capabilities for negotiation, and supplier verification workflows that build trust in the marketplace ecosystem. The product catalog expands to cover all 28+ categories identified in the market research phase."),
        
        bodyPara("The RFQ system represents the most complex feature of this phase, requiring careful workflow design that accommodates Algerian business practices including price negotiation norms, communication preferences (often preferring direct messaging over formal quotes), and decision-making timelines that may differ from Western B2B platforms. The messaging system must support file sharing for specifications, images, and eventually secure document exchange during transaction phases."),
        
        heading3("Key Technical Challenges - Phase 2"),
        bodyPara("Real-time Communication: Implementing WebSocket connections via Socket.io for instant messaging requires careful consideration of connection management given potential connectivity issues in some Algerian regions. The solution must handle reconnection gracefully, queue messages during offline periods, and provide read receipts without excessive database load. Message encryption end-to-end ensures confidentiality of commercial negotiations."),
        
        bodyPara("Search Performance: As product catalog grows beyond 10,000 items, basic SQL search becomes inadequate. Introduction of Elasticsearch enables full-text search with relevance ranking, faceted navigation (filter by category, price range, location, certifications), and autocomplete suggestions. Search must handle both French and Arabic queries with appropriate stemming and character normalization for each language."),
        
        bodyPara("File Upload & Storage: Supplier verification documents, product images, and message attachments require robust file handling. AWS S3 integration with presigned URLs for secure uploads, automatic image resizing and optimization for web delivery, virus scanning integration, and storage cost optimization through lifecycle policies moving infrequently accessed files to cheaper storage tiers."),
        
        heading3("Phase 2 Success Metrics"),
        bodyPara("By end of Month 6, the platform should support 200+ registered suppliers with at least 50 having completed full verification process. Buyer registration should exceed 500 users with measurable engagement (average session duration >5 minutes, >3 page views per visit). RFQ submission volume target of 100+ per month indicates genuine marketplace activity. System performance benchmarks: search results returned in <500ms, message delivery latency <200ms, overall platform availability >99% during business hours."),
        
        new Paragraph({ spacing: { before: 200 } }),
        
        // PHASE 3 DETAIL
        heading2("Phase 3: Transaction & Trust System (Months 7-9)"),
        accentBox("Budget: $70,000-$95,000 | Status: HIGH PRIORITY | Team: 8-10 people + Security Consultant"),
        
        heading3("Phase 3 Objectives"),
        bodyPara("Phase 3 introduces the monetization infrastructure and trust mechanisms that convert platform activity into revenue while protecting all participants from fraud and disputes. This phase involves the most sensitive data handling requirements and demands the highest security standards. Payment processing integration with Algerian banking systems represents the most complex technical challenge, requiring coordination with multiple financial institutions and compliance with Central Bank of Algeria regulations."),
        
        bodyPara("The escrow system serves as the cornerstone of buyer protection, holding funds securely until delivery confirmation while providing sellers with payment certainty once obligations are met. Implementation must balance security (preventing unauthorized access to funds) with flexibility (handling partial releases, dispute scenarios, refund processing). Comprehensive audit logging supports reconciliation and regulatory reporting requirements."),
        
        heading3("Payment Integration Strategy - Algerian Market"),
        bodyPara("CIB Card Integration: Carte Internationale Bancaire cards issued by Algerian banks (BNA, BEA, CPA, BADR, Societe Generale Algeria, etc.) represent the primary online payment method for domestic transactions. Integration requires PCI-DSS compliance, 3D Secure authentication support, and handling of potential issuer declines due to international transaction restrictions. Development should begin with sandbox testing using bank-provided test environments before production activation."),
        
        bodyPara("CCP (Cheques Postaux Algeriens): Postal account transfers reach populations without traditional bank accounts, particularly important for smaller businesses in rural wilayas. CCP integration typically operates via bank transfer protocols with longer settlement windows (T+1 to T+3). Automatic reconciliation against order references reduces manual accounting overhead while providing transparent status tracking for users."),
        
        bodyPara("International Payments: For cross-border transactions with overseas suppliers, the platform must facilitate foreign exchange within Central Bank regulations. Partnership with authorized currency exchange providers enables competitive rate offerings while maintaining compliance. Documentary letters of credit for high-value transactions provide additional security layers appreciated by risk-averse Algerian importers."),
        
        heading3("Security Requirements - Phase 3"),
        bodyPara("Encryption Standards: All payment data encrypted at rest (AES-256) and in transit (TLS 1.3). Database fields containing financial information require additional encryption at application level. Key management follows industry best practices with regular rotation and secure storage in hardware security modules (HSM) or equivalent cloud services (AWS KMS)."),
        
        bodyPara("Compliance Audit: Engagement of external security firm for penetration testing before payment launch. Review against OWASP Top 10 vulnerabilities, PCI-DSS requirements (if processing cards directly), and Algerian data protection regulations. Documentation of security measures for potential regulatory inquiries. Incident response plan tested through tabletop exercises."),
        
        new Paragraph({ spacing: { before: 200 } }),
        
        // PHASE 4 DETAIL
        heading2("Phase 4: Logistics & Localization (Months 10-12)"),
        accentBox("Budget: $60,000-$85,000 | Status: MEDIUM PRIORITY | Team: 7-9 people"),
        
        heading3("Phase 4 Objectives"),
        bodyPara("Phase 4 deepens the platform's integration with the Algerian business ecosystem through logistics partnerships, advanced localization features, and regulatory compliance tools. This phase transforms AlgeriaTrade.dz from a simple matching platform into a comprehensive trade facilitation service that adds genuine value throughout the procurement lifecycle. The goal is making international trade accessible even to businesses without prior import/export experience."),
        
        bodyPara("Logistics integration addresses the significant pain point of shipping coordination for Algerian importers who often struggle with Incoterms interpretation, customs documentation, and delivery tracking. By partnering with freight forwarders serving Algerian ports and integrating their systems, the platform can offer seamless door-to-door shipping with transparent pricing and reliable delivery estimates tailored to each destination wilaya."),
        
        heading3("Algerian Port Integration Details"),
        bodyPara("Port of Algiers: Primary container facility handling approximately 70% of Algeria's containerized imports. Integration focus on real-time vessel tracking, estimated discharge dates, and documentation requirements specific to this port's procedures. Connection to Port Autonome d'Algiers systems where possible for accurate fee calculations and slot availability."),
        
        bodyPara("Port of Oran: Western region hub serving importers in Oran, Mostaganem, Tlemcen, and surrounding wilayas. Growing capacity with recent expansions. Integration similar to Algiers but with attention to regional specifics including proximity to Moroccan border (relevant for transshipment scenarios) and hydrocarbon industry cargo priorities."),
        
        bodyPara("Port of Annaba: Eastern region gateway for Constantine, Setif, Skikda, and Jijel provinces. Important for textile and agricultural machinery imports serving those manufacturing regions. Integration with Port de Skikda (petrochemical specialization) for chemical product shipments requiring specialized handling procedures."),
        
        heading3("Localization Enhancements"),
        bodyPara("Beyond language translation, true localization adapts the entire user experience to Algerian business culture and expectations. Date formats follow DD/MM/YYYY convention used in official documents. Number formatting uses space as thousands separator (1 000 000) matching local accounting standards. Currency display defaults to DZD with automatic conversion from USD/EUR at Bank of Algeria official rates updated daily."),
        
        bodyPara("Address formats accommodate the unique Algerian structure lacking state/province concepts, instead organizing by Wilaya (department) and commune. Postal code validation ensures accuracy for delivery purposes. Phone number formatting supports the +213 country code with appropriate length validation for mobile (9 digits after prefix) versus landline numbers. Business name handling accommodates the common practice of including legal form abbreviations (SARL, EURL, SPA) in company names."),
        
        new Paragraph({ spacing: { before: 200 } }),
        
        // PHASE 5 DETAIL
        heading2("Phase 5: Growth & Scale (Months 13-18)"),
        accentBox("Budget: $80,000-$120,000 | Status: STRATEGIC | Team: 10-12 people"),
        
        heading3("Phase 5 Objectives"),
        bodyPara("The final phase focuses on growth acceleration through mobile accessibility, intelligent automation, and ecosystem expansion. Having established a stable web platform with proven trading functionality, Phase 5 extends reach to mobile users (critical given smartphone penetration rates in Algeria), introduces AI-powered features that differentiate from competitors, and opens the platform to third-party integrations through public APIs and affiliate programs."),
        
        bodyPara("Mobile application development targets both iOS and Android platforms using React Native for codebase sharing while maintaining native performance characteristics. The mobile experience is not merely a scaled-down website but rather a purpose-built interface optimized for mobile-specific use cases: photo-based product search (using camera to find similar products), push notification management for RFQ responses, and simplified messaging optimized for thumb typing and occasional connectivity interruptions."),
        
        heading3("AI-Powered Features"),
        bodyPara("Intelligent Product Recommendations: Machine learning models analyze buyer behavior, RFQ history, and industry trends to suggest relevant products proactively. For registered buyers, the system learns preferences over time, increasingly accurate predictions reduce search friction and increase conversion rates. Supplier-side recommendations suggest optimal pricing, listing optimization, and response timing based on historical success patterns."),
        
        bodyPara("Automated Matching: Beyond passive search, the platform actively connects buyers with suitable suppliers based on RFQ requirements. Natural language processing extracts key specifications from buyer requests, matches against supplier capabilities and inventory, and generates ranked recommendations with confidence scores. Suppliers receive qualified leads automatically, reducing response time and increasing match quality."),
        
        bodyPara("Fraud Detection: Pattern recognition algorithms identify potentially fraudulent activity including fake listings, suspicious account behavior, and anomalous transaction patterns. Early detection protects legitimate users while maintaining platform reputation. Machine learning models continuously improve based on confirmed fraud cases and false positive feedback from human reviewers."),
        
        heading3("Ecosystem Expansion"),
        bodyPara("Public API: Partner integration capability enables third-party developers to build complementary services on the AlgeriaTrade.dz platform. ERP connectors allow large buyers to synchronize procurement processes directly. Accounting software integration simplifies invoice processing for frequent traders. Mobile app extensions enable industry-specific tools (e.g., construction material calculators, textile sample viewers) that drive engagement while leveraging platform data."),
        
        bodyPara("Affiliate Program: Referral incentives encourage existing users to bring new suppliers and buyers to the platform. Commission structure rewards successful introductions with ongoing revenue share from resulting transactions. Affiliate dashboard provides tracking, promotional materials, and payout management. Program designed to attract industry associations, trade consultants, and logistics providers who regularly interact with potential platform users."),
        
        new Paragraph({ spacing: { before: 300 } }),
        
        // TEAM STRUCTURE
        heading1("Team Structure & Resource Planning"),
        
        bodyPara("Successful execution of this production plan requires a dedicated, cross-functional team with expertise spanning software engineering, design, quality assurance, and domain knowledge of Algerian business practices. The following team structure assumes a mix of senior and mid-level professionals with options to supplement through contractors or development agency partnerships for specialized requirements or temporary capacity increases."),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          rows: createTeamTable(),
        }),
        
        new Paragraph({ spacing: { before: 200 } }),
        
        heading2("Staffing Strategy Options"),
        
        heading3("Option A: In-House Team (Recommended for Long-term)"),
        bodyPara("Building an internal development team provides maximum control over quality, timeline, and institutional knowledge accumulation. Recommended for organizations committed to ongoing platform development and maintenance beyond initial launch. Higher upfront recruitment investment but lower per-developper costs over 18-month horizon. Team cohesion improves through daily collaboration; easier knowledge transfer between phases. Estimated fully-loaded cost: $8,000-12,000 per developer/month including benefits, equipment, and workspace."),
        
        heading3("Option B: Hybrid Model (Balanced Approach)"),
        bodyPara("Core leadership positions (Tech Lead, PM, DevOps) hired internally while augmenting development capacity through contracted specialists or development agency partnership. Provides flexibility to scale up/down between phases without long-term commitment. Access to broader skill sets for specialized requirements (security audit, mobile development, AI/ML). Risk of context-switching and communication overhead with distributed teams. Recommended if internal hiring proves challenging or timeline acceleration needed."),
        
        heading3("Option C: Fully Outsourced Development"),
        bodyPara("Engaging a development agency or offshore team for complete project execution. Fastest path to team assembly if right partner identified; eliminates HR/recruitment burden. Significant challenges in maintaining quality control, aligning incentives, and preserving intellectual capital. Requires exceptionally detailed specifications and active project management oversight. Generally not recommended for complex platforms requiring ongoing iteration based on user feedback."),
        
        new Paragraph({ spacing: { before: 300 } }),
        
        // RISK MANAGEMENT
        heading1("Risk Management & Mitigation Strategies"),
        
        bodyPara("Any ambitious technology project carries inherent risks that threaten timeline, budget, or quality objectives. The following risk register identifies key risk factors specific to the AlgeriaTrade.dz project along with probability assessments, potential impacts, and proactive mitigation strategies. Regular risk review meetings (recommended bi-weekly during active development) ensure emerging concerns are addressed before becoming critical issues."),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          rows: createRisksTable(),
        }),
        
        new Paragraph({ spacing: { before: 200 } }),
        
        heading2("Contingency Planning"),
        
        bodyPara("Timeline Buffer: Each phase includes 2-week buffer period for unforeseen delays. If unused, buffer accelerates next phase start date rather than being consumed by scope additions. Critical path items (payment integration, port APIs) identified early with parallel workstreams where possible to prevent single-point-of-failure blocking overall progress."),
        
        bodyPara("Budget Reserve: Maintain 15% contingency reserve above quoted ranges for scope changes, currency fluctuation (relevant for any USD-denominated contractor payments), or emergency resources. Phase gate reviews assess remaining budget adequacy before proceeding; significant overruns trigger scope reduction discussions before commitment to next phase."),
        
        bodyPara("Scope Flexibility: Each phase defined with 'must-have' and 'nice-to-have' feature lists. Under time pressure, nice-to-homes defer to subsequent phases without compromising core functionality. Product backlog continuously prioritized; team empowered to push back on late-breaking requirements that threaten delivery commitments."),
        
        new Paragraph({ spacing: { before: 300 } }),
        
        // KPIs AND SUCCESS METRICS
        heading1("Key Performance Indicators & Success Metrics"),
        
        bodyPara("Measuring progress toward strategic objectives requires carefully selected metrics that reflect genuine business health rather than vanity indicators. The following KPI framework provides visibility into user acquisition, engagement, transaction activity, and technical performance. Monthly review cadence recommended with quarterly strategic assessment adjusting targets based on market response and competitive dynamics."),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          rows: createKPITable(),
        }),
        
        new Paragraph({ spacing: { before: 200 } }),
        
        heading2("Metric Definitions & Measurement Methods"),
        
        heading3("User Acquisition Metrics"),
        bodyPara("Registered Suppliers: Count of supplier accounts completing registration process and passing initial email verification. Tracked via database query; segmented by industry category, registration source (organic/referral/paid), and verification status. Target growth curve assumes ramp-up marketing spend starting Phase 2 with increasing efficiency as brand recognition develops."),
        
        bodyPara("Active Buyers: Registered buyer accounts with meaningful engagement activity (login, search, RFQ submission, or message sent) within trailing 30-day window. More stringent than simple registration count; reflects actual platform usage rather than curiosity signups. Activation rate (registrations converting to active) indicates onboarding effectiveness."),
        
        heading3("Transaction Metrics"),
        bodyPara("RFQs Completed: Count of RFQs reaching 'closed' status (quote accepted, expired, or withdrawn) per month. Leading indicator of transaction volume; typical 2-4 week lag between RFQ creation and order placement. Conversion rate (RFQs to orders) indicates marketplace match quality and pricing competitiveness."),
        
        bodyPara("Transaction Volume: Gross Merchandise Value (GMV) of orders processed through platform, measured in USD equivalent for consistency. Revenue calculation applies commission percentage (varies by category/supplier tier) to GMV. Month-over-month growth rate more informative than absolute values in early stages when baseline is low."),
        
        heading3("Technical Metrics"),
        bodyPara("Platform Uptime: Percentage of time platform is accessible and functional, measured via synthetic monitoring from multiple global locations (including Algeria-based probes). Target 99.9% translates to maximum 43 minutes downtime per month; maintenance windows scheduled during low-traffic periods (typically 02:00-04:00 AM Algeria time). Incident severity classification guides response time expectations (P1 critical: 15-minute response; P4 minor: 24-hour response)."),
        
        new Paragraph({ spacing: { before: 300 } }),
        
        // TECHNOLOGY STACK SUMMARY
        heading1("Technology Stack Summary"),
        
        bodyPara("The following technology choices balance modern best practices with practical considerations including available talent pool in North Africa, long-term maintainability, scalability requirements, and total cost of ownership. Where alternatives exist, rationale provided for selected approach; architecture remains flexible to substitute components if compelling reasons emerge during development."),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: [
                createHeaderCell("Layer", 20),
                createHeaderCell("Technology", 30),
                createHeaderCell("Purpose", 35),
                createHeaderCell("Alternatives Considered", 15),
              ],
            }),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Frontend Framework", 20),
              createDataCell("Next.js 14 + React 18", 30),
              createDataCell("SSR for SEO, API routes, image optimization", 35),
              createDataCell("Vue.js, Angular", 15),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Language", 20),
              createDataCell("TypeScript", 30),
              createDataCell("Type safety, better DX, fewer runtime errors", 35),
              createDataCell("JavaScript (vanilla)", 15),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Styling", 20),
              createDataCell("Tailwind CSS", 30),
              createDataCell("Utility-first, responsive, small bundle", 35),
              createDataCell("Material UI, Styled Components", 15),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Backend Runtime", 20),
              createDataCell("Node.js + Express", 30),
              createDataCell("JS fullstack, async I/O, npm ecosystem", 35),
              createDataCell("Python/Django, Go", 15),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Primary Database", 20),
              createDataCell("PostgreSQL", 30),
              createDataCell("Relational data, complex queries, JSON support", 35),
              createDataCell("MySQL, MongoDB", 15),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Cache Layer", 20),
              createDataCell("Redis", 30),
              createDataCell("Sessions, rate limiting, pub/sub", 35),
              createDataCell("Memcached", 15),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Search Engine", 20),
              createDataCell("Elasticsearch", 30),
              createDataCell("Full-text search, faceted navigation, relevance", 35),
              createDataCell("Postgres full-text, Algolia", 15),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("File Storage", 20),
              createDataCell("AWS S3 + CloudFront", 30),
              createDataCell("Object storage, CDN delivery, lifecycle", 35),
              createDataCell("Google Cloud Storage", 15),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Containerization", 20),
              createDataCell("Docker + Kubernetes", 30),
              createDataCell("Consistent environments, auto-scaling", 35),
              createDataCell("Docker Compose, ECS Fargate", 15),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Real-time", 20),
              createDataCell("Socket.io", 30),
              createDataCell("WebSocket abstraction, fallback support", 35),
              createDataCell("WS, Pusher", 15),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Mobile (Phase 5)", 20),
              createDataCell("React Native", 30),
              createDataCell("Cross-platform, code sharing with web", 35),
              createDataCell("Flutter, Native (iOS/Android)", 15),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("AI/ML (Phase 5)", 20),
              createDataCell("Python + TensorFlow", 30),
              createDataCell("Recommendations, matching, fraud detection", 35),
              createDataCell("PyTorch, scikit-learn", 15),
            ]}),
          ],
        }),
        
        new Paragraph({ spacing: { before: 300 } }),
        
        // INFRASTRUCTURE ARCHITECTURE
        heading1("Infrastructure & Deployment Architecture"),
        
        heading2("Cloud Infrastructure Design"),
        
        bodyPara("The proposed architecture follows cloud-native principles emphasizing scalability, reliability, and operational efficiency. Multi-region deployment with primary presence in EU (closest major cloud region to Algeria with mature service availability) and optional disaster recovery replication to second region. All services containerized and orchestrated via Kubernetes enabling horizontal scaling based on demand signals."),
        
        bodyPara("Network Architecture: Content Delivery Network (CloudFront) edge locations serve static assets with latency under 50ms for Algeria-based users. API backend deployed behind Application Load Balancer with SSL termination at edge, encrypting traffic end-to-end to origin servers. Database instances deployed in private subnets without direct internet access; administration via bastion hosts with SSH key authentication only."),
        
        bodyPara("Data Protection: Database snapshots taken nightly with 30-day retention; point-in-time recovery enabled for 72-hour window. Encrypted backups stored in separate region for disaster recovery. Application-level encryption for sensitive fields (payment details, identity documents) using envelope encryption with master keys in AWS KMS. Regular access reviews ensure principle of least privilege maintained."),
        
        heading2("CI/CD Pipeline"),
        
        bodyPara("Source Control: Git-based version control (GitHub/GitLab) with branch protection rules requiring pull request approval for main branch merges. Feature branches per task; main branch always reflects deployable state. Automated dependency scanning for known vulnerabilities; blocked merge if critical CVEs detected in direct dependencies."),
        
        bodyPara("Build Pipeline: Container images built on every commit to feature branches (for development/testing) and main branch (for staging/production). Multi-stage Docker builds minimize final image size and attack surface. Images scanned for vulnerabilities before promotion to production registry. Build artifacts cached aggressively to minimize build times (<5 minutes for typical frontend change)."),
        
        bodyPara("Deployment Process: Blue-green deployment strategy enabling zero-downtime releases and instant rollback capability. Canary deployments for high-risk changes (database migrations, payment system updates) routing small percentage of traffic to new version before full rollout. Automated smoke tests validate deployment success; failed deployments trigger automatic rollback with alerting to on-call engineer."),
        
        new Paragraph({ spacing: { before: 300 } }),
        
        // BUDGET SUMMARY
        heading1("Budget Summary & Investment Overview"),
        
        bodyPara("Total projected investment across all five phases ranges from $310,000 (lean team, minimal contingencies) to $445,000 (full team, premium tools, larger contingency). Budget allocation roughly: 60% personnel costs, 20% infrastructure/services, 15% contingency/reserve, 5% licensing/tools. Detailed breakdown by phase enables staged funding decisions with go/no-go gates between phases."),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: [
                createHeaderCell("Phase", 20),
                createHeaderCell("Duration", 15),
                createHeaderCell("Low Estimate", 22),
                createHeaderCell("High Estimate", 22),
                createHeaderCell("% of Total", 21),
              ],
            }),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Phase 1: Foundation & MVP", 20),
              createDataCell("Months 1-3", 15, true),
              createDataCell("$45,000", 22, true),
              createDataCell("$65,000", 22, true),
              createDataCell("14-15%", 21, true),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Phase 2: Core Trading", 20),
              createDataCell("Months 4-6", 15, true),
              createDataCell("$55,000", 22, true),
              createDataCell("$80,000", 22, true),
              createDataCell("18%", 21, true),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Phase 3: Transactions", 20),
              createDataCell("Months 7-9", 15, true),
              createDataCell("$70,000", 22, true),
              createDataCell("$95,000", 22, true),
              createDataCell("21-22%", 21, true),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Phase 4: Logistics", 20),
              createDataCell("Months 10-12", 15, true),
              createDataCell("$60,000", 22, true),
              createDataCell("$85,000", 22, true),
              createDataCell("19%", 21, true),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Phase 5: Growth", 20),
              createDataCell("Months 13-18", 15, true),
              createDataCell("$80,000", 22, true),
              createDataCell("$120,000", 22, true),
              createDataCell("26-27%", 21, true),
            ]}),
            new TableRow({ cantSplit: true, children: [
              new TableCell({
                width: { size: 20, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, fill: P.surface },
                children: [new Paragraph({ 
                  alignment: AlignmentType.LEFT,
                  children: [new TextRun({ text: "TOTAL", bold: true, size: 21, font: F.body })] 
                })],
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
              }),
              createDataCell("18 Months", 15, true),
              new TableCell({
                width: { size: 22, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, fill: P.surface },
                children: [new Paragraph({ 
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "$310,000", bold: true, size: 21, color: c(P.accent), font: F.body })] 
                })],
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
              }),
              new TableCell({
                width: { size: 22, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, fill: P.surface },
                children: [new Paragraph({ 
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "$445,000", bold: true, size: 21, color: c(P.accent), font: F.body })] 
                })],
                margins: { top: 80, bottom: 80, left: 100, right: 100 },
              }),
              createDataCell("100%", 21, true),
            ]}),
          ],
        }),
        
        new Paragraph({ spacing: { before: 200 } }),
        
        heading2("Ongoing Operational Costs (Post-Launch)"),
        
        bodyPara("Beyond development investment, anticipate monthly operational costs for running the production platform. These estimates assume steady-state operation post-Phase 3 (when transaction features are live); earlier phases have lower infrastructure needs but also lower revenue offset. Costs scale with user base and transaction volume; figures below represent Month 12-18 projections."),
        
        bodyParaNoIndent("Cloud Infrastructure (AWS/Azure): $3,000-8,000/month depending on compute instances, database sizing, data transfer volumes, and CDN bandwidth usage. Auto-scaling configurations set minimum baselines with burst capacity for peak periods (business hours, promotional campaigns). Reserved instance purchases (1-3 year terms) offer 30-60% savings over on-demand pricing for predictable workload components."),
        
        bodyParaNoIndent("Third-Party Services: $1,500-3,000/month including payment processing fees (typically 2-3% transaction volume plus per-transaction fees), email delivery services (SendGrid/Mailgun), SMS notifications (Twilio or local alternative), monitoring/alerting (DataDog/New Relic), and security scanning (Snyk/Detectify). Some costs variable with volume (payment fees, SMS); others fixed monthly subscriptions."),
        
        bodyParaNoIndent("Personnel (Operations): $15,000-25,000/month for ongoing team maintaining and enhancing platform post-launch. Core team of 4-6 including devops (infrastructure reliability, security patching), backend developer (bug fixes, small enhancements), content manager (category maintenance, quality control), and customer support (user inquiries, dispute assistance). Costs decrease relative to revenue as automation matures but never eliminate need for human judgment in complex cases."),
        
        new Paragraph({ spacing: { before: 400 } }),
        
        // NEXT STEPS
        heading1("Immediate Next Steps & Action Items"),
        
        bodyPara("To initiate the AlgeriaTrade.dz production plan execution, the following actions should be completed within the first two weeks. These foundational activities set conditions for successful Phase 1 kickoff and demonstrate organizational commitment to the project. Delays in these preparatory steps inevitably cascade into later phases; prioritization and decisive action here pays dividends throughout the 18-month journey."),
        
        heading3("Week 1: Foundation Activities"),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: [
                createHeaderCell("Action Item", 45),
                createHeaderCell("Owner", 20),
                createHeaderCell("Deadline", 15),
                createHeaderCell("Output", 20),
              ],
            }),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Finalize project funding approval", 45),
              createDataCell("Executive Sponsor", 20),
              createDataCell("Day 3", 15, true),
              createDataCell("Signed budget authorization", 20),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Recruit/hire Project Manager", 45),
              createDataCell("HR/Hiring Manager", 20),
              createDataCell("Day 5", 15, true),
              createDataCell("PM candidate selected/onboarding", 20),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Establish development workspace (GitHub, Slack, Jira)", 45),
              createDataCell("Tech Lead", 20),
              createDataCell("Day 7", 15, true),
              createDataCell("Operational project infrastructure", 20),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Complete cloud provider account setup", 45),
              createDataCell("DevOps Engineer", 20),
              createDataCell("Day 7", 15, true),
              createDataCell("AWS/Azure accounts, billing configured", 20),
            ]}),
          ],
        }),
        
        new Paragraph({ spacing: { before: 200 } }),
        
        heading3("Week 2: Kickoff Preparation"),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: [
                createHeaderCell("Action Item", 45),
                createHeaderCell("Owner", 20),
                createHeaderCell("Deadline", 15),
                createHeaderCell("Output", 20),
              ],
            }),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Conduct Phase 1 kickoff meeting with full team", 45),
              createDataCell("Project Manager", 20),
              createDataCell("Day 10", 15, true),
              createDataCell("Kickoff presentation, Q&A, action items", 20),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Finalize detailed Phase 1 sprint plan", 45),
              createDataCell("Tech Lead + PM", 20),
              createDataCell("Day 12", 15, true),
              createDataCell("Jira epics/stories, sprint backlog", 20),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Set up development/staging environments", 45),
              createDataCell("DevOps Engineer", 20),
              createDataCell("Day 12", 15, true),
              createDataCell("Deployable infra, CI/CD pipeline v1", 20),
            ]}),
            new TableRow({ cantSplit: true, children: [
              createDataCell("Begin Sprint 1 (Days 14-28)", 45),
              createDataCell("Development Team", 20),
              createDataCell("Day 14", 15, true),
              createDataCell("First working code committed", 20),
            ]}),
          ],
        }),
        
        new Paragraph({ spacing: { before: 400 } }),
        
        // CLOSING
        accentBox("End of Production Plan Document | Ready for Execution Approval"),
        
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ 
            text: "This document provides the strategic roadmap for building AlgeriaTrade.dz into Algeria's leading B2B e-commerce platform. With disciplined execution, appropriate resourcing, and adaptive management of risks, the 18-month timeline is achievable and the business case compelling.", 
            size: 22, 
            italics: true, 
            color: c(P.secondary),
            font: F.body
          })],
        }),
      ],
    },
  ],
});

// Generate
async function generateDocument() {
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync("/home/z/my-project/download/AlgeriaTrade_Production_Plan_Phased.docx", buffer);
  console.log("Production Plan generated successfully!");
}

generateDocument().catch(console.error);
