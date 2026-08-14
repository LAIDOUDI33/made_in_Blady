const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, AlignmentType, HeadingLevel, WidthType,
  BorderStyle, ShadingType, LevelFormat
} = require("docx");
const fs = require("fs");

// Palette for professional B2B document - Algerian theme
const P = {
  primary: "#006233",
  body: "#1A1A2E",
  secondary: "#6B7280",
  accent: "#D52B1E",
  surface: "#F0FDF4",
};

const c = (hex) => hex.replace("#", "");

// Font constants - defined once to avoid syntax issues
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

function accentPara(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200, line: 312 },
    shading: { type: ShadingType.CLEAR, fill: P.surface },
    children: [new TextRun({ text, bold: true, size: 26, color: c(P.primary), font: F.heading })],
  });
}

// Navigation data
const navItems = [
  ["Produits", "المنتجات", "Browse all product categories, search, filters"],
  ["Fournisseurs", "الموردون", "Discover verified suppliers, view profiles"],
  ["Devis (RFQ)", "طلبات الأسعار", "Post buying requests, receive quotes"],
  ["Mon Compte", "حسابي", "User dashboard, orders, messages, settings"],
  ["Devenir Vendeur", "كن بائعاً", "Seller registration, product management"],
  ["Assistance", "المساعدة", "Help center, FAQs, live chat support"],
  ["Langue FR/AR", "اللغة", "Toggle French/Arabic interface"],
];

// Category data
const categoryData = {
  agriculture: [
    ["Machines Agricoles", "الآلات الزراعية", "Tracteurs, Moissonneuses, Irrigation"],
    ["Produits Alimentaires", "المنتجات الغذائية", "Cereales, Legumes secs, Huiles, Conserves"],
    ["Boissons", "المشروبات", "Jus natureaux, Eaux minerales, Boissons traditionnelles"],
    ["Emballage Alimentaire", "التغليف الغذائي", "Materiaux emballage, Etiquetage, Conservation"],
    ["Intrants Agricoles", "المدخلات الزراعية", "Engrais, Semences, Phytosanitaires, Fourrage"],
  ],
  machinery: [
    ["Machines CN/Usinage", "آلات CNC/تشكيل", "Tours, Fraiseuses, Centres d'usinage, EDM"],
    ["Machines Plastique", "آلات البلاستيك", "Injection, Extrusion, Soufflage, Thermoformage"],
    ["Machines Construction", "آلات البناء", "Grues, Pelleteuses, Compacteurs, Betonnieres"],
    ["Machines Emballage", "آليات التغليف", "Remplissage, Bouchonnage, Etiquetage, Palettisation"],
    ["Equipements Energie", "معدات الطاقة", "Generatrices, Panneaux solaires, Transformateurs"],
  ],
  construction: [
    ["Materiaux Construction", "مواد البناء", "Ciment, Acier, Briques, Carrelage, Isolation"],
    ["Menuiserie Fenetres", "النجارة والنوافذ", "Portes, Fenetres, Velux, Aluminium, PVC"],
    ["Electricite Batiment", "كهرباء المباني", "Cabling, Tableaux electriques, Eclairage, Securite"],
    ["Plomberie Sanitaire", "سباكية صحية", "Tuyaux, Robinetterie, Chauffe-eau, Sanitaires"],
    ["Peinture Revetements", "الدهانات والتغطيات", "Peintures, Enduits, Colles, Traitements sols"],
  ],
  electronics: [
    ["Telephonie Mobile", "الهواتف المحمولة", "Smartphones, Accessoires, Pieces detachees"],
    ["Informatique", "الحاسوب", "Ordinateurs, Tablettes, Peripheriques, Serveurs"],
    ["Electromenager", "الأجهزة المنزلية", "Refrigerateurs, Machines a laver, Climatisation"],
    ["Composants Electroniques", "المكونات الإلكترونية", "Circuits integres, Condensateurs, Connecteurs"],
    ["Audio Video", "الصوت والفيديو", "Televiseurs, Enceintes, Systems home cinema"],
  ],
  textile: [
    ["Tissus Matieres Premieres", "الأقمشة والمواد الخام", "Coton, Polyester, Soie, Tissus techniques"],
    ["Habillement Homme", "ملابس رجالية", "Chemises, Pantalons, Costumes, Vetements traditionnels"],
    ["Habillement Femme", "ملابس نسائية", "Robes, Djellabas modernes, Haiks, Accessories"],
    ["Chaussures Maroquinerie", "الأحذية والجلود", "Chaussures, Sacs, Ceintures, Articles cuir"],
    ["Machines Textiles", "آلات النسيج", "Tissage, Tricot, Teinture, Confection"],
  ],
  automotive: [
    ["Pieces Moteur", "قطع المحرك", "Pistons, Bielles, Joint, Courroies, Filtres"],
    ["Carrosserie Chassis", "الهيكل والعربة", "Portes, Ailes, Pare-chocs, Feux, Vitres"],
    ["Systemes Electriques", "أنظمة كهربائية", "Alternateurs, Batteries, Bougies, Cableage"],
    ["Pneumatiques Jantes", "الإطارات والمجنزات", "Pneus toutes saisons, Jantes aluminium, Accessoires"],
    ["Lubrifiants Fluides", "الشحوم والسوائل", "Huiles moteur, Liquide refroidissement, Freins"],
  ],
};

const additionalCategories = [
  ["Sante Pharmaceutique", "الصحة والأدوية", "Medicaments, Dispositifs medics, Equipements hopitaux"],
  ["Chimie Industrielle", "الكيمياء الصناعية", "Solvants, Resines, Produits chimiques de base"],
  ["Outils Quincaillerie", "الأدوات والحديدية", "Outils a main, Outils electriques, Fixation, Serrurerie"],
  ["Mobilier Ameublement", "الأثاث والتجهيز", "Bureau, Maison, Hotel, Ecole, Industriel"],
  ["Sports Loisirs", "الرياضة والترفيه", "Equipements sportifs, Camping, Jeux, Musique"],
  ["Emballage Impression", "التغليف والطباعة", "Materiaux emballage, Machines impression, Etiquettes"],
  ["Securite Protection", "الأمن والحماية", "Equipements protection, Controle acces, Surveillance"],
  ["Lumiere Eclairage", "الإضاءة والإنارة", "LED, Lampadaires, Eclairage decoratif, Urbain"],
  ["Environnement Recyclage", "البيئة وإعادة التدوير", "Traitement dechets, Filtration, Energies renouvelables"],
  ["Beaute Cosmetiques", "الجمال ومستحضرات التجميل", "Soins peau, Maquillage, Parfums, Hygiene"],
  ["Maison Jardin", "المنزل والحديقة", "Decoration, Jardinage, Cuisine, Nettoyage"],
  ["Bureautique Fournitures", "المكتبية والمستلزمات", "Papeterie, Fournitures bureau, Mobilier bureau"],
  ["Transport Logistique", "النقل والخدمات اللوجستية", "Services transport, Entrepots, Transit douanier"],
  ["Energie Mines", "الطاقة والتعدين", "Petrochimie, Equipements miniers, Energie renouvelable"],
  ["Telecommunications", "الاتصالات", "Reseaux, Fibre optique, Antennes, Equipements telecom"],
  ["Education Formation", "التعليم والتدريب", "Materiel pedagogique, Logiciels educatifs, Formation"],
  ["Services Entreprises", "خدمات الشركات", "Consulting, Juridique, Comptabilite, Marketing IT"],
  ["Mode Accessoires", "الموضة والإكسسوارات", "Bijoux, Montres, Lunettes, Accessoires mode"],
  ["Jouets Puericulture", "الألعاب ورعاية الأطفال", "Jouets educatifs, Puericulture, Jouets plein air"],
  ["Animaux Veterinaire", "الحيوانات والبيطرية", "Alimentation animale, Equipements veterinaire, Accessoires"],
  ["Metallurgie Siderurgie", "المعادن والصلب", "Metaux ferreux, Alliages, Traitement thermique"],
  ["Instruments Mesure", "أجهزة القياس", "Instruments precision, Analyse laboratoire, Metrologie"],
];

function createNavRows() {
  return navItems.map(item => new TableRow({
    cantSplit: true,
    children: item.map((cell, idx) => new TableCell({
      width: { size: idx === 2 ? 50 : 25, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 21, font: F.body })] })],
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
    })),
  }));
}

function createCategoryRows(category) {
  const items = categoryData[category] || [];
  return items.map(item => new TableRow({
    cantSplit: true,
    children: item.map((cell, idx) => new TableCell({
      width: { size: idx === 2 ? 25 : (idx === 0 ? 40 : 35), type: WidthType.PERCENTAGE },
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 21, font: F.body })] })],
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
    })),
  }));
}

function createAdditionalCategoriesRows() {
  return additionalCategories.map(item => new TableRow({
    cantSplit: true,
    children: item.map((cell, idx) => new TableCell({
      width: { size: idx === 2 ? 40 : 30, type: WidthType.PERCENTAGE },
      children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20, font: F.body })] })],
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
    })),
  }));
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
                  shading: { type: ShadingType.CLEAR, fill: "FFFFFF" },
                  verticalAlign: "center",
                  children: [
                    new Paragraph({ spacing: { before: 2000 } }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { line: 828, lineRule: "atLeast" },
                      children: [new TextRun({ text: "MADE IN ALGERIA", bold: true, size: 56, color: c(P.primary), font: F.heading })],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 200, line: 400 },
                      children: [new TextRun({ text: "B2B E-Commerce Platform", size: 36, color: c(P.secondary), font: F.heading })],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 100, line: 400 },
                      children: [new TextRun({ text: "Complete Website Copy & Content Guide", size: 28, color: c(P.body), font: F.body })],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 600, line: 400 },
                      children: [new TextRun({ text: "Customized for Algerian Market | French & Arabic Support", size: 22, color: c(P.secondary), font: F.body })],
                    }),
                    new Paragraph({ spacing: { before: 1500 } }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "Platform Name: AlgeriaTrade.dz | Slogan: Connecting Algeria to Global Trade", size: 20, italics: true, color: c(P.accent), font: F.body })],
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
    // Main Content Section
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
            children: [new TextRun({ text: "AlgeriaTrade.dz - Platform Copy Guide", size: 18, color: c(P.secondary), font: F.body })],
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
        // SECTION 1
        heading1("1. Platform Overview & Value Proposition"),
        
        accentPara('Tagline: "Votre Pont vers le Commerce Mondial" | "جسر نحو التجارة العالمية"'),
        
        heading2("1.1 About AlgeriaTrade.dz"),
        bodyPara("AlgeriaTrade.dz is the premier B2B e-commerce platform designed specifically to connect Algerian businesses with global manufacturers, suppliers, and trading partners. As Algeria's economy continues to diversify beyond hydrocarbons, our platform serves as the digital gateway for importers, exporters, wholesalers, and manufacturers to discover quality products, establish reliable supply chains, and expand their business reach across North Africa and beyond."),
        
        bodyPara("Unlike generic international trade platforms, AlgeriaTrade.dz is built with deep understanding of the local market dynamics, regulatory environment, and cultural nuances that define doing business in Algeria. We support both French and Arabic languages natively, integrate with local payment systems including CIB cards and CCP payments, and provide logistics solutions optimized for Algerian ports and customs procedures. Our mission is to democratize international trade for Algerian businesses of all sizes, from family-owned enterprises in Blida to large industrial groups in Oran and Annaba."),
        
        heading2("1.2 Core Value Propositions"),
        bodyPara("Our platform delivers five fundamental value propositions that distinguish us from competitors and address the specific needs of Algerian businesses engaged in international trade. First, we provide verified supplier profiles with comprehensive auditing processes including factory verification, business license validation, and trade history verification. Second, our intelligent sourcing AI helps buyers find exactly what they need by analyzing product specifications, price trends, and supplier reliability metrics. Third, our secured transaction protection system holds buyer funds in escrow until delivery confirmation, significantly reducing the risk that has traditionally hindered cross-border commerce for Algerian companies."),
        
        bodyPara("Fourth, we offer comprehensive logistics support including freight forwarding coordination, customs documentation assistance, and door-to-door delivery tracking for shipments destined to Algiers, Oran, Skikda, and other major Algerian ports. Fifth, our dedicated customer success team provides support in French, Arabic, and English, ensuring that language barriers never impede successful transactions. These value propositions combine to create a trusted ecosystem where Algerian businesses can confidently engage in international procurement and sales activities."),
        
        heading2("1.3 Target Audience Segments"),
        bodyPara("AlgeriaTrade.dz serves three primary user segments within the Algerian business ecosystem. The first segment comprises importers and procurement professionals who source raw materials, machinery, consumer goods, and components from international suppliers. This includes purchasing managers at manufacturing companies, retail chain buyers, construction project procurers, and government procurement officers seeking competitive pricing and reliable quality from verified overseas manufacturers."),
        
        bodyPara("The second segment consists of Algerian exporters and manufacturers who seek to showcase their products to international buyers. This includes textile producers from Tizi Ouzou, agricultural processors from Relizane, steel fabricators from Annaba, and pharmaceutical companies from Constantine who want to reach markets in Europe, Africa, and the Middle East. Our platform provides these sellers with multilingual product listings, international marketing tools, and lead generation capabilities that would otherwise require significant investment in foreign sales teams and trade show participation."),
        
        bodyPara("The third segment encompasses service providers and intermediaries who facilitate international trade, including customs brokers, freight forwarders, translation services, quality inspection firms, and financial institutions. These partners enhance the overall ecosystem by providing essential services that smooth the path from initial inquiry to final delivery, creating a comprehensive trade facilitation network centered on the AlgeriaTrade.dz platform."),
        
        // SECTION 2
        heading1("2. Main Navigation & User Interface Copy"),
        
        heading2("2.1 Primary Navigation Menu"),
        accentPara("Desktop Navigation Structure"),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Menu Item (FR)", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Menu Item (AR)", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Description / Function", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
              ],
            }),
            ...createNavRows(),
          ],
        }),
        
        new Paragraph({ spacing: { before: 200 } }),
        
        heading2("2.2 Hero Section Copy"),
        bodyParaNoIndent('Main Headline (French): '),
        bodyPara('"Trouvez des Fournisseurs de Confiance pour Votre Entreprise Algerienne" - This headline emphasizes trust and reliability, two critical factors for Algerian businesses wary of international scams and quality issues. It directly addresses the user identity as an Algerian enterprise, creating immediate relevance and connection.'),
        
        bodyParaNoIndent('Main Headline (Arabic): '),
        bodyPara('"اعثروا على موردين موثوقين لشركاتكم الجزائرية" - The Arabic version maintains the same emphasis on trust while using formal business Arabic appropriate for professional contexts across the Maghreb region.'),
        
        bodyParaNoIndent('Subheadline: '),
        bodyPara('"Plus de 500,000 produits verifies. Livraison en Algerie garantie. Paiement securise." | "أكثر من 500,000 منتج موثق. التوصيل إلى الجزائر مضمون. دفع آمن." - The subheadline provides concrete numbers that build credibility while addressing the three biggest concerns of Algerian buyers: product authenticity, delivery reliability, and payment security.'),
        
        bodyParaNoIndent('Primary CTA Button: '),
        bodyPara('"Commencer mes Achats" / "ابدأ التسوق" - Action-oriented and welcoming, inviting users to begin their sourcing journey immediately without commitment or registration requirement at this stage.'),
        
        bodyParaNoIndent('Secondary CTA Button: '),
        bodyPara('"Devenir Vendeur" / "كن بائعا" - For Algerian manufacturers and exporters looking to list their products internationally, this clear call-to-action opens the seller onboarding flow.'),
        
        heading2("2.3 Search Bar Copy"),
        bodyParaNoIndent('Placeholder Text: '),
        bodyPara('"Recherchez des produits, fournisseurs ou categories..." / "ابحث عن المنتجات أو الموردين أو الفئات..." - The search placeholder guides users on the types of queries they can perform, reducing friction for first-time visitors unfamiliar with B2B platform conventions.'),
        
        bodyParaNoIndent('Search Suggestions Label: '),
        bodyPara('"Recherches Populaires en Algerie:" / "عمليات البحث الشائعة في الجزائر:" - Contextualizing popular searches to the Algerian market helps users discover relevant products quickly while demonstrating local market understanding.'),
        
        bodyParaNoIndent('Example Popular Searches: '),
        bodyPara('"Machines agricoles", "Textile coton", "Materiaux construction", "Electromenager", "Pieces auto" | "الآلات الزراعية", "الأقمش القطنية", "مواد البناء", "الأجهزة المنزلية", "قطع غيار السيارات" - These examples reflect actual high-demand import categories for Algerian businesses based on current trade data and economic development priorities.'),
        
        // SECTION 3
        heading1("3. Complete Product Categories (28+ Categories)"),
        
        bodyPara("The following comprehensive category structure covers all major product sectors relevant to Algerian importers and exporters. Each category includes subcategory suggestions tailored to local market demand patterns, regulatory considerations, and growth opportunities identified through analysis of Algeria current import/export portfolio and economic development plans under Vision 2030."),
        
        heading2("3.1 Agriculture & Food Products"),
        accentPara("Categorie: Agriculture & Alimentation | الزراعة والغذاء"),
        bodyPara("This category addresses Algeria strategic priority of food security and agricultural self-sufficiency. With the government investing heavily in agricultural modernization under various development programs, demand for farming equipment, processing technology, and food production inputs continues to grow strongly across all wilayas."),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: 40, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Subcategory (FR)", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
                new TableCell({
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Subcategory (AR)", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Key Products", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
              ],
            }),
            ...createCategoryRows("agriculture"),
          ],
        }),
        
        new Paragraph({ spacing: { before: 200 } }),
        
        heading2("3.2 Industrial Machinery & Equipment"),
        accentPara("Categorie: Machines Industriels | الآلات الصناعية"),
        bodyPara("Industrial machinery represents one of Algeria largest import categories, driven by ongoing infrastructure development, manufacturing sector expansion, and mining industry modernization. This category serves the critical needs of SONATRACH subsidiary companies, private manufacturers, construction firms, and emerging industrial parks being developed across the country."),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: 40, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Subcategory (FR)", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
                new TableCell({
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Subcategory (AR)", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Key Products", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
              ],
            }),
            ...createCategoryRows("machinery"),
          ],
        }),
        
        new Paragraph({ spacing: { before: 200 } }),
        
        heading2("3.3 Construction & Building Materials"),
        accentPara("Categorie: Construction & Batiment | البناء والتشييد"),
        bodyPara("Algeria ambitious housing programs and infrastructure development initiatives under successive five-year plans have created sustained demand for construction materials and equipment. From the government target of delivering millions of new housing units to major highway, rail, and port expansion projects, this category serves both public sector tenders and private construction companies."),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: 40, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Subcategory (FR)", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
                new TableCell({
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Subcategory (AR)", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Key Products", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
              ],
            }),
            ...createCategoryRows("construction"),
          ],
        }),
        
        new Paragraph({ spacing: { before: 200 } }),
        
        heading2("3.4 Consumer Electronics & Appliances"),
        accentPara("Categorie: Electronique & Electromenager | الإلكترونيات والأجهزة المنزلية"),
        bodyPara("With a young population exceeding 45 million and growing consumer purchasing power, Algeria represents a significant market for consumer electronics and household appliances. This category ranges from smartphones and computers to kitchen appliances and air conditioning systems, serving both individual consumers and retailers who distribute these products nationwide."),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: 40, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Subcategory (FR)", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
                new TableCell({
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Subcategory (AR)", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Key Products", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
              ],
            }),
            ...createCategoryRows("electronics"),
          ],
        }),
        
        new Paragraph({ spacing: { before: 200 } }),
        
        heading2("3.5 Textiles, Apparel & Fashion"),
        accentPara("Categorie: Textile & Habillement | المنسوجات والملابس"),
        bodyPara("Algeria possesses a rich textile heritage combined with growing domestic manufacturing capability, particularly in regions like Tizi Ouzou, Bejaia, and Oran. This category serves both the significant import market for finished garments and fabrics, as well as supporting the local textile industry need for raw materials, dyes, and manufacturing equipment."),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: 40, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Subcategory (FR)", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
                new TableCell({
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Subcategory (AR)", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Key Products", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
              ],
            }),
            ...createCategoryRows("textile"),
          ],
        }),
        
        new Paragraph({ spacing: { before: 200 } }),
        
        heading2("3.6 Automotive Parts & Vehicles"),
        accentPara("Categorie: Automobile & Pieces Detachees | السيارات وقطع الغيار"),
        bodyPara("With over 7 million vehicles on Algerian roads and a growing automotive assembly industry featuring partnerships with major international brands, this category addresses substantial ongoing demand for spare parts, accessories, maintenance equipment, and complete vehicles. Both the aftermarket for existing vehicle fleets and OEM requirements for assembly plants represent significant opportunities."),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: 40, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Subcategory (FR)", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
                new TableCell({
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Subcategory (AR)", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Key Products", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
              ],
            }),
            ...createCategoryRows("automotive"),
          ],
        }),
        
        new Paragraph({ spacing: { before: 200 } }),
        
        heading2("3.7 Additional Major Categories Overview"),
        bodyPara("Beyond the six detailed categories above, AlgeriaTrade.dz supports twenty-two additional product categories, each structured with full French/Arabic bilingual support and subcategory organization tailored to Algerian market requirements. The following summary presents these remaining categories with their primary focus areas and key subcategories."),
        
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "D0D5DD" },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
          },
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Category (FR)", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Category (AR)", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
                new TableCell({
                  width: { size: 40, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: P.surface },
                  children: [new Paragraph({ children: [new TextRun({ text: "Key Subcategories", bold: true, size: 21, font: F.body })] })],
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                }),
              ],
            }),
            ...createAdditionalCategoriesRows(),
          ],
        }),
        
        new Paragraph({ spacing: { before: 200 } }),
        
        // SECTION 4
        heading1("4. Buyer Features & Functionality Copy"),
        
        heading2("4.1 RFQ (Request for Quotation) System"),
        accentPara("Module: Demande de Devis | طلب عرض السعر"),
        
        heading3("RFQ Landing Page Headline"),
        bodyPara('"Postez votre Besoin et Recevez des Offres de Fournisseurs Verifies" / "أعلنوا عن احتياجاتكم وتلقوا عروضاً من موردين موثوقين" - This headline communicates the core value proposition of the RFQ system: buyers describe what they need, and qualified suppliers compete to offer their best prices and terms.'),
        
        heading3("RFQ Form Fields Copy"),
        bodyPara('Product Title Field Label: "Titre du Produit Recherche" / "اسم المنتج المطلوب" - Clear instruction for users to name the product or category they are sourcing. Example placeholder: "Machine CNC pour travail du metal - Capacite 5 axes".'),
        
        bodyPara('Quantity Field Label: "Quantite Souhaitee" / "الكمية المطلوبة" - Supports both unit-based and container-load quantities common in international trade. Includes unit selector with options: Pieces, Cartons, Pallets, 20ft Container, 40ft Container.'),
        
        bodyPara('Specifications Field: "Specifications Techniques Detaillees" / "المواصفات الفنية التفصيلية" - Multi-line text area for detailed technical requirements, material specifications, quality standards, certification requirements, and any other details suppliers need to provide accurate quotations.'),
        
        bodyPara('Destination Port: "Port de Destination en Algerie" / "ميناء الوصول في الجزائر" - Dropdown menu listing major Algerian ports: Port d Algiers, Port d Oran, Port de Skikda, Port d Annaba, Port de Mostaganem, with option for inland delivery to specific wilaya.'),
        
        bodyPara('Expected Delivery Date: "Delai de Livraison Souhaite" / "موعد التسليم المتوقع" - Calendar selection with helpful presets: Urgent (moins de 30 jours), Standard (30-60 jours), Economique (60-90 jours), Flexible (negotiable).'),
        
        heading3("RFQ Submission Confirmation"),
        bodyPara('"Votre demande de devis a ete publiee avec succes! Nos fournisseurs verifies seront notifies immediatement. Vous recevrez les premieres offres sous 24-48 heures." / "تم نشر طلب عرض السعر بنجاح! سيتم إشعار الموردين الموثوقين فوراً. ستتلقون العروض الأولى خلال 24-48 ساعة." - This confirmation message sets clear expectations about timing while reassuring buyers about the verification status of potential suppliers.'),
        
        heading2("4.2 Supplier Discovery & Verification"),
        accentPara("Module: Decouverte Fournisseurs | اكتشاف الموردين"),
        
        heading3("Verified Supplier Badge Copy"),
        bodyPara('"Fournisseur Verifie" / "مورد موثق" - Primary badge displayed on verified supplier profiles. Tooltip explanation: "Ce fournisseur a passe notre processus de verification complet incluant la verification de l entreprise licence commerciale, capacite de production, et historique commercial." / "تم التحقق من هذا المورد من خلال عملية شاملة تتضمن الترخيص التجاري وقدرة الإنتاج والسجل التجاري."'),
        
        bodyPara('"Usine Auditee" / "مصنع مدقق" - Higher-tier badge for suppliers who have undergone physical factory audits. Tooltip: "Notre equipe d inspection a visite personnellement cette usine pour verifier les installations de production, systemes de controle qualite, et capacites reelles." / "قام فريق التفتيش بزيارة هذا المصنع شخصياً للتحقق من مرافق الإنتاج وأنظمة الجودة والقدرات الفعلية."'),
        
        heading3("Supplier Profile Sections"),
        bodyPara('Company Overview Section Title: "Presentation de l Entreprise" / "نبذة عن الشركة" - Comprehensive company description including founding year, employee count, main products, export markets, certifications, and competitive advantages.'),
        
        bodyPara('Production Capacity Section: "Capacites de Production" / "قدرات الإنتاج" - Details on monthly output, lead times, customization capabilities, OEM/ODM experience, and quality control processes.'),
        
        bodyPara('Trade History Section: "Historique Commercial" / "السجل التجاري" - Aggregated data on total transactions, buyer satisfaction ratings, on-time delivery percentage, and years of platform membership building trust through transparency.'),
        
        heading2("4.3 Secured Trading Service"),
        accentPara("Module: Transaction Securisee | المعاملة الآمنة"),
        
        heading3("Service Explanation Copy"),
        bodyPara('"Protection Complete pour vos Transactions Internationales" / "حماية كاملة لمعاملاتكم الدولية" - Main headline emphasizing security benefits. Supporting text explains how AlgeriaTrade.dz acts as neutral intermediary holding buyer funds securely until delivery confirmation, protecting both parties from fraud and non-performance risks.'),
        
        bodyPara('Process Steps (French): "1. Acheteur paie sur compte securise -> 2. Fournisseur expedie la marchandise -> 3. Acheteur confirme reception -> 4. Fournisseur recoit le paiement" - Clear four-step process visualization showing the secure transaction flow from payment to fund release.'),
        
        bodyPara('Process Steps (Arabic): "1. يدفع المشتري في الحساب الآمن -> 2. يرسل المورد البضاعة -> 3. يؤكد المشترى الاستلام -> 4. يستلم المورد الدفع" - Same process presented in Arabic for complete bilingual coverage.'),
        
        heading3("Trust Badges & Guarantees"),
        bodyPara('"Remboursement Garanti" / "ضمان الاسترداد" - If goods do not match description or fail quality inspection, buyers receive full refund. "Livraison a Temps ou Indemnisation" / "التسليم في الموعد أو التعويض" - Late deliveries trigger automatic compensation from supplier performance bond held by platform.'),
        
        // SECTION 5
        heading1("5. Seller Features & Functionality Copy"),
        
        heading2("5.1 Seller Registration & Onboarding"),
        accentPara("Module: Inscription Vendeur | تسجيل البائع"),
        
        heading3("Registration Page Headline"),
        bodyPara('"Rejoignez le Plus Grand Reseau B2B d Algerie" / "انضموا إلى أكبر شبكة أعمال B2B في الجزائر" - Compelling invitation emphasizing scale and market leadership. Subheading: "Connectez-vous avec des milliers d acheteurs algeriens et internationaux cherchant vos produits." / "تواصلوا مع آلاف المشترين الجزائريين والدوليين الذين يبحثون عن منتجاتكم."'),
        
        heading3("Registration Form Key Fields"),
        bodyPara('Company Legal Name: "Raison Sociale de l Entreprise" / "اسم الشركة القانوني" - Must match official commercial registry documents. Required for legal compliance and invoice generation.'),
        
        bodyPara('Commercial Register Number: "Numero de Registre de Commerce (RC)" / "رقم السجل التجاري" - Unique identifier issued by Algerian commercial registry. Cross-referenced with national database for verification.'),
        
        bodyPara('Tax Identification: "Numero d Identification Fiscale (NIF)" / "الرقم التعريفي الضريبي" - Tax ID required for invoicing and compliance with Algerian tax regulations.'),
        
        bodyPara('Physical Address: "Adresse de l Usine ou Siege Social" / "عنوان المصنع أو المقر الرئيسي" - Physical location required for potential audit visits and logistics planning. Supports all Algerian wilayas with postal code validation.'),
        
        heading2("5.2 Product Listing Management"),
        accentPara("Module: Gestion des Produits | إدارة المنتجات"),
        
        heading3("Add Product Page Copy"),
        bodyPara('"Ajouter un Nouveau Produit au Catalogue" / "إضافة منتج جديد للكatalog" - Clear page title indicating action purpose. Supporting guidance: "Remplissez les informations ci-dessous pour creer une fiche produit professionnelle qui attirera des acheteurs qualifies." / "املأوا المعلومات أدناه لإنشاء ملف احترافي سيجذب مشتريين مؤهلين."'),
        
        bodyPara('Product Name Field: "Nom du Produit (Francais & Anglais recommande)" / "اسم المنتج (يُنصح بالفرنسية والإنجليزية)" - Encourages bilingual naming for broader international visibility while maintaining French as primary per Algerian commercial norms.'),
        
        bodyPara('Minimum Order Quantity: "Quantite Minimale de Commande (MOQ)" / "الحد الأدنى للطلب" - Critical field for B2B transactions helping buyers understand supplier requirements. Common formats: 100 pieces, 1 pallet, 1x20ft container.'),
        
        bodyPara('Price Terms: "Conditions de Prix (FOB/CIF/EXW)" / "شروط الأسعار" - Supports standard Incoterms with explanations adapted for Algerian import context. FOB recommended for experienced importers; CIF suggested for first-time buyers wanting included shipping.'),
        
        heading2("5.3 Seller Analytics Dashboard"),
        accentPara("Module: Tableau de Bord Analytique | لوحة التحليلات"),
        
        heading3("Dashboard Metrics Copy"),
        bodyPara('Total Impressions: "Vues de vos Produits" / "مشاهدات منتجاتكم" - Count of how many times seller products appeared in search results and category browsing. Helps optimize product titles and images.'),
        
        bodyPara('Inquiry Conversion Rate: "Taux de Transformation Demandes" / "معدل تحويل الاستفسارات" - Percentage of product views that converted to buyer inquiries. Industry benchmark provided for comparison against similar sellers.'),
        
        bodyPara('Response Time Average: "Temps de Reponse Moyen" / "متوسط وقت الرد" - Critical metric affecting buyer satisfaction. Target: under 4 hours during business hours. Automated alerts when inquiries remain unanswered beyond threshold.'),
        
        bodyPara('Quote Success Rate: "Taux de Reussite des Devis" / "معدل نجاح عروض الأسعار" - Percentage of quotes that resulted in confirmed orders. Helps sellers refine pricing strategy and quotation competitiveness.'),
        
        // SECTION 6
        heading1("6. Marketing & Promotional Copy"),
        
        heading2("6.1 Email Marketing Templates"),
        accentPara("Templates: Emails Marketing | قوالب التسويق بالبريد الإلكتروني"),
        
        heading3("Welcome Email (New Buyer)"),
        bodyPara('Subject Line: "Bienvenue sur AlgeriaTrade.dz - Commencez votre Sourcing International!" / "مرحباً بكم في AlgeriaTrade.dz - ابدأوا التوريد الدولي!" - Welcoming and action-oriented subject encouraging immediate engagement.'),
        
        bodyPara('Email Body Opening: "Cher professionnel, Nous sommes ravis de vous accueillir sur AlgeriaTrade.dz, la premiere plateforme B2B concue specifiquement pour les entreprises algeriennes. Vous faites maintenant partie d un reseau de plus de [X] acheteurs et vendeurs actifs qui echangent chaque jour des millions de dinars de produits et services." - Personalized welcome establishing community membership and platform scale.'),
        
        bodyPara('Value Proposition Summary: "Avec AlgeriaTrade.dz, vous beneficiez de: Fournisseurs verifies et audites, Protection transactionnelle complete, Support client en Francais et Arabe, Logistique adaptee aux ports algeriens, Paiement securise adapte au marche local" - Bullet-point summary of key benefits driving immediate value recognition.'),
        
        heading3("Inquiry Notification Email"),
        bodyPara('Subject Line: "Nouvelle Demande de Devis pour: [Nom du Produit]" / "طلب عرض سعر جديد لـ: [اسم المنتج]" - Urgent notification prompting immediate seller response to capture buyer interest while hot.'),
        
        bodyPara('Email Body: "Bonjour [Nom du Vendeur], Un acheteur potentiel est interesse par votre produit [Nom du Produit]. Details de la demande: Quantite: [Quantite], Destination: [Wilaya/Port], Delai souhaite: [Delai]. Connectez-vous maintenant pour repondre et transformer cette demande en commande!" - Structured information presentation enabling quick assessment and rapid response.'),
        
        heading2("6.2 Landing Page Copy Variants"),
        accentPara("Pages: Pages de Destination | صفحات الهبوط"),
        
        heading3("Seasonal Campaign - Ramadan Promotion"),
        bodyPara('Headline: "Approvisionnez-vous pour le Ramadan - Delais Express Garantis!" / "زودوا لعيد رمضان - مواعيد سريعة مضمونة!" - Seasonally relevant headline connecting to largest consumption period in Algerian calendar.'),
        
        bodyPara('Subheadline: "Produits alimentaires, textile, electromenager et decoration - Livraison avant le debut du jeun. Commandez maintenant et beneficiez de tarifs exclusifs Ramadan." - Specific product categories relevant to Ramadan preparation with delivery guarantee addressing seasonal urgency.'),
        
        bodyPara('Urgency Element: "Offre limitee: Jusqu au [Date] seulement. Les commandes apres cette date ne peuvent pas etre garanties pour livraison pre-Ramadan." - Scarcity-driven urgency encouraging prompt decision-making without artificial pressure tactics.'),
        
        heading3("Industry-Specific - Construction Sector"),
        bodyPara('Headline: "Materiaux de Construction - Prix Usine Directement en Algerie" / "مواد البناء - أسعار المصنع مباشرة إلى الجزائر" - Direct-from-factory value proposition appealing to cost-conscious construction procurement professionals.'),
        
        bodyPara('Body Copy: "Les chefs de chantier et acheteurs du BTP font confiance a AlgeriaTrade.dz pour approvisionner leurs projets en ciment, acier, materiaux electriques et outillage. Comparez les prix de fournisseurs verifies, commandez en containers complets ou partiels, et beneficiez de notre expertise logistique pour tous les ports algeriens." - Speaks directly to construction industry persona with specific use cases and benefits.'),
        
        heading2("6.3 Social Media Copy"),
        accentPara("Reseaux Sociaux: Copy pour Medias Sociales | وسائل التواصل الاجتماعي"),
        
        heading3("LinkedIn Post Template (Professional Audience)"),
        bodyPara('Post Content: "Les entreprises algeriennes accelerent leur transformation digitale avec AlgeriaTrade.dz. Notre plateforme B2B connecte deja [X] entreprises locales avec des fournisseurs internationaux verifies, reduisant les delais d approvisionnement de 40% et les couts d importation de 15-25%. Decouvrez comment votre entreprise peut beneficier du commerce electronique B2B adapte au marche algerien. #AlgeriaTrade #CommerceB2B #ImportExportAlgerie #DigitalAlgerie" - Professional tone with statistics establishing credibility, relevant hashtags for discovery.'),
        
        heading3("Facebook Post Template (Broader Business Audience)"),
        bodyPara('Post Content: "Vous cherchez des fournisseurs fiables pour votre entreprise? AlgeriaTrade.dz vous connecte avec des milliers de fournisseurs verifies dans le monde entier! Produits verifies, Paiement securise, Livraison en Algerie Visitez notre site et commencez a economiser sur vos achats professionnels aujourd hui! Lien en commentaire #Algerie #Business #Import #Fournisseurs" - Emoji-enhanced casual tone suitable for Facebook algorithm preferences, clear value props, call-to-action directing to link.'),
        
        // SECTION 7
        heading1("7. Algerian Market Localization Details"),
        
        heading2("7.1 Language & Cultural Adaptations"),
        accentPara("Localisation: Langue & Culture | اللغة والثقافة"),
        
        bodyPara("AlgeriaTrade.dz implements comprehensive linguistic and cultural localization extending beyond simple translation to genuine market adaptation. Our French variant uses terminology familiar to Algerian business professionals, incorporating local expressions where appropriate for rapport-building, while maintaining formal register in contracts and official communications. The Arabic variant follows Modern Standard Arabic norms with Maghrebi vocabulary influences where these enhance user comfort without compromising professionalism."),
        
        bodyPara("Date formatting respects local conventions: DD/MM/YYYY for French interface, YYYY/MM/DD for Arabic following regional administrative practices. Number formatting uses space as thousands separator (1 000 000) rather than comma, matching Algerian accounting standards. Currency display defaults to DZD (Algerian Dinar) with USD/EUR conversion available, using official Bank of Algeria exchange rates updated daily. Address formats accommodate the unique Algerian structure: [Building Name], [Street Name], [Wilaya], [Postal Code], avoiding province/state fields irrelevant to local geography."),
        
        heading2("7.2 Payment Method Integration"),
        accentPara("Paiement: Modes de Paiement Locals | طرق الدفع المحلية"),
        
        bodyPara("Payment integration addresses the specific banking landscape of Algeria where international payment cards face restrictions and local alternatives dominate. Primary supported methods include CIB (Carte Internationale Bancaire) cards issued by all major Algerian banks, enabling online payments for domestic transactions. CCP (Cheques Postaux Algeriens) integration allows payment via postal account transfer, reaching unbanked populations and smaller businesses in rural wilayas. Bank transfer support covers all major institutions including BNA, BEA, CPA, BADR, and Societe Generale Algeria, with automatic reconciliation against order references."),
        
        bodyPara("For international supplier payments, AlgeriaTrade.dz facilitates documentary letters of credit through partner banks, handles currency conversion at competitive rates, and ensures compliance with Central Bank of Algeria foreign exchange regulations. The platform provides detailed cost breakdowns including applicable customs duties, VAT (TVA in Algeria currently 19% standard rate), and bank charges, eliminating surprise costs that have traditionally deterred Algerian businesses from international procurement."),
        
        heading2("7.3 Logistics & Customs Adaptation"),
        accentPara("Logistique: Douanes & Transport | الجمارك والنقل"),
        
        bodyPara("Logistics features are engineered around Algeria port infrastructure and customs procedures. Primary entry points supported include Port of Algiers (largest container facility), Port of Oran (western region hub), Port of Skikda (petrochemical and general cargo), Port of Annaba (eastern region), and Port of Mostaganem (developing capacity). The platform integrates real-time vessel tracking for ships bound to these ports, estimated clearance times based on historical data by product category, and documentation checklists specific to Algerian customs requirements."),
        
        bodyPara("Customs documentation assistance generates properly formatted commercial invoices, certificates of origin, packing lists, and bills of lading compliant with Algerian National Customs (Douanes Algeriennes) requirements. HS code lookup helps sellers correctly classify products for accurate duty calculation, while the integrated duty calculator provides transparent landed cost estimates before purchase commitment. For regulated products requiring import licenses (foodstuffs, pharmaceuticals, certain chemicals), the platform identifies licensing requirements early in the sourcing process and connects buyers with accredited licensing consultants."),
        
        heading2("7.4 Regulatory Compliance Features"),
        accentPara("Conformite: Reglementations Algérienne | اللوائح الجزائرية"),
        
        bodyPara("AlgeriaTrade.dz incorporates compliance features designed for the Algerian regulatory environment. Product listings include mandatory conformity marking indicators: products requiring NOM (Norme Algerienne) certification display clear labeling, while exempt categories are appropriately flagged. Food product listings prompt for HACCP certification status and halal certification where relevant to the predominantly Muslim consumer base. Electrical goods indicate CE marking requirements and voltage compatibility (230V/50Hz Algerian standard)."),
        
        bodyPara("The platform maintains updated databases of prohibited and restricted imports per Algerian trade regulations, automatically flagging non-compliant products during listing submission and preventing buyers from ordering restricted items. For controlled substances requiring special import authorization (certain chemicals, pharmaceutical precursors, dual-use items), the platform facilitates permit applications through integrated government portal connections where available. Seller verification includes checks against sanctions lists and politically exposed persons databases, ensuring platform integrity and regulatory compliance."),
        
        // SECTION 8
        heading1("8. Customer Support & Help Center Copy"),
        
        heading2("8.1 Help Center Structure"),
        accentPara("Support: Centre d Aide | مركز المساعدة"),
        
        heading3("Help Center Welcome Message"),
        bodyPara('Comment pouvons-nous vous aider aujourd hui? / كيف يمكننا مساعدتك اليوم? - Welcoming question inviting users to state their needs. Below this, categorized help topics present themselves as clickable cards: "Mon Compte & Inscription", "Commandes & Paiements", "Expedition & Livraison", "Retours & Remboursements", "Pour les Vendeurs", "Contactez-nous" - Each leading to focused FAQ sections addressing common questions with searchable knowledge base functionality.'),
        
        heading3("FAQ Section Examples"),
        bodyPara('Q: Comment fonctionne la verification des fournisseurs? / كيف يعمل التحقق من الموردين؟ A: Notre processus de verification en 3 etapes comprend: 1) Verification documentaire (licence commerciale, registre RC, identite juridique), 2) Verification operationnelle (capacites de production, certifications ISO, references clients), 3) Verification continue (suivi des performances, resolution des litiges, mises a jour periodiques). Seuls les fournisseurs passant ces 3 etapes recoivent le badge Verifie.'),
        
        bodyPara('Q: Quels sont les delais de livraison vers l Algerie? / ما هي مواعيد التوصيل إلى الجزائر؟ A: Les delais varient selon le pays d origine et le mode d expedition: Europe: 10-15 jours, Chine: 25-35 jours, Turquie: 7-12 jours, Autres: selon accord. Ces delais incluent le temps de transit maritime/aerien et le dedouanement en Algerie. Les commandes urgentes peuvent beneficiere d options express avec surcout calcule a la commande.'),
        
        heading2("8.2 Live Chat Scripts"),
        accentPara("Chat en Direct: Scripts Chat | نصوص المحادثة المباشرة"),
        
        heading3("Greeting Script (Auto-response)"),
        bodyPara('"Bonjour! Bienvenue sur le support AlgeriaTrade.dz. Je suis [Nom], votre conseiller dedie. Comment puis-je vous aider aujourd hui? Vous pouvez aussi taper votre question et je vous repondrai dans les plus brefs delais. / مرحباً!مرحباً بكم في دعم AlgeriaTrade.dz. أنا [الاسم]، مستشاركم المخصص. كيف يمكنني مساعدتك اليوم؟"'),
        
        heading3("Issue Escalation Script"),
        bodyPara('"Je comprends parfaitement votre frustration concernant ce probleme. Permettez-moi de transfere votre dossier a notre equipe specialisee qui pourra vous offrir une solution personnalisee. Le delai de reponse est de maximum 2 heures ouvrables. Souhaitez-vous que je reste en ligne avec vous pendant ce transfert?" / أفهم تماماً إحباطكم من هذه المشكلة. دعوني أحول ملفكم إلى فريقنا المتخصص الذي سيقدم لكم حلاً personnalisé. وقت الاستجابة بحد أقصى ساعتين عمل. هل تريدون أن أبقى معكم أثناء هذا التحويل؟'),
        
        // Closing section
        new Paragraph({ spacing: { before: 600 } }),
        accentPara("Document Prepared for AlgeriaTrade.dz Platform Team | وثيقة معدّة لفريق منصة AlgeriaTrade.dز"),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ 
            text: "This comprehensive copy guide covers all modules, features, and user touchpoints for launching and operating the AlgeriaTrade.dz B2B e-commerce platform in the Algerian market.", 
            size: 20, 
            italics: true, 
            color: c(P.secondary),
            font: F.body
          })],
        }),
      ],
    },
  ],
});

// Generate the document
async function generateDocument() {
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync("/home/z/my-project/download/AlgeriaTrade_B2B_Platform_Copy_Guide.docx", buffer);
  console.log("Document generated successfully!");
}

generateDocument().catch(console.error);
